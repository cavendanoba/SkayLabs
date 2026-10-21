// functions/api/discordia/admin-login.js
//
// Equivalente a backend/api/discordia/admin-login.js (Vercel)
// Ruta resultante: POST /api/discordia/admin-login
//
// Cambios clave respecto a la versión de Vercel:
//   - handler(req, res)  →  onRequestPost({ request, env })
//   - req.body           →  await request.json()
//   - res.status(x).json →  return json(data, x)
//   - process.env.X      →  env.X (o env.HYPERDRIVE para la BD)

import bcrypt from 'bcryptjs';
import { getSql, json } from './_lib/db.js';
import { firmarToken } from './_lib/auth.js';

// Hash de relleno: tarda lo mismo exista o no el usuario
const HASH_FALSO = '$2a$12$.HwrUtGU1MOLtykTAPwTMuS2XQEhVcMAb01Jk2E7pw/3UPE3mXutG';

export async function onRequestPost({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, message: 'JSON inválido' }, 400);
  }

  const { username, password } = body;

  if (!username || !password) {
    return json({ ok: false, message: 'Usuario y contraseña requeridos' }, 400);
  }

  const sql = getSql(env);

  const [user] = await sql`
    SELECT * FROM admin_users WHERE username = ${username}
  `;

  // Mismo tiempo y mismo mensaje para usuario no encontrado y contraseña incorrecta
  const valid = await bcrypt.compare(String(password), user ? user.password_hash : HASH_FALSO);

  if (!user || !valid) {
    return json({ ok: false, message: 'Credenciales inválidas' }, 401);
  }

  // Token firmado: la API lo verifica en cada petición (ver _middleware.js)
  let token;
  try {
    token = await firmarToken(user.username, env.DISCORDIA_TOKEN_SECRETO);
  } catch {
    return json({ ok: false, message: 'Falta configurar DISCORDIA_TOKEN_SECRETO en Cloudflare Pages.' }, 500);
  }

  return json({ ok: true, token, username: user.username });
}

// Cloudflare Pages Functions exige manejar explícitamente otros métodos
// si quieres responder 405 en vez del 404 por defecto.
export async function onRequestGet() {
  return json({ ok: false, message: 'Método no permitido' }, 405);
}
