// functions/api/discordia/_lib/db.js
//
// Reemplazo de backend/lib/db.js (que usaba @neondatabase/serverless).
// Aquí usamos el binding de Hyperdrive que configuramos en Cloudflare
// (nombre del binding: HYPERDRIVE — se define en el dashboard de Pages
// al conectar el proyecto con la configuración "discordia-hyperdrive").
//
// Uso en cada función:
//   import { getSql } from './_lib/db.js';
//   const sql = getSql(env);
//   const rows = await sql`SELECT * FROM products`;

import postgres from 'postgres';

let cachedSql = null;

export function getSql(env) {
  if (cachedSql) return cachedSql;

  if (!env.HYPERDRIVE) {
    throw new Error(
      'El binding HYPERDRIVE no está configurado. Ve a Cloudflare Pages → ' +
      'tu proyecto → Settings → Functions → Hyperdrive bindings, y conecta ' +
      '"discordia-hyperdrive".'
    );
  }

  cachedSql = postgres(env.HYPERDRIVE.connectionString, {
    // Cloudflare Workers no soporta conexiones TCP persistentes largas
    // de la misma forma que Node — estas opciones son las recomendadas
    // por Cloudflare para trabajar bien con Hyperdrive.
    max: 5,
    fetch_types: false,
    prepare: false,
  });

  return cachedSql;
}

// Helper para respuestas JSON consistentes (equivalente a res.status().json())
export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}
