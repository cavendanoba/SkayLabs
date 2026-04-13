// ENDPOINT: backend/api/discordia/sales.js
// GET    → listar todas las ventas (soporta status=paid|pending&limit=N)
// POST   → crear una venta nueva desde el panel admin
import { sql } from '../lib/db.js';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  // ─── GET: listar ventas ────────────────────────────────────
  if (req.method === 'GET') {
    const { status = 'all', limit = 100 } = req.query || {};

    let query = 'SELECT * FROM sales';
    if (status !== 'all') query += ` WHERE payment_status = '${status}'`;
    query += ` ORDER BY created_at DESC LIMIT ${Number(limit) || 100}`;

    const sales = await sql(query);

    return res.status(200).json({
      ok: true,
      data: sales
    });
  }

  // ─── POST: crear venta ─────────────────────────────────────
  if (req.method === 'POST') {
    const {
      customerName,
      customerPhone,
      channel = 'WhatsApp',
      paymentStatus = 'pending',
      notes = '',
      items = []
    } = req.body || {};

    if (!customerName || !items.length) {
      return res.status(400).json({
        ok: false,
        message: 'Nombre del cliente e items son requeridos.'
      });
    }

    const total = items.reduce((sum, i) => sum + (i.price * i.quantity), 0);

    // Insertar venta
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

    // Insertar items de la venta
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

    return res.status(201).json({
      ok: true,
      data: sale
    });
  }

  return res.status(405).json({ ok: false, message: 'Method not allowed' });
}