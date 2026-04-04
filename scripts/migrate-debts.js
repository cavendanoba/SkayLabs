// scripts/migrate-debts.js
// ─────────────────────────────────────────────────────────────
// Agrega la columna paid_amount a la tabla sales para permitir
// registrar abonos parciales en el módulo de Deudas.
// Ejecutar UNA SOLA VEZ:  node scripts/migrate-debts.js
// ─────────────────────────────────────────────────────────────
import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function migrate() {
  console.log('⏳ Agregando columna paid_amount a sales...');

  await sql`
    ALTER TABLE sales
    ADD COLUMN IF NOT EXISTS paid_amount NUMERIC(10,2) NOT NULL DEFAULT 0
  `;

  // Para ventas ya pagadas, paid_amount = total
  await sql`
    UPDATE sales
    SET paid_amount = total
    WHERE payment_status = 'paid' AND paid_amount = 0
  `;

  // Verificar
  const [{ count }] = await sql`SELECT COUNT(*) FROM sales WHERE payment_status = 'pending'`;
  console.log(`✅ Migración completada. ${count} ventas pendientes encontradas.`);
}

migrate().catch((err) => {
  console.error('❌ Error en migración:', err.message);
  process.exit(1);
});
