import { api } from './api.js';
import { proyectar, periodoDeFecha, sumarMeses, difMeses, resumenTarjeta, rangoPeriodo } from './motor.js';

export const estado = { datos: null, cargado: 0 };

export async function cargar() {
  estado.datos = await api.get('/datos');
  estado.cargado = Date.now();
  return estado.datos;
}

/** Recarga si los datos tienen más de unos segundos (tu pareja pudo cambiar algo). */
export async function refrescar() {
  if (!estado.datos || Date.now() - estado.cargado > 5000) await cargar();
}

export const diaPago = () => estado.datos?.perfil?.dia_pago || 20;
/** Día en que se cierra cada periodo de gastos (del día de corte al día anterior del mes siguiente). */
export const diaCorte = () => estado.datos?.perfil?.dia_corte || diaPago();
export const periodoActual = () => periodoDeFecha(estado.datos?.hoy || new Date(), diaCorte());
/** Plata disponible hoy en tus cuentas activas: con eso arranca la proyección. */
export const disponibleHoy = () => (estado.datos.cuentas || []).filter((c) => c.activa).reduce((s, c) => s + Number(c.saldo), 0);

/**
 * Proyección con lo que tienes configurado: nómina y gastos (Ajustes), deudas, ahorros y cuentas.
 * Por defecto arranca en el próximo pago.
 */
export function proyeccion({ desde, meses = 12 } = {}) {
  const d = estado.datos;
  const inicio = desde || sumarMeses(periodoActual(), 1);
  return proyectar({
    perfil: d.perfil,
    deudas: d.deudas.map((x) => conFacturaPrevista(x, inicio)),
    recurrentes: d.recurrentes,
    categorias: d.categorias,
    ahorros: d.ahorros || [],
    parametros: { ahorro_inicial: disponibleHoy() },
    desde: inicio,
    meses,
  });
}

/** Presupuesto de cada categoría activa: el de las variables más los gastos fijos que tiene asignados. */
export function presupuestoPorCategoria() {
  const d = estado.datos;
  const out = new Map();
  for (const c of d.categorias) if (c.activa) out.set(c.id, { cat: c, presupuesto: c.fija ? 0 : Number(c.presupuesto), gastado: 0 });
  for (const g of d.recurrentes) {
    if (!g.activo || !g.categoria_id || !out.has(g.categoria_id)) continue;
    out.get(g.categoria_id).presupuesto += Number(g.monto);
  }
  return out;
}

/**
 * Proyección desde hoy para la vista de Proyección.
 * La plata de las cuentas ya incluye el pago de este periodo, pero todavía faltan gastos y cuotas
 * por pagar antes del próximo pago. Por eso se arranca con: disponible hoy − lo que falta pagar este
 * periodo, y las deudas avanzan la cuota de este periodo antes de proyectar los siguientes.
 */
export async function proyeccionDesdeHoy({ meses = 12 } = {}) {
  const d = estado.datos;
  const actual = periodoActual();
  const [desde, hasta] = rangoPeriodo(actual, diaCorte());
  const movs = await api.get(`/movimientos?desde=${desde}&hasta=${hasta}`);
  const deudas = d.deudas.map((x) => conFacturaPrevista(x, actual));
  const base = { perfil: d.perfil, deudas, recurrentes: d.recurrentes, categorias: d.categorias, ahorros: d.ahorros || [], desde: actual };

  // Cuotas de este periodo (las que no son por nómina) y cuánto se les ha pagado
  const p0 = proyectar({ ...base, meses: 1 }).periodos[0];
  const pagadoA = new Map();
  for (const m of movs) if (m.tipo === 'pago_deuda') pagadoA.set(String(m.deuda_id), (pagadoA.get(String(m.deuda_id)) || 0) + Number(m.monto));
  let cuotasPorPagar = 0;
  const pagadas = [];
  for (const c of p0.grupos.deudas.concat(p0.grupos.unicos.filter((u) => u.deuda_id != null))) {
    const pagado = pagadoA.get(String(c.deuda_id)) || 0;
    if (pagado >= c.monto * 0.95) pagadas.push(c.deuda_id);
    else cuotasPorPagar += c.monto - pagado;
  }

  // Lo que falta gastar del presupuesto de este periodo (fijos y variables)
  const presu = presupuestoPorCategoria();
  for (const m of movs) if (m.tipo === 'gasto' && presu.has(m.categoria_id)) presu.get(m.categoria_id).gastado += Number(m.monto);
  let presupuestoPorGastar = 0;
  for (const v of presu.values()) presupuestoPorGastar += Math.max(0, v.presupuesto - v.gastado);
  // Gastos fijos sin categoría: no hay cómo saber si ya se pagaron, se cuentan como pendientes
  for (const g of d.recurrentes) if (g.activo && (!g.categoria_id || !presu.has(g.categoria_id))) presupuestoPorGastar += Number(g.monto);

  const disponible = disponibleHoy();
  const arranque = disponible - cuotasPorPagar - presupuestoPorGastar;

  const r = proyectar({ ...base, meses: meses + 1, parametros: { ahorro_inicial: 0, omitir_primero: pagadas } });
  let acumulado = arranque;
  const periodos = r.periodos.slice(1).map((p) => {
    acumulado += p.totales.resultado;
    return { ...p, totales: { ...p.totales, acumulado } };
  });
  const primerRojo = periodos.find((x) => x.totales.acumulado < 0);
  // Deudas cuyo último pago proyectado es mucho mayor que su cuota: casi siempre saldo y cuotas que no cuadran
  const alertas = [];
  for (const dd of r.deudas) {
    const orig = d.deudas.find((x) => String(x.id) === String(dd.id));
    const cuota = Number(orig?.cuota) || 0;
    if (!cuota || orig?.tipo === 'tarjeta') continue;
    const salto = dd.historial.slice(1).find((h) => h.pago > cuota * 1.5);
    if (salto) alertas.push({ nombre: dd.nombre, clave: salto.clave, pago: salto.pago, cuota, saldo: Number(orig.saldo) || 0, restantes: orig.cuotas_restantes });
  }
  return {
    periodos,
    primerRojo: primerRojo ? primerRojo.clave : null,
    minimo: Math.min(arranque, ...periodos.map((x) => x.totales.acumulado)),
    deudas: r.deudas,
    arranque: { disponible, cuotasPorPagar, presupuestoPorGastar, total: arranque, periodo: actual },
    alertas,
  };
}

/**
 * Tarjeta con fecha de corte y pago: la factura que viene ya se conoce por sus compras, así que la
 * proyección usa ese valor en el periodo en que vence (el mismo "Próximo pago" de la tarjeta).
 */
function conFacturaPrevista(x, desde) {
  const d = estado.datos;
  if (x.tipo !== 'tarjeta' || !x.dia_corte || !x.dia_pago) return x;
  const rt = resumenTarjeta(x, (d.compras || []).filter((c) => c.deuda_id === x.id), d.hoy);
  if (!rt.vence || !(rt.estimado > 0)) return x;
  const clave = periodoDeFecha(rt.vence, diaCorte());
  if (difMeses(desde, clave) < 0) return x; // vence antes de lo que se proyecta
  return { ...x, pagos_previstos: { [clave]: rt.estimado } };
}

/** Cuentas activas y tarjetas (deudas tipo tarjeta) para escoger "con qué se pagó". Valores: "c:ID" o "t:ID". */
export function opcionesMedio({ cuentaId = null, deudaId = null, soloCuentas = false } = {}) {
  const d = estado.datos;
  const cuentas = (d.cuentas || []).filter((c) => c.activa || c.id === cuentaId);
  const tarjetas = soloCuentas ? [] : d.deudas.filter((x) => x.tipo === 'tarjeta' && (x.activa || x.id === deudaId));
  return { cuentas, tarjetas };
}

/** "c:3" → { cuenta_id: 3, deuda_id: null }; "t:5" → { cuenta_id: null, deuda_id: 5 } */
export function leerMedio(valor) {
  const [k, id] = String(valor || '').split(':');
  return { cuenta_id: k === 'c' ? Number(id) : null, deuda_id: k === 't' ? Number(id) : null };
}
