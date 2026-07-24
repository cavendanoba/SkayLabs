// functions/api/discordia/sales.js
// GET  → listar ventas (soporta ?status=paid|pending&limit=N)
// POST → crear una venta nueva desde el panel admin
//
// Nota: la versión original en Vercel armaba el WHERE por concatenación
// de string, lo cual es un riesgo de inyección SQL. Aquí lo hacemos con
// consultas parametrizadas seguras.

import { getSql, json } from './_lib/db.js';

export async function onRequestGet({ request, env }) {
  const sql = getSql(env);
  const url = new URL(request.url);
  const status = url.searchParams.get('status') || 'all';
  const limit = Number(url.searchParams.get('limit')) || 100;

  const sales = status === 'all'
    ? await sql`SELECT * FROM sales ORDER BY created_at DESC LIMIT ${limit}`
    : await sql`SELECT * FROM sales WHERE payment_status = ${status} ORDER BY created_at DESC LIMIT ${limit}`;

  return json({ ok: true, data: sales });
}

export async function onRequestPost({ request, env }) {
  const sql = getSql(env);
  const body = await request.json();

  const {
    customerName,
    customerPhone,
    channel = 'WhatsApp',
    paymentStatus = 'pending',
    notes = '',
    items = []
  } = body || {};

  if (!customerName || !items.length) {
    return json({ ok: false, message: 'Nombre del cliente e items son requeridos.' }, 400);
  }

  const total = items.reduce((sum, i) => sum + (i.price * i.quantity), 0);

  const [sale] = await sql`
    INSERT INTO sales (
      customer_name, customer_phone, channel,
      total, amount_paid, payment_status, notes
    )
    VALUES (
      ${customerName},
      ${customerPhone || null},
      ${channel},
      ${total},
      ${paymentStatus === 'paid' ? total : 0},
      ${paymentStatus},
      ${notes || null}
    )
    RETURNING id, customer_name, customer_phone, channel,
              total, amount_paid, payment_status, notes, created_at
  `;

  for (const item of items) {
    await sql`
      INSERT INTO sale_items (sale_id, product_id, quantity, price)
      VALUES (
        ${sale.id},
        ${item.productId || null},
        ${item.quantity},
        ${item.price}
      )
    `;
  }

  return json({ ok: true, data: sale }, 201);
}
