import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';
import { crearServidor, firmarJwt, verificarJwt } from './mini.js';
import { pool, enTransaccion } from './db.js';
import { HttpError, validar, idParam } from './validar.js';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 24 || JWT_SECRET.startsWith('cambia')) {
  throw new Error('JWT_SECRET debe tener al menos 24 caracteres y no puede ser el valor de ejemplo.');
}

/** Fecha (AAAA-MM-DD) del último corte en o antes de `fecha`. Sin día de corte, la misma fecha. */
export function ultimoCorte(fecha, diaCorte) {
  if (!diaCorte) return fecha;
  const [a, m, d] = fecha.split('-').map(Number);
  let anio = a; let mes = m;
  if (d < diaCorte) { mes -= 1; if (mes === 0) { mes = 12; anio -= 1; } }
  const ultimoDia = new Date(anio, mes, 0).getDate();
  return `${anio}-${String(mes).padStart(2, '0')}-${String(Math.min(diaCorte, ultimoDia)).padStart(2, '0')}`;
}

/** Fecha de hoy en la zona horaria de la app (por defecto Bogotá), no en UTC. */
const hoyLocal = () => new Date().toLocaleDateString('en-CA', { timeZone: process.env.ZONA_HORARIA || 'America/Bogota' });

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// ───────────────────────── utilidades ─────────────────────────

const ruta = (fn) => (req, res, next) => Promise.resolve(fn(req, res)).then((r) => {
  if (r !== undefined && !res.headersSent) res.json(r);
}).catch(next);

// Duración de una sesión sin uso. Mientras la uses, el token se renueva solo (una vez al día).
const DURACION_SESION = 14 * 24 * 3600;
const RENOVAR_CADA = 24 * 3600;

function firmar(user) {
  return firmarJwt({ sub: String(user.id), email: user.email, v: Number(user.sesion_version) || 1 }, JWT_SECRET, DURACION_SESION);
}

async function auth(req, res, next) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) return next(new HttpError(401, 'Inicia sesión para continuar.'));
  let p;
  try {
    p = verificarJwt(token, JWT_SECRET);
  } catch {
    return next(new HttpError(401, 'Tu sesión venció. Vuelve a iniciar sesión.'));
  }
  try {
    // La versión de sesión permite anular tokens (cambio de clave, cerrar en todos los dispositivos)
    const u = (await pool.query('SELECT id, email, sesion_version FROM users WHERE id = $1', [Number(p.sub)])).rows[0];
    if (!u || Number(p.v || 1) !== Number(u.sesion_version)) return next(new HttpError(401, 'Tu sesión se cerró. Vuelve a iniciar sesión.'));
    req.userId = Number(u.id);
    req.usuarioSesion = u;
    // Renovación deslizante: si el token tiene más de un día, va uno nuevo en la respuesta
    if (Math.floor(Date.now() / 1000) - Number(p.iat || 0) > RENOVAR_CADA) res.setHeader('X-Copcash-Token', firmar(u));
    return next();
  } catch (e) {
    return next(e);
  }
}

// Límites por IP (en memoria). La IP real viene de Cloudflare cuando la app está publicada.
const VENTANA = 15 * 60 * 1000;
const DIA = 24 * 3600 * 1000;
const intentos = new Map();
const registros = new Map();
const recientes = (mapa, ip, ventana) => (mapa.get(ip) || []).filter((t) => Date.now() - t < ventana);
function registrarFallo(ip) { intentos.set(ip, [...recientes(intentos, ip, VENTANA), Date.now()]); }
function limitarLogin(req, _res, next) {
  if (recientes(intentos, req.ip, VENTANA).length >= 10) return next(new HttpError(429, 'Demasiados intentos fallidos. Espera 15 minutos.'));
  return next();
}
function limitarRegistro(req, _res, next) {
  const lista = recientes(registros, req.ip, DIA);
  if (lista.length >= 3) return next(new HttpError(429, 'Ya se crearon varias cuentas desde tu conexión hoy. Intenta mañana.'));
  registros.set(req.ip, [...lista, Date.now()]);
  return next();
}
// Limpieza periódica para que los mapas no crezcan sin fin
setInterval(() => {
  for (const [m, v] of [[intentos, VENTANA], [registros, DIA]]) for (const ip of m.keys()) if (!recientes(m, ip, v).length) m.delete(ip);
}, 60 * 60 * 1000).unref();

// Hash de relleno: el login tarda lo mismo exista o no el correo
const HASH_FALSO = bcrypt.hashSync('copcash-relleno', 11);

async function verificarPropio(tabla, id, userId, db = pool) {
  if (id == null) return;
  const r = await db.query(`SELECT 1 FROM ${tabla} WHERE id = $1 AND user_id = $2`, [id, userId]);
  if (!r.rowCount) throw new HttpError(400, `No encontré ese registro en ${tabla.replace('_', ' ')}.`);
}

// ───────────────────────── esquemas ─────────────────────────

const ESQ = {
  categorias: {
    nombre: { tipo: 'texto', req: true, largo: 60 },
    icono: { tipo: 'texto', largo: 8, def: '•', nulo: false },
    presupuesto: { tipo: 'numero', min: 0, def: 0, nulo: false },
    orden: { tipo: 'entero', min: 0, max: 999, def: 0, nulo: false },
    activa: { tipo: 'bool', def: true, nulo: false },
    fija: { tipo: 'bool', def: false, nulo: false },
  },
  medios_pago: {
    nombre: { tipo: 'texto', req: true, largo: 60 },
    tipo: { tipo: 'enum', valores: ['debito', 'efectivo', 'credito', 'otro'], req: true },
    deuda_id: { tipo: 'id' },
    activo: { tipo: 'bool', def: true, nulo: false },
  },
  deudas: {
    nombre: { tipo: 'texto', req: true, largo: 80 },
    tipo: { tipo: 'enum', valores: ['tarjeta', 'credito', 'nomina', 'educativo', 'otro'], req: true },
    saldo: { tipo: 'numero', min: 0, def: 0, nulo: false },
    tasa_mensual: { tipo: 'numero', min: 0, max: 0.2, def: 0, nulo: false },
    cuota: { tipo: 'numero', min: 0, def: 0, nulo: false },
    cuotas_restantes: { tipo: 'entero', min: 0, max: 600 },
    mi_porcentaje: { tipo: 'numero', min: 0, max: 100, def: 100, nulo: false },
    compartida: { tipo: 'bool', def: false, nulo: false },
    descuento_nomina: { tipo: 'bool', def: false, nulo: false },
    activa: { tipo: 'bool', def: true, nulo: false },
    notas: { tipo: 'texto', largo: 1000 },
    color: { tipo: 'color' },
    dia_corte: { tipo: 'entero', min: 1, max: 31 },
    dia_pago: { tipo: 'entero', min: 1, max: 31 },
    cupo: { tipo: 'numero', min: 0, max: 1e11 },
    cuota_manejo: { tipo: 'numero', min: 0, max: 1e9, def: 0, nulo: false },
    cargos: { tipo: 'cargos', nulo: false },
  },
  gastos_recurrentes: {
    nombre: { tipo: 'texto', req: true, largo: 80 },
    categoria_id: { tipo: 'id' },
    monto: { tipo: 'numero', min: 0, req: true },
    activo: { tipo: 'bool', def: true, nulo: false },
    orden: { tipo: 'entero', min: 0, max: 999, def: 0, nulo: false },
  },
  cuentas: {
    nombre: { tipo: 'texto', req: true, largo: 60 },
    tipo: { tipo: 'enum', valores: ['ahorros', 'corriente', 'billetera', 'efectivo', 'otra'], def: 'ahorros', nulo: false },
    entidad: { tipo: 'texto', largo: 60 },
    saldo: { tipo: 'numero', min: -1e11, max: 1e11, def: 0, nulo: false },
    color: { tipo: 'color' },
    activa: { tipo: 'bool', def: true, nulo: false },
    orden: { tipo: 'entero', min: 0, max: 999, def: 0, nulo: false },
  },
  ahorros: {
    nombre: { tipo: 'texto', req: true, largo: 60 },
    tipo: { tipo: 'enum', valores: ['pension', 'cesantias', 'cooperativa', 'otro'], req: true },
    entidad: { tipo: 'texto', largo: 60 },
    saldo_inicial: { tipo: 'numero', min: 0, max: 1e11, def: 0, nulo: false },
    fecha_inicial: { tipo: 'fecha' },
    aporte_mensual: { tipo: 'numero', min: 0, max: 1e10, def: 0, nulo: false },
    pct_salario: { tipo: 'numero', min: 0, max: 1 },
    descuento_nomina: { tipo: 'bool', def: false, nulo: false },
    meta: { tipo: 'numero', min: 0, max: 1e11 },
    color: { tipo: 'color' },
    activa: { tipo: 'bool', def: true, nulo: false },
  },
  escenarios: {
    nombre: { tipo: 'texto', req: true, largo: 80 },
    parametros: { tipo: 'json', def: {}, nulo: false },
  },
};

// Llaves foráneas que deben pertenecer al mismo usuario
const FK = { deuda_id: 'deudas', categoria_id: 'categorias', medio_pago_id: 'medios_pago', cuenta_id: 'cuentas', ahorro_id: 'ahorros' };

const ORDEN = {
  categorias: 'orden, nombre',
  medios_pago: 'id',
  deudas: 'activa DESC, descuento_nomina, id',
  gastos_recurrentes: 'orden, id',
  escenarios: 'principal DESC, id',
  cuentas: 'activa DESC, orden, id',
  ahorros: 'activa DESC, id',
};

function crud(app, recurso, tabla) {
  const esq = ESQ[tabla];
  app.get(`/api/${recurso}`, auth, ruta(async (req) => (await pool.query(
    `SELECT * FROM ${tabla} WHERE user_id = $1 ORDER BY ${ORDEN[tabla]}`, [req.userId])).rows));

  app.post(`/api/${recurso}`, auth, ruta(async (req) => {
    const d = validar(req.body, esq);
    for (const [k, t] of Object.entries(FK)) if (k in d) await verificarPropio(t, d[k], req.userId);
    const cols = Object.keys(d);
    const r = await pool.query(
      `INSERT INTO ${tabla} (user_id, ${cols.join(', ')}) VALUES ($1, ${cols.map((_, i) => `$${i + 2}`).join(', ')}) RETURNING *`,
      [req.userId, ...cols.map((c) => d[c])]);
    return r.rows[0];
  }));

  app.put(`/api/${recurso}/:id`, auth, ruta(async (req) => {
    const id = idParam(req.params.id);
    const d = validar(req.body, esq, { parcial: true });
    for (const [k, t] of Object.entries(FK)) if (k in d) await verificarPropio(t, d[k], req.userId);
    const cols = Object.keys(d);
    if (!cols.length) throw new HttpError(400, 'No hay cambios para guardar.');
    const extra = ['deudas', 'escenarios'].includes(tabla) ? ', updated_at = NOW()' : '';
    const r = await pool.query(
      `UPDATE ${tabla} SET ${cols.map((c, i) => `${c} = $${i + 3}`).join(', ')}${extra} WHERE id = $1 AND user_id = $2 RETURNING *`,
      [id, req.userId, ...cols.map((c) => d[c])]);
    if (!r.rowCount) throw new HttpError(404, 'No encontré ese registro.');
    return r.rows[0];
  }));

  app.delete(`/api/${recurso}/:id`, auth, ruta(async (req) => {
    const r = await pool.query(`DELETE FROM ${tabla} WHERE id = $1 AND user_id = $2`, [idParam(req.params.id), req.userId]);
    if (!r.rowCount) throw new HttpError(404, 'No encontré ese registro.');
    return { ok: true };
  }));
}

// ─────────────────── datos por defecto de una cuenta nueva ───────────────────

const CATEGORIAS_BASE = [
  ['Mercado', '🛒', 0], ['Almuerzos', '🍽️', 0], ['Transporte', '🛵', 0], ['Comida y salidas', '🍔', 0],
  ['Suscripciones', '💻', 0], ['Compras personales', '👟', 0], ['Hogar', '🏠', 0], ['Familia', '👪', 0],
  ['Salud', '⚕️', 0], ['Otros', '📌', 0],
];

export async function crearCuentaBase(c, userId) {
  await c.query('INSERT INTO perfiles (user_id) VALUES ($1) ON CONFLICT DO NOTHING', [userId]);
  const cuenta = async (t) => (await c.query(`SELECT COUNT(*)::int AS n FROM ${t} WHERE user_id = $1`, [userId])).rows[0].n;
  // Solo para cuentas vacías: no tocar lo que la persona ya configuró
  if (!(await cuenta('categorias'))) {
    for (const [i, [nombre, icono, presupuesto]] of CATEGORIAS_BASE.entries()) {
      await c.query('INSERT INTO categorias (user_id, nombre, icono, presupuesto, orden) VALUES ($1,$2,$3,$4,$5)', [userId, nombre, icono, presupuesto, i]);
    }
  }
  if (!(await cuenta('cuentas'))) {
    await c.query(`INSERT INTO cuentas (user_id, nombre, tipo, orden) VALUES ($1,'Cuenta de nómina','ahorros',0), ($1,'Efectivo','efectivo',1)`, [userId]);
  }
  if (!(await cuenta('escenarios'))) {
    await c.query(`INSERT INTO escenarios (user_id, nombre, parametros, principal) VALUES ($1, 'Mi plan', '{}', TRUE)`, [userId]);
  }
  // Pensión (16 % del básico entre tú y la empresa) y cesantías (un salario al año) se acumulan solas
  if (!(await cuenta('ahorros'))) {
    await c.query(`INSERT INTO ahorros (user_id, nombre, tipo, pct_salario, color) VALUES
      ($1, 'Pensión', 'pension', 0.16, '#2F5DA8'), ($1, 'Cesantías', 'cesantias', 0.0833, '#9A7B0F')`, [userId]);
  }
}

// ───────────────────────── movimientos ─────────────────────────

const ESQ_MOV = {
  fecha: { tipo: 'fecha', req: true },
  tipo: { tipo: 'enum', valores: ['gasto', 'ingreso', 'pago_deuda'], def: 'gasto', nulo: false },
  monto: { tipo: 'numero', min: 0.01, max: 1e10, req: true },
  categoria_id: { tipo: 'id' },
  medio_pago_id: { tipo: 'id' },
  cuenta_id: { tipo: 'id' },
  deuda_id: { tipo: 'id' },
  descripcion: { tipo: 'texto', largo: 200 },
  cuotas: { tipo: 'entero', min: 1, max: 72, def: 1, nulo: false },
  cuota_valor: { tipo: 'numero', min: 0, max: 1e10 },
  cuotas_pagadas: { tipo: 'entero', min: 0, max: 72, def: 0, nulo: false },
};

/**
 * Efecto de un movimiento en saldos. signo = +1 al crear, -1 al revertir.
 * - Gasto con tarjeta (deuda_id): sube lo que debes. Gasto o pago desde una cuenta: baja el saldo de la cuenta.
 * - Pago de deuda: baja la deuda. Ingreso a una cuenta: sube su saldo.
 */
async function efectoEnDeuda(c, mov, signo, userId) {
  const m = Number(mov.monto) * signo;
  if (mov.deuda_id && (mov.tipo === 'gasto' || mov.tipo === 'pago_deuda')) {
    await c.query('UPDATE deudas SET saldo = GREATEST(0, saldo + $1), updated_at = NOW() WHERE id = $2 AND user_id = $3',
      [mov.tipo === 'gasto' ? m : -m, mov.deuda_id, userId]);
  }
  if (mov.cuenta_id) {
    await c.query('UPDATE cuentas SET saldo = saldo + $1 WHERE id = $2 AND user_id = $3',
      [mov.tipo === 'ingreso' ? m : -m, mov.cuenta_id, userId]);
  }
}

async function validarMovimiento(c, d, userId) {
  for (const [k, t] of Object.entries(FK)) if (k in d) await verificarPropio(t, d[k], userId, c);
  if (d.tipo === 'pago_deuda' && !d.deuda_id) throw new HttpError(400, 'Elige la deuda que estás pagando.');
  if (d.tipo === 'gasto' && d.deuda_id && d.cuenta_id) d.cuenta_id = null; // con tarjeta no sale de una cuenta
  if (d.tipo === 'ingreso') d.deuda_id = null;
}

// ───────────────────────── app ─────────────────────────

export function crearApp() {
  const app = crearServidor({ confiarProxy: process.env.TRUST_PROXY === '1', base: process.env.BASE_PATH || '' });

  // Acceso desde internet: solo a través de skaylabs.site (la función de Cloudflare Pages pone un secreto).
  // Una petición que llega por Cloudflare sin ese secreto entró directo al origen y se rechaza.
  const SECRETO_ORIGEN = process.env.ORIGEN_SECRETO || '';
  app.use((req, _res, next) => {
    const porCloudflare = !!req.headers['cf-connecting-ip'];
    const dado = String(req.headers['x-copcash-origen'] || '');
    const valido = SECRETO_ORIGEN && dado.length === SECRETO_ORIGEN.length
      && crypto.timingSafeEqual(Buffer.from(dado), Buffer.from(SECRETO_ORIGEN));
    if (valido) {
      // IP real de quien usa la app, para los límites de intentos
      req.ip = String(req.headers['x-copcash-cliente-ip'] || req.headers['cf-connecting-ip']).split(',')[0].trim();
      return next();
    }
    if (porCloudflare && SECRETO_ORIGEN) return next(new HttpError(403, 'Entra por skaylabs.site/copcash.'));
    return next();
  });

  app.use((_req, res, next) => {
    res.set({
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'same-origin',
      'X-Frame-Options': 'DENY',
      'Content-Security-Policy': "default-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'",
    });
    next();
  });

  app.get('/api/salud', ruta(async () => {
    await pool.query('SELECT 1');
    return { ok: true };
  }));

  // ── autenticación
  app.post('/api/auth/registro', limitarLogin, limitarRegistro, ruta(async (req) => {
    if (process.env.PERMITIR_REGISTRO === '0') throw new HttpError(403, 'El registro de cuentas nuevas está cerrado.');
    const d = validar(req.body, {
      email: { tipo: 'texto', req: true, largo: 160 },
      nombre: { tipo: 'texto', largo: 80 },
      password: { tipo: 'texto', req: true, largo: 200 },
    });
    const email = d.email.toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new HttpError(400, 'Ese correo no parece válido.');
    if (d.password.length < 8) throw new HttpError(400, 'La contraseña debe tener al menos 8 caracteres.');
    const hash = await bcrypt.hash(d.password, 11);
    const user = await enTransaccion(async (c) => {
      const ex = await c.query('SELECT 1 FROM users WHERE email = $1', [email]);
      if (ex.rowCount) throw new HttpError(409, 'Ya existe una cuenta con ese correo. Inicia sesión.');
      const u = (await c.query('INSERT INTO users (email, nombre, password_hash, ultimo_ingreso) VALUES ($1,$2,$3,NOW()) RETURNING id, email, nombre, sesion_version',
        [email, d.nombre || null, hash])).rows[0];
      await crearCuentaBase(c, u.id);
      return u;
    });
    return { token: firmar(user), usuario: { id: user.id, email: user.email, nombre: user.nombre } };
  }));

  app.post('/api/auth/login', limitarLogin, ruta(async (req) => {
    const d = validar(req.body, { email: { tipo: 'texto', req: true, largo: 160 }, password: { tipo: 'texto', req: true, largo: 200 } });
    const r = await pool.query('SELECT id, email, nombre, password_hash, sesion_version FROM users WHERE email = $1', [d.email.toLowerCase().trim()]);
    const u = r.rows[0];
    const ok = await bcrypt.compare(d.password, u ? u.password_hash : HASH_FALSO);
    if (!u || !ok) {
      registrarFallo(req.ip);
      throw new HttpError(401, 'Correo o contraseña incorrectos.');
    }
    // Las cuentas de la versión anterior no tienen datos v2: los creamos al entrar
    await enTransaccion((c) => crearCuentaBase(c, u.id));
    await pool.query('UPDATE users SET ultimo_ingreso = NOW() WHERE id = $1', [u.id]);
    return { token: firmar(u), usuario: { id: u.id, email: u.email, nombre: u.nombre } };
  }));

  // Cambiar la contraseña: pide la actual y cierra las sesiones en los demás dispositivos
  app.put('/api/auth/clave', auth, limitarLogin, ruta(async (req) => {
    const d = validar(req.body, { actual: { tipo: 'texto', req: true, largo: 200 }, nueva: { tipo: 'texto', req: true, largo: 200 } });
    if (d.nueva.length < 8) throw new HttpError(400, 'La contraseña nueva debe tener al menos 8 caracteres.');
    const u = (await pool.query('SELECT id, email, password_hash FROM users WHERE id = $1', [req.userId])).rows[0];
    if (!(await bcrypt.compare(d.actual, u.password_hash))) {
      registrarFallo(req.ip);
      throw new HttpError(400, 'La contraseña actual no es correcta.');
    }
    const hash = await bcrypt.hash(d.nueva, 11);
    const n = (await pool.query('UPDATE users SET password_hash = $2, sesion_version = sesion_version + 1 WHERE id = $1 RETURNING id, email, sesion_version',
      [req.userId, hash])).rows[0];
    return { token: firmar(n) };
  }));

  // Cerrar la sesión en todos los dispositivos (incluido este)
  app.post('/api/auth/salir-todo', auth, ruta(async (req) => {
    await pool.query('UPDATE users SET sesion_version = sesion_version + 1 WHERE id = $1', [req.userId]);
    return { ok: true };
  }));

  app.get('/api/auth/sesion', auth, ruta(async (req) => {
    const u = (await pool.query('SELECT email, nombre, created_at, ultimo_ingreso FROM users WHERE id = $1', [req.userId])).rows[0];
    return u;
  }));

  // ── todo lo necesario para pintar la app en una llamada
  app.get('/api/datos', auth, ruta(async (req) => {
    const uid = req.userId;
    const q = (sql) => pool.query(sql, [uid]).then((r) => r.rows);
    const [usuario, perfil, categorias, medios, deudas, recurrentes, escenarios, cuentas, ahorros, aportes, compras] = await Promise.all([
      q('SELECT id, email, nombre FROM users WHERE id = $1').then((r) => r[0]),
      q('SELECT * FROM perfiles WHERE user_id = $1').then((r) => r[0]),
      q(`SELECT * FROM categorias WHERE user_id = $1 ORDER BY ${ORDEN.categorias}`),
      q(`SELECT * FROM medios_pago WHERE user_id = $1 ORDER BY ${ORDEN.medios_pago}`),
      q(`SELECT * FROM deudas WHERE user_id = $1 ORDER BY ${ORDEN.deudas}`),
      q(`SELECT * FROM gastos_recurrentes WHERE user_id = $1 ORDER BY ${ORDEN.gastos_recurrentes}`),
      q(`SELECT * FROM escenarios WHERE user_id = $1 ORDER BY ${ORDEN.escenarios}`),
      q(`SELECT * FROM cuentas WHERE user_id = $1 ORDER BY ${ORDEN.cuentas}`),
      q(`SELECT * FROM ahorros WHERE user_id = $1 ORDER BY ${ORDEN.ahorros}`),
      q('SELECT * FROM ahorro_aportes WHERE user_id = $1 ORDER BY fecha DESC, id DESC'),
      // compras con tarjeta que aún tienen cuotas por pagar: arman la próxima factura
      q(`SELECT m.id, m.deuda_id, m.fecha, m.monto, m.cuotas, m.cuota_valor, m.cuotas_pagadas, m.descripcion
           FROM movimientos m JOIN deudas d ON d.id = m.deuda_id AND d.tipo = 'tarjeta'
          WHERE m.user_id = $1 AND m.tipo = 'gasto' AND m.cuotas_pagadas < m.cuotas ORDER BY m.fecha`),
    ]);
    if (!usuario) throw new HttpError(401, 'Tu cuenta ya no existe.');
    return { usuario, perfil, categorias, medios, deudas, recurrentes, escenarios, cuentas, ahorros, aportes, compras, hoy: hoyLocal() };
  }));

  app.put('/api/perfil', auth, ruta(async (req) => {
    const d = validar(req.body, {
      dia_pago: { tipo: 'entero', min: 1, max: 28 },
      dia_corte: { tipo: 'entero', min: 1, max: 28 },
      salario_bruto: { tipo: 'numero', min: 0 },
      salario_neto_base: { tipo: 'numero', min: 0 },
      salario_minimo: { tipo: 'numero', min: 0 },
      auxilios: { tipo: 'numero', min: 0 },
      otras_deducciones: { tipo: 'numero', min: 0 },
      retencion: { tipo: 'numero', min: 0 },
      pct_salud: { tipo: 'numero', min: 0, max: 0.2 },
      pct_pension: { tipo: 'numero', min: 0, max: 0.2 },
      prima_legal: { tipo: 'bool' },
      prima_extralegal_pct: { tipo: 'numero', min: 0, max: 2 },
      intereses_cesantias: { tipo: 'bool' },
    }, { parcial: true });
    const cols = Object.keys(d).filter((k) => d[k] !== null);
    if (!cols.length) throw new HttpError(400, 'No hay cambios para guardar.');
    const r = await pool.query(
      `UPDATE perfiles SET ${cols.map((c, i) => `${c} = $${i + 2}`).join(', ')}, updated_at = NOW() WHERE user_id = $1 RETURNING *`,
      [req.userId, ...cols.map((c) => d[c])]);
    return r.rows[0];
  }));

  app.put('/api/usuario', auth, ruta(async (req) => {
    const d = validar(req.body, { nombre: { tipo: 'texto', largo: 80 } });
    const r = await pool.query('UPDATE users SET nombre = $2 WHERE id = $1 RETURNING id, email, nombre', [req.userId, d.nombre]);
    return r.rows[0];
  }));

  crud(app, 'categorias', 'categorias');
  crud(app, 'medios', 'medios_pago');
  crud(app, 'deudas', 'deudas');
  crud(app, 'recurrentes', 'gastos_recurrentes');
  crud(app, 'escenarios', 'escenarios');
  crud(app, 'cuentas', 'cuentas');
  crud(app, 'ahorros', 'ahorros');

  // ── aportes o retiros manuales a un ahorro (opcionalmente desde/hacia una cuenta)
  app.post('/api/ahorros/:id/aportes', auth, ruta(async (req) => {
    const ahorroId = idParam(req.params.id);
    const d = validar(req.body, {
      fecha: { tipo: 'fecha', req: true },
      monto: { tipo: 'numero', min: -1e11, max: 1e11, req: true },
      cuenta_id: { tipo: 'id' },
      nota: { tipo: 'texto', largo: 200 },
    });
    if (!d.monto) throw new HttpError(400, 'El valor no puede ser cero.');
    return enTransaccion(async (c) => {
      await verificarPropio('ahorros', ahorroId, req.userId, c);
      if (d.cuenta_id) await verificarPropio('cuentas', d.cuenta_id, req.userId, c);
      const r = await c.query(`INSERT INTO ahorro_aportes (user_id, ahorro_id, fecha, monto, cuenta_id, nota) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
        [req.userId, ahorroId, d.fecha, d.monto, d.cuenta_id || null, d.nota || null]);
      if (d.cuenta_id) await c.query('UPDATE cuentas SET saldo = saldo - $1 WHERE id = $2', [d.monto, d.cuenta_id]);
      return r.rows[0];
    });
  }));

  app.delete('/api/aportes/:id', auth, ruta(async (req) => enTransaccion(async (c) => {
    const r = (await c.query('DELETE FROM ahorro_aportes WHERE id = $1 AND user_id = $2 RETURNING *', [idParam(req.params.id), req.userId])).rows[0];
    if (!r) throw new HttpError(404, 'No encontré ese aporte.');
    if (r.cuenta_id) await c.query('UPDATE cuentas SET saldo = saldo + $1 WHERE id = $2', [r.monto, r.cuenta_id]);
    return { ok: true };
  })));

  app.post('/api/escenarios/:id/principal', auth, ruta(async (req) => {
    const id = idParam(req.params.id);
    await enTransaccion(async (c) => {
      await verificarPropio('escenarios', id, req.userId, c);
      await c.query('UPDATE escenarios SET principal = FALSE WHERE user_id = $1', [req.userId]);
      await c.query('UPDATE escenarios SET principal = TRUE WHERE id = $1', [id]);
    });
    return { ok: true };
  }));

  app.post('/api/escenarios/:id/duplicar', auth, ruta(async (req) => {
    const r = await pool.query(
      `INSERT INTO escenarios (user_id, nombre, parametros) SELECT user_id, nombre || ' (copia)', parametros
         FROM escenarios WHERE id = $1 AND user_id = $2 RETURNING *`, [idParam(req.params.id), req.userId]);
    if (!r.rowCount) throw new HttpError(404, 'No encontré ese escenario.');
    return r.rows[0];
  }));

  // ── movimientos
  app.get('/api/movimientos', auth, ruta(async (req) => {
    const d = validar(req.query, { desde: { tipo: 'fecha', req: true }, hasta: { tipo: 'fecha', req: true } });
    const r = await pool.query(
      `SELECT m.*,
              c.nombre AS categoria, c.icono, cu.nombre AS cuenta, cu.tipo AS cuenta_tipo, de.nombre AS deuda, de.tipo AS deuda_tipo,
              COALESCE(CASE WHEN m.tipo = 'gasto' THEN de.nombre END, cu.nombre) AS medio
         FROM movimientos m
         LEFT JOIN categorias c ON c.id = m.categoria_id
         LEFT JOIN cuentas cu ON cu.id = m.cuenta_id
         LEFT JOIN deudas de ON de.id = m.deuda_id
        WHERE m.user_id = $1 AND m.fecha BETWEEN $2 AND $3
        ORDER BY m.fecha DESC, m.id DESC`, [req.userId, d.desde, d.hasta]);
    return r.rows;
  }));

  app.post('/api/movimientos', auth, ruta(async (req) => {
    const d = validar(req.body, ESQ_MOV);
    // Compra registrada tarde: ya está dentro del saldo de la tarjeta, así que no lo vuelve a subir
    const yaEnSaldo = req.body?.ya_en_saldo === true;
    if (d.cuotas_pagadas > d.cuotas) throw new HttpError(400, 'Las cuotas pagadas no pueden ser más que las cuotas.');
    return enTransaccion(async (c) => {
      await validarMovimiento(c, d, req.userId);
      const cols = Object.keys(d);
      const r = await c.query(
        `INSERT INTO movimientos (user_id, ${cols.join(', ')}) VALUES ($1, ${cols.map((_, i) => `$${i + 2}`).join(', ')}) RETURNING *`,
        [req.userId, ...cols.map((k) => d[k])]);
      if (!(yaEnSaldo && r.rows[0].deuda_id && r.rows[0].tipo === 'gasto')) await efectoEnDeuda(c, r.rows[0], +1, req.userId);
      return r.rows[0];
    });
  }));

  app.put('/api/movimientos/:id', auth, ruta(async (req) => {
    const id = idParam(req.params.id);
    const d = validar(req.body, ESQ_MOV, { parcial: true });
    return enTransaccion(async (c) => {
      const prev = (await c.query('SELECT * FROM movimientos WHERE id = $1 AND user_id = $2 FOR UPDATE', [id, req.userId])).rows[0];
      if (!prev) throw new HttpError(404, 'Solo puedes editar los movimientos que registraste tú.');
      const v = { ...d, tipo: d.tipo || prev.tipo, deuda_id: 'deuda_id' in d ? d.deuda_id : prev.deuda_id,
        cuenta_id: 'cuenta_id' in d ? d.cuenta_id : prev.cuenta_id };
      await validarMovimiento(c, v, req.userId);
      // validarMovimiento ajusta cuenta/deuda según el tipo: se respetan esos ajustes
      for (const k of ['cuenta_id', 'deuda_id']) if (k in v && (k in d || (v[k] ?? null) !== prev[k])) d[k] = v[k] ?? null;
      for (const k of Object.keys(d)) if (d[k] === prev[k]) delete d[k];
      const cols = Object.keys(d);
      if (!cols.length) return prev;
      // Cambiar solo cuotas, descripción o categoría no mueve saldos
      const mueveSaldos = ['monto', 'tipo', 'deuda_id', 'cuenta_id'].some((k) => k in d);
      if (mueveSaldos) await efectoEnDeuda(c, prev, -1, req.userId);
      const r = await c.query(
        `UPDATE movimientos SET ${cols.map((k, i) => `${k} = $${i + 2}`).join(', ')} WHERE id = $1 RETURNING *`,
        [id, ...cols.map((k) => d[k])]);
      if (mueveSaldos) await efectoEnDeuda(c, r.rows[0], +1, req.userId);
      return r.rows[0];
    });
  }));

  app.delete('/api/movimientos/:id', auth, ruta(async (req) => {
    const id = idParam(req.params.id);
    return enTransaccion(async (c) => {
      const prev = (await c.query('DELETE FROM movimientos WHERE id = $1 AND user_id = $2 RETURNING *', [id, req.userId])).rows[0];
      if (!prev) throw new HttpError(404, 'Solo puedes borrar los movimientos que registraste tú.');
      await efectoEnDeuda(c, prev, -1, req.userId);
      return { ok: true };
    });
  }));

  // ── resumen de un periodo: real vs. presupuesto

  // ── compras con tarjeta que aún tienen cuotas por pagar (para el resumen de cada tarjeta)
  app.get('/api/compras-pendientes', auth, ruta(async (req) => (await pool.query(
    `SELECT m.id, m.deuda_id, m.fecha, m.monto, m.cuotas, m.cuota_valor, m.cuotas_pagadas, m.descripcion
       FROM movimientos m JOIN deudas d ON d.id = m.deuda_id AND d.tipo = 'tarjeta'
      WHERE m.user_id = $1 AND m.tipo = 'gasto' AND m.cuotas_pagadas < m.cuotas
      ORDER BY m.fecha`, [req.userId])).rows));

  // ── detalle de una deuda: compras hechas con ella (si es tarjeta) y pagos
  app.get('/api/deudas/:id/detalle', auth, ruta(async (req) => {
    const id = idParam(req.params.id);
    await verificarPropio('deudas', id, req.userId);
    const r = await pool.query(
      `SELECT m.*, c.nombre AS categoria, c.icono FROM movimientos m LEFT JOIN categorias c ON c.id = m.categoria_id
        WHERE m.user_id = $1 AND m.deuda_id = $2 AND m.tipo IN ('gasto','pago_deuda')
        ORDER BY m.fecha DESC, m.id DESC`, [req.userId, id]);
    return {
      compras: r.rows.filter((m) => m.tipo === 'gasto'),
      pagos: r.rows.filter((m) => m.tipo === 'pago_deuda'),
    };
  }));

  // ── pagar una deuda (registra el movimiento y baja el saldo)
  app.post('/api/deudas/:id/pagos', auth, ruta(async (req) => {
    const deudaId = idParam(req.params.id);
    const d = validar(req.body, {
      monto: { tipo: 'numero', min: 0.01, req: true },
      fecha: { tipo: 'fecha', req: true },
      medio_pago_id: { tipo: 'id' },
      cuenta_id: { tipo: 'id' },
      cuota_pagada: { tipo: 'bool', def: false },
      avanzar_compras: { tipo: 'bool', def: false },
      corte: { tipo: 'fecha' },
    });
    return enTransaccion(async (c) => {
      await verificarPropio('deudas', deudaId, req.userId, c);
      if (d.cuenta_id) await verificarPropio('cuentas', d.cuenta_id, req.userId, c);
      const deuda = (await c.query('SELECT nombre FROM deudas WHERE id = $1', [deudaId])).rows[0];
      const mov = (await c.query(
        `INSERT INTO movimientos (user_id, fecha, tipo, monto, deuda_id, cuenta_id, descripcion)
         VALUES ($1,$2,'pago_deuda',$3,$4,$5,$6) RETURNING *`,
        [req.userId, d.fecha, d.monto, deudaId, d.cuenta_id || null, `Pago ${deuda.nombre}`])).rows[0];
      await efectoEnDeuda(c, mov, +1, req.userId);
      if (d.cuota_pagada) {
        await c.query(`UPDATE deudas SET cuotas_restantes = GREATEST(0, cuotas_restantes - 1)
                        WHERE id = $1 AND cuotas_restantes IS NOT NULL`, [deudaId]);
      }
      // Pago del extracto: cada compra que entró al último corte avanza una cuota
      if (d.avanzar_compras) {
        const t = (await c.query('SELECT dia_corte, ultimo_corte_pagado FROM deudas WHERE id = $1', [deudaId])).rows[0];
        const corte = d.corte || ultimoCorte(d.fecha, t?.dia_corte);
        // Una factura se marca pagada una sola vez: un segundo abono al mismo corte no adelanta cuotas
        if (!t.ultimo_corte_pagado || corte > t.ultimo_corte_pagado) {
          await c.query(`UPDATE movimientos SET cuotas_pagadas = LEAST(cuotas, cuotas_pagadas + 1)
                          WHERE user_id = $1 AND deuda_id = $2 AND tipo = 'gasto' AND cuotas_pagadas < cuotas AND fecha <= $3`,
          [req.userId, deudaId, corte]);
          await c.query('UPDATE deudas SET ultimo_corte_pagado = $2 WHERE id = $1', [deudaId, corte]);
        }
      }
      return (await c.query('SELECT * FROM deudas WHERE id = $1', [deudaId])).rows[0];
    });
  }));

  // ── archivos del frontend
  app.estaticos(path.join(raiz, 'public'));
  app.get(/^\/(?!api\/).*/, (_req, res) => res.sendFile(path.join(raiz, 'public', 'index.html')));

  app.use('/api', (_req, _res, next) => next(new HttpError(404, 'Ruta no encontrada.')));
  app.alError((err, _req, res) => {
    if (err instanceof HttpError) return res.status(err.status).json({ error: err.message });
    if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'El cuerpo de la petición no es JSON válido.' });
    if (err.status === 413) return res.status(413).json({ error: 'La petición es demasiado grande.' });
    console.error(err);
    return res.status(500).json({ error: 'Error interno. Revisa los logs del servidor.' });
  });
  return app;
}
