// functions/api/discordia/_lib/clientes.js
// Guarda a la clienta de una venta en la tabla customers (sin duplicar por nombre)
// y enlaza la venta con ella. Nunca hace fallar la venta: si algo sale mal, solo lo registra.

export async function registrarCliente(sql, saleId, nombre, telefono) {
  const name = String(nombre || '').trim();
  if (!name) return;
  const phone = String(telefono || '').trim() || null;
  try {
    let [cliente] = await sql`SELECT id, to_jsonb(customers)->>'phone' AS phone FROM customers WHERE lower(trim(name)) = lower(${name}) LIMIT 1`;
    if (!cliente) {
      [cliente] = await sql`INSERT INTO customers (name, phone) VALUES (${name}, ${phone}) RETURNING id`;
    } else if (phone && !cliente.phone) {
      await sql`UPDATE customers SET phone = ${phone} WHERE id = ${cliente.id}`;
    }
    if (cliente && saleId) {
      await sql`UPDATE sales SET customer_id = ${cliente.id} WHERE id = ${Number(saleId)}`;
    }
  } catch (err) {
    console.error('[Discordia] No se pudo registrar la clienta:', err.message);
  }
}
