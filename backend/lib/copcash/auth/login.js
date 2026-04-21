// api/copcash/auth/login.js
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';
import { sql } from '../../db.js';
import { setCors, json, JWT_SECRET } from '../_helpers.js';

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });

  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return json(res, 400, { error: 'Email y contraseña son requeridos' });
    }

    const rows = await sql`
      SELECT * FROM cc_usuarios WHERE email = ${email.toLowerCase().trim()}
    `;
    const user = rows[0];

    // Respuesta genérica para no revelar si el email existe
    if (!user) return json(res, 401, { error: 'Credenciales inválidas' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return json(res, 401, { error: 'Credenciales inválidas' });

    const token = await new SignJWT({ userId: user.id, email: user.email })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('30d')
      .sign(JWT_SECRET);

    json(res, 200, { token, user: { id: user.id, email: user.email, nombre: user.nombre } });
  } catch (err) {
    console.error('[CopCash login]', err);
    json(res, 500, { error: 'Error interno del servidor' });
  }
}
