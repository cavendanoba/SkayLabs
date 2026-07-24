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

  if (!user) {
    // Mismo mensaje para usuario no encontrado y contraseña incorrecta
    return json({ ok: false, message: 'Credenciales inválidas' }, 401);
  }

  const valid = await bcrypt.compare(password, user.password_hash);

  if (!valid) {
    return json({ ok: false, message: 'Credenciales inválidas' }, 401);
  }

  // Token simple (igual que la versión original de Vercel)
  const token = btoa(`${username}:${Date.now()}:${Math.random()}`);

  return json({ ok: true, token, username });
}

// Cloudflare Pages Functions exige manejar explícitamente otros métodos
// si quieres responder 405 en vez del 404 por defecto.
export async function onRequestGet() {
  return json({ ok: false, message: 'Método no permitido' }, 405);
}
