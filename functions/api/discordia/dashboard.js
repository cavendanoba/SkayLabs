// functions/api/discordia/dashboard.js
// Ruta: GET /api/discordia/dashboard

import { getSql, json } from './_lib/db.js';

export async function onRequestGet({ env }) {
  const sql = getSql(env);

  try {
    const [ventasRecientes, deudasActivas, stockBajo, topProductos, ingresosMes, ingresosPrev, stockMetrics] = await Promise.all([
      sql`SELECT id, customer_name, customer_phone, channel, total, amount_paid, payment_status, notes, created_at
          FROM sales
          ORDER BY created_at DESC
          LIMIT 5`,
      sql`SELECT s.id, s.customer_name, s.customer_phone, 
                 (s.total - COALESCE(s.amount_paid, 0))::numeric AS total_debt
          FROM sales s
          WHERE s.payment_status = 'pending'
          ORDER BY (s.total - COALESCE(s.amount_paid, 0)) DESC
          LIMIT 10`,
      sql`SELECT id, name, stock, price FROM products WHERE stock <= 3 ORDER BY stock ASC, name ASC LIMIT 10`,
      sql`SELECT COALESCE(p.name, si.name) AS product_name,
                 SUM(si.quantity)::int AS unidades,
                 SUM(si.quantity * si.price)::numeric AS ingresos
          FROM sale_items si
          LEFT JOIN products p ON p.id = si.product_id
          GROUP BY COALESCE(p.name, si.name)
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
            AND created_at < date_trunc('month', now())`,
      sql`SELECT 
            COUNT(DISTINCT p.id)::int AS total_productos,
            COALESCE(SUM(p.stock), 0)::int AS stock_actual,
            COALESCE(SUM(p.stock) + COALESCE(SUM(si.quantity), 0), 0)::int AS stock_inicial,
            COALESCE(SUM(si.quantity), 0)::int AS stock_vendido
          FROM products p
          LEFT JOIN sale_items si ON p.id = si.product_id`
    ]);

    const totalActual = Number(ingresosMes[0]?.total || 0);
    const totalAnterior = Number(ingresosPrev[0]?.total || 0);
    const variacion = totalAnterior === 0 ? null : Math.round(((totalActual - totalAnterior) / totalAnterior) * 100);

    const stockInicial = stockMetrics[0]?.stock_inicial || 0;
    const stockVendido = stockMetrics[0]?.stock_vendido || 0;
    const totalProductos = stockMetrics[0]?.total_productos || 0;
    
    // Rotación de inventario: % del inventario inicial que fue vendido
    const rotacionPorcentaje = stockInicial > 0 
      ? Math.round((stockVendido / stockInicial) * 100)
      : 0;
    
    // Tasa de rotación: unidades vendidas por producto
    const tasaRotacion = totalProductos > 0 
      ? Math.round(stockVendido / totalProductos * 10) / 10
      : 0;

    return json({
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
        ventasRecientes,
        rotacionInventario: {
          porcentaje: rotacionPorcentaje,
          tasaRotacion: tasaRotacion,
          stockVendido: stockVendido,
          stockInicial: stockInicial,
          totalProductos: totalProductos
        }
      }
    });
  } catch (err) {
    console.error('[Discordia dashboard]', err);
    return json({ ok: false, message: 'Error interno del servidor.' }, 500);
  }
}

export async function onRequestPost() {
  return json({ ok: false, message: 'Method not allowed' }, 405);
}
