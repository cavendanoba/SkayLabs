// api/dashboard.js
// ─────────────────────────────────────────────────────────────
// Endpoint que devuelve todas las métricas del dashboard en
// una sola llamada. Usamos Promise.all para ejecutar todas
// las consultas en paralelo y minimizar el tiempo de respuesta.
// ─────────────────────────────────────────────────────────────
import { sql } from './db.js';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, message: 'Método no permitido' });
  }

  const [
    ingresosMes,
    ingresosMesAnterior,
    topProductos,
    deudasActivas,
    stockBajo,
    ventasRecientes
  ] = await Promise.all([

    // Ingresos del mes actual (solo ventas pagadas)
    sql`
      SELECT COALESCE(SUM(total), 0) AS total, COUNT(*) AS cantidad
      FROM sales
      WHERE payment_status = 'paid'
        AND created_at >= DATE_TRUNC('month', NOW())
    `,

    // Ingresos del mes anterior (para comparar)
    sql`
      SELECT COALESCE(SUM(total), 0) AS total
      FROM sales
      WHERE payment_status = 'paid'
        AND created_at >= DATE_TRUNC('month', NOW()) - INTERVAL '1 month'
        AND created_at <  DATE_TRUNC('month', NOW())
    `,

    // Top 5 productos más vendidos (por unidades)
    sql`
      SELECT si.product_name, SUM(si.quantity) AS unidades, SUM(si.price * si.quantity) AS ingresos
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      WHERE s.payment_status = 'paid'
      GROUP BY si.product_name
      ORDER BY unidades DESC
      LIMIT 5
    `,

    // Clientes con deuda pendiente
    sql`
      SELECT c.name, c.phone, c.total_debt,
             COUNT(s.id) AS ventas_pendientes
      FROM customers c
      JOIN sales s ON s.customer_id = c.id
      WHERE s.payment_status = 'pending'
      GROUP BY c.id, c.name, c.phone, c.total_debt
      ORDER BY c.total_debt DESC
    `,

    // Productos con stock bajo (menos de 4 unidades)
    sql`
      SELECT id, name, stock, category
      FROM products
      WHERE active = true AND stock <= 3
      ORDER BY stock ASC
    `,

    // Últimas 5 ventas registradas
    sql`
      SELECT s.id, s.total, s.channel, s.payment_status, s.created_at,
             c.name AS cliente
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      ORDER BY s.created_at DESC
      LIMIT 5
    `
  ]);

  // Calcular variación vs mes anterior
  const totalMes = Number(ingresosMes[0].total);
  const totalMesAnterior = Number(ingresosMesAnterior[0].total);
  const variacion = totalMesAnterior > 0
    ? Math.round(((totalMes - totalMesAnterior) / totalMesAnterior) * 100)
    : null;

  return res.status(200).json({
    ok: true,
    data: {
      ingresosMes: {
        total: totalMes,
        cantidad: Number(ingresosMes[0].cantidad),
        variacion // porcentaje vs mes anterior, null si no hay datos anteriores
      },
      topProductos,
      deudasActivas,
      stockBajo,
      ventasRecientes
    }
  });
}