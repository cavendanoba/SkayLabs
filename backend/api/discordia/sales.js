// ENDPOINT: backend/api/discordia/sales.js
// GET    → listar todas las ventas (soporta status=paid|pending&limit=N)
// POST   → crear una venta nueva desde el panel admin
// PUT    → actualizar venta existente (requiere body.id)
// DELETE → eliminar venta (requiere body.id)
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

    // Cargar items para cada venta
    const salesWithItems = await Promise.all(
      sales.map(async (sale) => {
        const items = await sql(`SELECT * FROM sale_items WHERE sale_id = ${sale.id}`);
        return { ...sale, items };
      })
    );

    return res.status(200).json({
      ok: true,
      data: salesWithItems
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

    try {
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

      return res.status(201).json({
        ok: true,
        data: sale
      });
    } catch (err) {
      console.error('Error al registrar venta:', err);
      return res.status(500).json({
        ok: false,
        message: 'Error al registrar la venta.'
      });
    }
  }

  // ─── PUT: actualizar venta ────────────────────────────────
  if (req.method === 'PUT') {
    const saleId = req.url.split('/').pop(); // Obtener ID de la URL: /api/discordia/sales/123
    const {
      customerName,
      customerPhone,
      channel,
      paymentStatus,
      notes
    } = req.body || {};

    if (!saleId || isNaN(saleId)) {
      return res.status(400).json({
        ok: false,
        message: 'ID de venta inválido.'
      });
    }

    try {
      const [updated] = await sql`
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

      if (!updated) {
        return res.status(404).json({
          ok: false,
          message: 'Venta no encontrada.'
        });
      }

      return res.status(200).json({
        ok: true,
        data: updated
      });
    } catch (err) {
      return res.status(500).json({
        ok: false,
        message: 'Error al actualizar la venta.'
      });
    }
  }

  // ─── DELETE: eliminar venta ────────────────────────────────
  if (req.method === 'DELETE') {
    const saleId = req.url.split('/').pop(); // Obtener ID de la URL: /api/discordia/sales/123

    if (!saleId || isNaN(saleId)) {
      return res.status(400).json({
        ok: false,
        message: 'ID de venta inválido.'
      });
    }

    try {
      // Primero eliminar items de la venta
      await sql`
        DELETE FROM sale_items WHERE sale_id = ${Number(saleId)}
      `;

      // Luego eliminar la venta
      const result = await sql`
        DELETE FROM sales WHERE id = ${Number(saleId)}
        RETURNING id
      `;

      if (result.length === 0) {
        return res.status(404).json({
          ok: false,
          message: 'Venta no encontrada.'
        });
      }

      return res.status(200).json({
        ok: true,
        message: 'Venta eliminada correctamente.'
      });
    } catch (err) {
      return res.status(500).json({
        ok: false,
        message: 'Error al eliminar la venta.'
      });
    }
  }

  return res.status(405).json({ ok: false, message: 'Method not allowed' });
}