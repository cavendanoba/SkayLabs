// functions/api/discordia/dashboard.js
// Ruta: GET /api/discordia/dashboard

import { getSql, json } from './_lib/db.js';

export async function onRequestGet({ env }) {
  const sql = getSql(env);

  try {
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
      sql`SELECT to_regclass('public.sale_items') AS table_name`
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
        ventasRecientes
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
