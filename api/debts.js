// api/debts.js
// ─────────────────────────────────────────────────────────────
// Módulo de Deudas:
//   GET  → lista todas las ventas pendientes agrupadas por cliente
//   POST → registra abono parcial o marca venta como pagada
//
// Requiere la columna paid_amount en sales (migrate-debts.js).
// ─────────────────────────────────────────────────────────────
import { sql } from './db.js';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  // ─── GET: leer todas las deudas pendientes ─────────────────
  if (req.method === 'GET') {
    const [pendingSales, saleItems] = await Promise.all([
      sql`
        SELECT
          s.id,
          s.total,
          COALESCE(s.paid_amount, 0)  AS paid_amount,
          s.channel,
          s.payment_status,
          s.created_at,
          s.notes,
          c.id   AS customer_id,
          c.name AS customer_name,
          c.phone AS customer_phone,
          c.total_debt
        FROM sales s
        JOIN customers c ON s.customer_id = c.id
        WHERE s.payment_status = 'pending'
        ORDER BY c.total_debt DESC, s.created_at ASC
      `,
      sql`
        SELECT si.sale_id, si.product_name, si.quantity, si.price
        FROM sale_items si
        JOIN sales s ON si.sale_id = s.id
        WHERE s.payment_status = 'pending'
        ORDER BY si.sale_id
      `
    ]);

    // Adjuntar items a cada venta
    const itemsBySale = {};
    for (const item of saleItems) {
      if (!itemsBySale[item.sale_id]) itemsBySale[item.sale_id] = [];
      itemsBySale[item.sale_id].push(item);
    }

    // Agrupar ventas por cliente
    const customerMap = {};
    for (const sale of pendingSales) {
      const paid = Number(sale.paid_amount);
      const total = Number(sale.total);
      const enriched = {
        id: sale.id,
        total,
        paid_amount: paid,
        remaining: total - paid,
        channel: sale.channel,
        payment_status: sale.payment_status,
        created_at: sale.created_at,
        notes: sale.notes,
        items: itemsBySale[sale.id] || []
      };

      if (!customerMap[sale.customer_id]) {
        customerMap[sale.customer_id] = {
          id: sale.customer_id,
          name: sale.customer_name,
          phone: sale.customer_phone,
          total_debt: Number(sale.total_debt || 0),
          sales: []
        };
      }
      customerMap[sale.customer_id].sales.push(enriched);
    }

    const customers = Object.values(customerMap).sort((a, b) => b.total_debt - a.total_debt);
    const totalDebt = customers.reduce((sum, c) => sum + c.total_debt, 0);

    return res.status(200).json({
      ok: true,
      data: {
        customers,
        totalDebt,
        totalPendingSales: pendingSales.length
      }
    });
  }

  // ─── POST: registrar abono o marcar como pagado ────────────
  if (req.method === 'POST') {
    // Verificar que hay token (protección básica)
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ') || auth.length < 15) {
      return res.status(401).json({ ok: false, message: 'No autorizado' });
    }

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { action, sale_id, amount } = body;

    if (!sale_id) {
      return res.status(400).json({ ok: false, message: 'sale_id requerido' });
    }

    // Leer la venta
    const [sale] = await sql`
      SELECT * FROM sales WHERE id = ${sale_id} AND payment_status = 'pending'
    `;
    if (!sale) {
      return res.status(404).json({ ok: false, message: 'Venta no encontrada o ya estaba pagada' });
    }

    const currentPaid = Number(sale.paid_amount || 0);
    const saleTotal = Number(sale.total);

    // ── Marcar como totalmente pagado ─────────────────────────
    if (action === 'marcar_pagado') {
      const remaining = saleTotal - currentPaid;

      await sql`
        UPDATE sales
        SET payment_status = 'paid', paid_amount = ${saleTotal}
        WHERE id = ${sale_id}
      `;
      await sql`
        UPDATE customers
        SET total_debt = GREATEST(0, total_debt - ${remaining})
        WHERE id = ${sale.customer_id}
      `;

      return res.status(200).json({
        ok: true,
        message: 'Venta marcada como pagada.',
        fullyPaid: true
      });
    }

    // ── Registrar abono parcial ───────────────────────────────
    if (action === 'abono') {
      const abono = Number(amount);
      if (!abono || abono <= 0 || !Number.isFinite(abono)) {
        return res.status(400).json({ ok: false, message: 'Monto de abono inválido' });
      }

      const newPaid = currentPaid + abono;

      if (newPaid >= saleTotal) {
        // Quedó totalmente cubierto con este abono
        const efectivoAbono = saleTotal - currentPaid;

        await sql`
          UPDATE sales
          SET payment_status = 'paid', paid_amount = ${saleTotal}
          WHERE id = ${sale_id}
        `;
        await sql`
          UPDATE customers
          SET total_debt = GREATEST(0, total_debt - ${efectivoAbono})
          WHERE id = ${sale.customer_id}
        `;

        return res.status(200).json({
          ok: true,
          message: `Abono registrado. ¡Deuda liquidada completamente!`,
          fullyPaid: true,
          remaining: 0
        });
      } else {
        // Abono parcial
        await sql`
          UPDATE sales
          SET paid_amount = ${newPaid}
          WHERE id = ${sale_id}
        `;
        await sql`
          UPDATE customers
          SET total_debt = GREATEST(0, total_debt - ${abono})
          WHERE id = ${sale.customer_id}
        `;

        return res.status(200).json({
          ok: true,
          message: 'Abono registrado correctamente.',
          fullyPaid: false,
          remaining: saleTotal - newPaid
        });
      }
    }

    return res.status(400).json({ ok: false, message: `Acción desconocida: ${action}` });
  }

  return res.status(405).json({ ok: false, message: 'Método no permitido' });
}
