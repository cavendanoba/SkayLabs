// functions/api/discordia/_middleware.js
//
// Toda la API de Discordia exige sesión de admin, salvo:
//   - POST /api/discordia/admin-login   (para poder entrar)
//   - GET  /api/discordia/discordia-data (el catálogo público; sin sesión no devuelve ventas ni clientes)
import { verificarToken } from './_lib/auth.js';
import { json } from './_lib/db.js';

const PUBLICAS = [
  ['POST', '/api/discordia/admin-login'],
  ['GET', '/api/discordia/discordia-data'],
];

export async function onRequest(context) {
  const { request, env, data } = context;
  const ruta = new URL(request.url).pathname.replace(/\/+$/, '');
  const h = request.headers.get('Authorization') || '';
  const sesion = h.startsWith('Bearer ') ? await verificarToken(h.slice(7), env.DISCORDIA_TOKEN_SECRETO) : null;
  data.admin = sesion;
  const publica = PUBLICAS.some(([m, r]) => m === request.method && r === ruta);
  if (!sesion && !publica) return json({ ok: false, message: 'Inicia sesión como administrador.' }, 401);
  return context.next();
}
