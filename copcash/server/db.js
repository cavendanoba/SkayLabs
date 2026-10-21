import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const { Pool, types } = pg;

// NUMERIC llega como string por defecto; aquí lo convertimos a número (montos en pesos, sin riesgo de precisión).
types.setTypeParser(1700, (v) => (v === null ? null : Number(v)));
// DATE como 'AAAA-MM-DD' sin conversión de zona horaria
types.setTypeParser(1082, (v) => v);
// BIGINT/BIGSERIAL como número (los ids de esta app nunca pasan de 2^53)
types.setTypeParser(20, (v) => (v === null ? null : Number(v)));

if (!process.env.DATABASE_URL) {
  throw new Error('Falta DATABASE_URL. Copia .env.example como .env y configúralo.');
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 10 });

/** Ejecuta fn dentro de una transacción. */
export async function enTransaccion(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const r = await fn(client);
    await client.query('COMMIT');
    return r;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

/** Aplica en orden los .sql de server/migrations que aún no se han aplicado. */
export async function migrar() {
  const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'migrations');
  await pool.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
    version TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`);
  const hechas = new Set((await pool.query('SELECT version FROM schema_migrations')).rows.map((r) => r.version));
  const archivos = (await fs.readdir(dir)).filter((f) => f.endsWith('.sql')).sort();
  for (const f of archivos) {
    if (hechas.has(f)) continue;
    const sql = await fs.readFile(path.join(dir, f), 'utf8');
    await enTransaccion(async (c) => {
      await c.query(sql);
      await c.query('INSERT INTO schema_migrations(version) VALUES ($1)', [f]);
    });
    console.log(`Migración aplicada: ${f}`);
  }
}
