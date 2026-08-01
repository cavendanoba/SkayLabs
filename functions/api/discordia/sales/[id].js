// functions/api/discordia/sales/[id].js
// Maneja rutas dinámicas para ventas:
// PUT  → /api/discordia/sales/:id (editar)
// DELETE → /api/discordia/sales/:id (eliminar)

import { getSql, json } from '../_lib/db.js';

export async function onRequestPut({ request, env, params }) {
  const sql = getSql(env);
  const saleId = params.id;
  
  if (!saleId || isNaN(saleId)) {
    return json({ ok: false, message: 'ID de venta inválido.' }, 400);
  }

  try {
    const body = await request.json();
    const { customerName, customerPhone, channel, paymentStatus, notes } = body || {};

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
    console.error('Error al actualizar venta:', err);
    return json({ ok: false, message: 'Error al actualizar la venta.' }, 500);
  }
}

export async function onRequestDelete({ request, env, params }) {
  const sql = getSql(env);
  const saleId = params.id;

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
    console.error('Error al eliminar venta:', err);
    return json({ ok: false, message: 'Error al eliminar la venta.' }, 500);
  }
}
