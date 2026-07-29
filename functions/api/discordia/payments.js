// functions/api/discordia/payments.js
// POST → registrar abono a una venta pendiente
// Cuando el abono cubre el total → la venta pasa a 'paid'

import { getSql, json } from './_lib/db.js';

export async function onRequestPost({ request, env }) {
  const sql = getSql(env);
  const body = await request.json();
  const { saleId, amount, note } = body;

  if (!saleId || !amount || amount <= 0) {
    return json({ ok: false, message: 'saleId y amount son requeridos.' }, 400);
  }

  // Verificar que la venta existe y está pendiente
  const [sale] = await sql`SELECT * FROM sales WHERE id = ${Number(saleId)}`;
  if (!sale) return json({ ok: false, message: 'Venta no encontrada.' }, 404);
  if (sale.payment_status === 'paid') {
    return json({ ok: false, message: 'Esta venta ya está pagada.' }, 400);
  }

  // Registrar el abono
  await sql`
    INSERT INTO sale_payments (sale_id, amount, note)
    VALUES (${Number(saleId)}, ${Number(amount)}, ${note || null})
  `;

  // Actualizar monto pagado
  const newAmountPaid = Number(sale.amount_paid) + Number(amount);
  const newStatus = newAmountPaid >= Number(sale.total) ? 'paid' : 'pending';

  await sql`
    UPDATE sales SET
      amount_paid    = ${newAmountPaid},
      payment_status = ${newStatus}
    WHERE id = ${Number(saleId)}
  `;

  // Si quedó pagado completamente, actualizar deuda del cliente
  if (newStatus === 'paid' && sale.customer_id) {
    await sql`
      UPDATE customers SET
        total_debt  = GREATEST(0, total_debt - ${Number(sale.total)}),
        total_spent = total_spent + ${Number(sale.total) - Number(sale.amount_paid)}
      WHERE id = ${sale.customer_id}
    `;
  }

  return json({
    ok: true,
    data: {
      saleId,
      newAmountPaid,
      newStatus,
      remaining: Math.max(0, Number(sale.total) - newAmountPaid)
    }
  });
}

export async function onRequestGet() {
  return json({ ok: false, message: 'Método no permitido.' }, 405);
}
