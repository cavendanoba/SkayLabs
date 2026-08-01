// functions/api/discordia/sales.js
// GET  → listar ventas (soporta ?status=paid|pending&limit=N)
// POST → crear una venta nueva desde el panel admin
//
// Nota: PUT y DELETE están en sales/[id].js para rutas dinámicas (/api/discordia/sales/:id)

import { getSql, json } from './_lib/db.js';

export async function onRequestGet({ request, env }) {
  const sql = getSql(env);
  const url = new URL(request.url);
  const status = url.searchParams.get('status') || 'all';
  const limit = Number(url.searchParams.get('limit')) || 100;

  const sales = status === 'all'
    ? await sql`SELECT * FROM sales ORDER BY created_at DESC LIMIT ${limit}`
    : await sql`SELECT * FROM sales WHERE payment_status = ${status} ORDER BY created_at DESC LIMIT ${limit}`;

  // Cargar items para cada venta
  const salesWithItems = await Promise.all(
    sales.map(async (sale) => {
      const items = await sql`SELECT * FROM sale_items WHERE sale_id = ${sale.id}`;
      return { ...sale, items };
    })
  );

  return json({ ok: true, data: salesWithItems });
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

  try {
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

    // Insertar items y restar stock
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

      // Restar stock del producto
      if (item.productId) {
        await sql`
          UPDATE products
          SET stock = stock - ${item.quantity}
          WHERE id = ${item.productId}
        `;
      }
    }

    return json({ ok: true, data: sale }, 201);
  } catch (err) {
    console.error('Error al registrar venta:', err);
    return json({ ok: false, message: 'Error al registrar la venta.' }, 500);
  }
}
