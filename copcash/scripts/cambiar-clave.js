// Pone una contraseña nueva a una cuenta de CopCash y cierra todas sus sesiones.
// Se ejecuta en el servidor:  node scripts/cambiar-clave.js
// La contraseña se escribe sin que se vea en pantalla y nunca queda guardada en texto plano.
import '../server/entorno.js';
import readline from 'node:readline';
import bcrypt from 'bcryptjs';
import { pool } from '../server/db.js';

function preguntar(texto, oculto = false) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    if (oculto) {
      rl._writeToOutput = (s) => { if (s.includes(texto)) rl.output.write(s); else if (!s.includes('\n')) rl.output.write('*'); };
    }
    rl.question(texto, (r) => { rl.close(); if (oculto) process.stdout.write('\n'); resolve(r.trim()); });
  });
}

try {
  const { rows } = await pool.query('SELECT id, email, nombre FROM users ORDER BY id');
  if (!rows.length) throw new Error('No hay cuentas creadas todavía. Créala desde la pantalla de ingreso.');
  console.log('Cuentas:');
  for (const u of rows) console.log(`  · ${u.email}${u.nombre ? ` (${u.nombre})` : ''}`);

  const email = (await preguntar('\nCorreo de la cuenta: ')).toLowerCase();
  const user = rows.find((u) => u.email === email);
  if (!user) throw new Error('No encontré una cuenta con ese correo.');

  const clave = await preguntar('Contraseña nueva (mínimo 8): ', true);
  if (clave.length < 8) throw new Error('La contraseña debe tener al menos 8 caracteres.');
  const repetir = await preguntar('Repítela: ', true);
  if (clave !== repetir) throw new Error('Las contraseñas no coinciden.');

  const hash = await bcrypt.hash(clave, 11);
  await pool.query('UPDATE users SET password_hash = $1, sesion_version = sesion_version + 1 WHERE id = $2', [hash, user.id]);
  console.log(`\nListo: ${user.email} ya tiene la contraseña nueva. Las sesiones abiertas se cerraron.`);
} catch (e) {
  console.error(`\n✖ ${e.message}`);
  process.exitCode = 1;
} finally {
  await pool.end();
}
