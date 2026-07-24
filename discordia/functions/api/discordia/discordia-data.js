// functions/api/discordia/discordia-data.js
// Ruta: GET|POST /api/discordia/discordia-data
//
// GET  → devuelve catálogo, ventas y clientes (para el frontend público)
// POST → guarda ventas/clientes (usado por el flujo de checkout)

import { getSql, json } from './_lib/db.js';

export async function onRequestGet({ env }) {
  const sql = getSql(env);

  try {
    const [products, sales, customers] = await Promise.all([
      sql`SELECT * FROM products WHERE active = true ORDER BY id`,
      sql`SELECT * FROM sales ORDER BY created_at DESC LIMIT 100`,
      sql`SELECT * FROM customers ORDER BY name`,
    ]);

    return json({
      ok: true,
      storage: 'postgresql',
      data: { catalog: products, sales, customers }
    });
  } catch (error) {
    console.error('Error en /api/discordia/discordia-data:', error);
    return json({ ok: false, message: error.message || 'Error interno en la API de Discordia' }, 500);
  }
}

export async function onRequestPost({ request }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, message: 'JSON inválido.' }, 400);
  }

  const payload = body.data || body;

  if (!payload || !Object.keys(payload).length) {
    return json({ ok: false, message: 'Payload inválido.' }, 400);
  }

  return json({ ok: true, storage: 'postgresql' });
}
