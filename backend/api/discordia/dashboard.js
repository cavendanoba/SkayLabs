import { sql } from '../lib/db.js';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, message: 'Method not allowed' });
  }

  try {
    const [ventasRecientes, deudasActivas, stockBajo, topProductos, ingresosMes, ingresosPrev] = await Promise.all([
      sql`SELECT id, customer_name, customer_phone, channel, total, amount_paid, payment_status, notes, created_at
          FROM sales
          ORDER BY created_at DESC
          LIMIT 5`,
      sql`SELECT id, name, phone, total_debt FROM customers WHERE total_debt > 0 ORDER BY total_debt DESC LIMIT 10`,
      sql`SELECT id, name, stock, price FROM products WHERE stock <= 3 ORDER BY stock ASC, name ASC LIMIT 10`,
      sql`SELECT COALESCE(p.name, si.product_name) AS product_name,
                 SUM(si.quantity)::int AS unidades,
                 SUM(si.quantity * si.price)::numeric AS ingresos
          FROM sale_items si
          LEFT JOIN products p ON p.id = si.product_id
          GROUP BY COALESCE(p.name, si.product_name)
          ORDER BY ingresos DESC
          LIMIT 5`,
      sql`SELECT COUNT(*)::int AS cantidad, COALESCE(SUM(total), 0)::numeric AS total
          FROM sales
          WHERE payment_status = 'paid'
            AND created_at >= date_trunc('month', now())
            AND created_at < date_trunc('month', now()) + interval '1 month'`,
      sql`SELECT COALESCE(SUM(total), 0)::numeric AS total
          FROM sales
          WHERE payment_status = 'paid'
            AND created_at >= date_trunc('month', now()) - interval '1 month'
            AND created_at < date_trunc('month', now())`
    ]);

    const totalActual = Number(ingresosMes[0]?.total || 0);
    const totalAnterior = Number(ingresosPrev[0]?.total || 0);
    const variacion = totalAnterior === 0 ? null : Math.round(((totalActual - totalAnterior) / totalAnterior) * 100);

    return res.status(200).json({
      ok: true,
      data: {
        ingresosMes: {
          total: totalActual,
          cantidad: ingresosMes[0]?.cantidad || 0,
          variacion
        },
        deudasActivas,
        stockBajo,
        topProductos: topProductos.map((row) => ({
          product_name: row.product_name,
          unidades: Number(row.unidades),
          ingresos: Number(row.ingresos)
        })),
        ventasRecientes
      }
    });
  } catch (err) {
    console.error('[Discordia dashboard]', err);
    return res.status(500).json({ ok: false, message: 'Error interno del servidor.' });
  }
}
