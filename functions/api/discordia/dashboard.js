// functions/api/discordia/dashboard.js
// Ruta: GET /api/discordia/dashboard

import { getSql, json } from './_lib/db.js';

export async function onRequestGet({ env }) {
  const sql = getSql(env);

  try {
<<<<<<< HEAD
    // La base histórica y la actual no tienen exactamente las mismas
    // columnas. to_jsonb() permite leer los campos opcionales sin que una
    // columna ausente convierta todo el dashboard en un error 500.
    const [ventasRecientes, deudasActivas, stockBajo, ingresosMes, ingresosPrev, saleItemsTable] = await Promise.all([
      sql`SELECT
            s.id,
            COALESCE(to_jsonb(s)->>'customer_name', c.name) AS customer_name,
            COALESCE(to_jsonb(s)->>'customer_phone', to_jsonb(c)->>'phone') AS customer_phone,
            s.channel,
            s.total,
            COALESCE((to_jsonb(s)->>'amount_paid')::numeric, 0) AS amount_paid,
            COALESCE(
              to_jsonb(s)->>'payment_status',
              CASE WHEN lower(COALESCE(to_jsonb(s)->>'status', '')) IN ('paid', 'completed') THEN 'paid' ELSE 'pending' END
            ) AS payment_status,
            to_jsonb(s)->>'notes' AS notes,
            s.created_at
          FROM sales s
          LEFT JOIN customers c ON c.id = s.customer_id
          ORDER BY s.created_at DESC
          LIMIT 5`,
      sql`SELECT
            id,
            name,
            to_jsonb(customers)->>'phone' AS phone,
            COALESCE(NULLIF(to_jsonb(customers)->>'total_debt', '')::numeric, 0) AS total_debt
          FROM customers
          WHERE COALESCE(NULLIF(to_jsonb(customers)->>'total_debt', '')::numeric, 0) > 0
          ORDER BY COALESCE(NULLIF(to_jsonb(customers)->>'total_debt', '')::numeric, 0) DESC
          LIMIT 10`,
      sql`SELECT id, name, stock, price FROM products WHERE stock <= 3 ORDER BY stock ASC, name ASC LIMIT 10`,
=======
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
>>>>>>> 30b96ae19e03ed9f87792572b07b3a3f71d26030
      sql`SELECT COUNT(*)::int AS cantidad, COALESCE(SUM(total), 0)::numeric AS total
          FROM sales s
          WHERE COALESCE(
                  to_jsonb(s)->>'payment_status',
                  CASE WHEN lower(COALESCE(to_jsonb(s)->>'status', '')) IN ('paid', 'completed') THEN 'paid' ELSE 'pending' END
                ) = 'paid'
            AND created_at >= date_trunc('month', now())
            AND created_at < date_trunc('month', now()) + interval '1 month'`,
      sql`SELECT COALESCE(SUM(total), 0)::numeric AS total
          FROM sales s
          WHERE COALESCE(
                  to_jsonb(s)->>'payment_status',
                  CASE WHEN lower(COALESCE(to_jsonb(s)->>'status', '')) IN ('paid', 'completed') THEN 'paid' ELSE 'pending' END
                ) = 'paid'
            AND created_at >= date_trunc('month', now()) - interval '1 month'
            AND created_at < date_trunc('month', now())`,
<<<<<<< HEAD
      sql`SELECT to_regclass('public.sale_items') AS table_name`
=======
      sql`SELECT 
            COUNT(DISTINCT p.id)::int AS total_productos,
            COALESCE(SUM(p.stock), 0)::int AS stock_actual,
            COALESCE(SUM(p.stock) + COALESCE(SUM(si.quantity), 0), 0)::int AS stock_inicial,
            COALESCE(SUM(si.quantity), 0)::int AS stock_vendido
          FROM products p
          LEFT JOIN sale_items si ON p.id = si.product_id`
>>>>>>> 30b96ae19e03ed9f87792572b07b3a3f71d26030
    ]);

    // sale_items aún no existe en instalaciones nuevas. En ese caso el
    // dashboard sigue siendo utilizable y muestra el ranking vacío.
    const topProductos = saleItemsTable[0]?.table_name
      ? await sql`SELECT COALESCE(p.name, to_jsonb(si)->>'product_name', 'Producto sin nombre') AS product_name,
                         SUM(si.quantity)::int AS unidades,
                         SUM(si.quantity * si.price)::numeric AS ingresos
                  FROM sale_items si
                  LEFT JOIN products p ON p.id = si.product_id
                  GROUP BY COALESCE(p.name, to_jsonb(si)->>'product_name', 'Producto sin nombre')
                  ORDER BY ingresos DESC
                  LIMIT 5`
      : [];

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
