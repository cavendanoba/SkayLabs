// functions/api/discordia/sales.js
// GET  → listar ventas (soporta ?status=paid|pending&limit=N)
// POST → crear una venta nueva desde el panel admin
// PUT  → actualizar venta existente
// DELETE → eliminar venta
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

export async function onRequestPut({ request, env }) {
  const sql = getSql(env);
  const url = new URL(request.url);
  const saleId = url.pathname.split('/').pop();
  const body = await request.json();

  const {
    customerName,
    customerPhone,
    channel,
    paymentStatus,
    notes
  } = body || {};

  if (!saleId || isNaN(saleId)) {
    return json({ ok: false, message: 'ID de venta inválido.' }, 400);
  }

  try {
    const updated = await sql`
      UPDATE sales
      SET
        customer_name = ${customerName},
        customer_phone = ${customerPhone || null},
        channel = ${channel},
        payment_status = ${paymentStatus},
        notes = ${notes || null}
      WHERE id = ${Number(saleId)}
      RETURNING id, customer_name, customer_phone, channel,
                total, amount_paid, payment_status, notes, created_at
    `;

    if (!updated.length) {
      return json({ ok: false, message: 'Venta no encontrada.' }, 404);
    }

    return json({ ok: true, data: updated[0] });
  } catch (err) {
    return json({ ok: false, message: 'Error al actualizar la venta.' }, 500);
  }
}

export async function onRequestDelete({ request, env }) {
  const sql = getSql(env);
  const url = new URL(request.url);
  const saleId = url.pathname.split('/').pop();

  if (!saleId || isNaN(saleId)) {
    return json({ ok: false, message: 'ID de venta inválido.' }, 400);
  }

  try {
    // Primero eliminar items de la venta
    await sql`DELETE FROM sale_items WHERE sale_id = ${Number(saleId)}`;

    // Luego eliminar la venta
    const result = await sql`DELETE FROM sales WHERE id = ${Number(saleId)} RETURNING id`;

    if (!result.length) {
      return json({ ok: false, message: 'Venta no encontrada.' }, 404);
    }

    return json({ ok: true, message: 'Venta eliminada correctamente.' });
  } catch (err) {
    return json({ ok: false, message: 'Error al eliminar la venta.' }, 500);
  }
}
