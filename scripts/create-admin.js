// scripts/create-admin.js
import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

const sql = neon(process.env.DATABASE_URL);

const USERNAME = 'dvdadmon';        // cambia si quieres
// La contraseña NUNCA va escrita en el código: se pasa al ejecutar
//   ADMIN_PASSWORD='...' node scripts/create-admin.js
const PASSWORD = process.env.ADMIN_PASSWORD;
if (!PASSWORD || PASSWORD.length < 12) { console.error('Define ADMIN_PASSWORD (mínimo 12 caracteres).'); process.exit(1); }

const hash = await bcrypt.hash(PASSWORD, 12);

await sql`
  INSERT INTO admin_users (username, password_hash)
  VALUES (${USERNAME}, ${hash})
  ON CONFLICT (username) DO UPDATE SET password_hash = ${hash}
`;

console.log(`✅ Usuario '${USERNAME}' creado correctamente.`);
console.log('🔒 Nunca guardes la contraseña en texto plano — solo el hash va a la BD.');