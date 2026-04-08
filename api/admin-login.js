// api/admin-login.js
import { sql } from './db.js';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, message: 'Método no permitido' });
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
  const { username, password } = body;

  // Validación básica
  if (!username || !password) {
    return res.status(400).json({ ok: false, message: 'Usuario y contraseña requeridos' });
  }

  // Buscar usuario en la BD
  const [user] = await sql`
    SELECT * FROM admin_users WHERE username = ${username}
  `;

  if (!user) {
    // Mismo mensaje para usuario no encontrado y contraseña incorrecta
    // Nunca digas cuál de los dos falló — es una práctica de seguridad
    return res.status(401).json({ ok: false, message: 'Credenciales inválidas' });
  }

  // Verificar contraseña contra el hash
  const valid = await bcrypt.compare(password, user.password_hash);

  if (!valid) {
    return res.status(401).json({ ok: false, message: 'Credenciales inválidas' });
  }

  // Generar token simple con timestamp
  // En producción real usarías JWT, pero para un admin personal esto es suficiente
  const token = Buffer.from(`${username}:${Date.now()}:${Math.random()}`).toString('base64');

  return res.status(200).json({ ok: true, token, username });
}