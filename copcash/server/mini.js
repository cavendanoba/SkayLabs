// Servidor HTTP mínimo con la forma de Express (get/post/put/delete/use, req.params, res.json...).
// Evita depender de Express: la app solo necesita `pg` y `bcryptjs`.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json', '.txt': 'text/plain; charset=utf-8',
};

function compilar(ruta) {
  if (ruta instanceof RegExp) return { re: ruta, nombres: [] };
  const nombres = [];
  const re = new RegExp(`^${ruta.replace(/\/:([a-zA-Z_]+)/g, (_, n) => { nombres.push(n); return '/([^/]+)'; })}/?$`);
  return { re, nombres };
}

function enriquecer(req, res) {
  res.status = (c) => { res.statusCode = c; return res; };
  res.set = (h) => { for (const [k, v] of Object.entries(h)) res.setHeader(k, v); return res; };
  res.json = (obj) => {
    const cuerpo = JSON.stringify(obj);
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.end(cuerpo);
  };
  res.sendFile = (archivo, maxAge = 0) => {
    fs.stat(archivo, (err, st) => {
      if (err || !st.isFile()) { res.statusCode = 404; res.end('No encontrado'); return; }
      const etag = `"${st.size.toString(16)}-${st.mtimeMs.toString(16)}"`;
      if (req.headers['if-none-match'] === etag) { res.statusCode = 304; res.end(); return; }
      res.setHeader('Content-Type', MIME[path.extname(archivo).toLowerCase()] || 'application/octet-stream');
      res.setHeader('ETag', etag);
      res.setHeader('Cache-Control', maxAge ? `public, max-age=${maxAge}` : 'no-cache');
      fs.createReadStream(archivo).pipe(res);
    });
  };
}

function leerCuerpo(req, limite) {
  return new Promise((resolve, reject) => {
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) { resolve(undefined); return; }
    const partes = [];
    let tam = 0;
    req.on('data', (c) => {
      tam += c.length;
      if (tam > limite) { reject(Object.assign(new Error('Cuerpo demasiado grande'), { status: 413 })); req.destroy(); return; }
      partes.push(c);
    });
    req.on('end', () => {
      const txt = Buffer.concat(partes).toString('utf8');
      if (!txt) { resolve({}); return; }
      try { resolve(JSON.parse(txt)); } catch { reject(Object.assign(new Error('JSON inválido'), { type: 'entity.parse.failed' })); }
    });
    req.on('error', reject);
  });
}

export function crearServidor({ limiteCuerpo = 200 * 1024, confiarProxy = false, base = '' } = {}) {
  base = String(base || '').replace(/\/+$/, ''); // '/copcash' o ''
  const capas = []; // { metodo|null, ruta|null, manejadores }
  const app = {};
  for (const m of ['get', 'post', 'put', 'delete']) {
    app[m] = (ruta, ...manejadores) => { capas.push({ metodo: m.toUpperCase(), ...compilar(ruta), manejadores }); return app; };
  }
  app.use = (a, ...resto) => {
    if (typeof a === 'function') capas.push({ metodo: null, re: null, prefijo: null, manejadores: [a, ...resto] });
    else capas.push({ metodo: null, re: null, prefijo: a, manejadores: resto });
    return app;
  };
  /** Sirve archivos de una carpeta; si no existe el archivo, sigue. */
  app.estaticos = (dir, maxAge = 0) => app.use((req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next();
    const rel = decodeURIComponent(req.path);
    const archivo = path.join(dir, path.normalize(rel).replace(/^([/\\])+/, ''));
    if (!archivo.startsWith(dir)) return next();
    fs.stat(archivo, (err, st) => {
      if (!err && st.isFile()) return res.sendFile(archivo, maxAge);
      if (!err && st.isDirectory() && fs.existsSync(path.join(archivo, 'index.html'))) return res.sendFile(path.join(archivo, 'index.html'));
      return next();
    });
  });

  const manejarError = [];
  app.alError = (fn) => manejarError.push(fn);

  const servidor = http.createServer(async (req, res) => {
    enriquecer(req, res);
    const url = new URL(req.url, 'http://x');
    // Publicada bajo una ruta (p. ej. skaylabs.site/copcash): se quita ese prefijo antes de enrutar.
    // Sin el prefijo también responde, para seguir usándola directo en la red local.
    if (base && url.pathname === base) { res.statusCode = 301; res.setHeader('Location', `${base}/${url.search}`); res.end(); return; }
    req.base = base && url.pathname.startsWith(`${base}/`) ? base : '';
    req.path = req.base ? url.pathname.slice(base.length) : url.pathname;
    req.query = Object.fromEntries(url.searchParams);
    const xff = req.headers['x-forwarded-for'];
    req.ip = confiarProxy && xff ? String(xff).split(',')[0].trim() : req.socket.remoteAddress;
    req.id = crypto.randomUUID();

    const fallar = (err) => {
      if (manejarError.length) manejarError[0](err, req, res, () => {});
      else { res.statusCode = err.status || 500; res.end(); }
    };
    try {
      req.body = await leerCuerpo(req, limiteCuerpo);
    } catch (e) { fallar(e); return; }

    // Recorre capas y manejadores en orden, como Express
    const pila = [];
    for (const c of capas) {
      if (c.metodo && c.metodo !== req.method && !(c.metodo === 'GET' && req.method === 'HEAD')) continue;
      if (c.prefijo && !req.path.startsWith(c.prefijo)) continue;
      let params = {};
      if (c.re) {
        const m = req.path.match(c.re);
        if (!m) continue;
        params = Object.fromEntries(c.nombres.map((n, i) => [n, decodeURIComponent(m[i + 1])]));
      }
      for (const h of c.manejadores) pila.push({ h, params });
    }
    let i = 0;
    const next = (err) => {
      if (err) { fallar(err); return; }
      const paso = pila[i++];
      if (!paso) { res.statusCode = 404; res.end('No encontrado'); return; }
      req.params = paso.params;
      try {
        const r = paso.h(req, res, next);
        if (r && typeof r.catch === 'function') r.catch(next);
      } catch (e) { next(e); }
    };
    next();
  });
  app.listen = (...a) => servidor.listen(...a);
  app.servidor = servidor;
  return app;
}

// ─── JWT HS256 (firmar y verificar) ───
const b64 = (b) => Buffer.from(b).toString('base64url');

export function firmarJwt(payload, secreto, segundos) {
  const ahora = Math.floor(Date.now() / 1000);
  const cab = b64(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const cuerpo = b64(JSON.stringify({ ...payload, iat: ahora, exp: ahora + segundos }));
  const firma = crypto.createHmac('sha256', secreto).update(`${cab}.${cuerpo}`).digest('base64url');
  return `${cab}.${cuerpo}.${firma}`;
}

export function verificarJwt(token, secreto) {
  const partes = String(token).split('.');
  if (partes.length !== 3) throw new Error('token mal formado');
  const [cab, cuerpo, firma] = partes;
  const h = JSON.parse(Buffer.from(cab, 'base64url').toString());
  if (h.alg !== 'HS256') throw new Error('algoritmo no permitido');
  const esperada = crypto.createHmac('sha256', secreto).update(`${cab}.${cuerpo}`).digest();
  const dada = Buffer.from(firma, 'base64url');
  if (dada.length !== esperada.length || !crypto.timingSafeEqual(dada, esperada)) throw new Error('firma inválida');
  const p = JSON.parse(Buffer.from(cuerpo, 'base64url').toString());
  if (!p.exp || p.exp < Math.floor(Date.now() / 1000)) throw new Error('token vencido');
  return p;
}
