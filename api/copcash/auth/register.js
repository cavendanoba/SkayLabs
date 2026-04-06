// api/copcash/auth/register.js
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';
import { sql } from '../../db.js';
import { setCors, json, JWT_SECRET } from '../_helpers.js';

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });

  try {
    const { email, password, nombre } = req.body || {};

    if (!email || !password) {
      return json(res, 400, { error: 'Email y contraseña son requeridos' });
    }
    if (password.length < 8) {
      return json(res, 400, { error: 'La contraseña debe tener mínimo 8 caracteres' });
    }

    const existing = await sql`
      SELECT id FROM cc_usuarios WHERE email = ${email.toLowerCase().trim()}
    `;
    if (existing.length > 0) {
      return json(res, 409, { error: 'Este email ya está registrado' });
    }

    const password_hash = await bcrypt.hash(password, 12);
    const [user] = await sql`
      INSERT INTO cc_usuarios (email, password_hash, nombre)
      VALUES (${email.toLowerCase().trim()}, ${password_hash}, ${nombre || null})
      RETURNING id, email, nombre
    `;

    const token = await new SignJWT({ userId: user.id, email: user.email })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('30d')
      .sign(JWT_SECRET);

    json(res, 201, { token, user });
  } catch (err) {
    console.error('[CopCash register]', err);
    json(res, 500, { error: 'Error interno del servidor' });
  }
}
