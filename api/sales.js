// api/sales.js
// ─────────────────────────────────────────────────────────────
// Módulo de Ventas:
//   GET  → historial completo de ventas con items + cliente,
//           más listas de productos y clientes para el formulario
//   POST → registra nueva venta (multi-producto, upsert cliente,
//           descuenta stock, actualiza totales del cliente)
// ─────────────────────────────────────────────────────────────
import { sql } from './db.js';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  // ─── GET: historial + datos del formulario ─────────────────
  if (req.method === 'GET') {
    const [sales, saleItems, customers, products] = await Promise.all([
      sql`
        SELECT
          s.id,
          s.total,
          s.channel,
          s.payment_status,
          s.amount_paid,
          s.paid_amount,
          s.notes,
          s.created_at,
          c.id   AS customer_id,
          c.name AS customer_name,
          c.phone AS customer_phone
        FROM sales s
        LEFT JOIN customers c ON s.customer_id = c.id
        ORDER BY s.created_at DESC
      `,
      sql`
        SELECT si.sale_id, si.product_name, si.quantity, si.price
        FROM sale_items si
        ORDER BY si.sale_id DESC
      `,
      sql`
        SELECT id, name, phone FROM customers ORDER BY name ASC
      `,
      sql`
        SELECT id, name, price, stock, category
        FROM products
        WHERE active = true
        ORDER BY name ASC
      `
    ]);

    // Adjuntar items a cada venta
    const itemsBySale = {};
    for (const item of saleItems) {
      if (!itemsBySale[item.sale_id]) itemsBySale[item.sale_id] = [];
      itemsBySale[item.sale_id].push(item);
    }

    const enrichedSales = sales.map(s => ({
      ...s,
      items: itemsBySale[s.id] || []
    }));

    // Métricas globales
    const totalRevenue = sales.reduce((sum, s) => sum + Number(s.total), 0);
    const totalPaid = sales.filter(s => s.payment_status === 'paid').reduce((sum, s) => sum + Number(s.total), 0);
    const totalPending = sales.filter(s => s.payment_status === 'pending').reduce((sum, s) => sum + Number(s.total), 0);
    const channels = [...new Set(sales.map(s => s.channel).filter(Boolean))];

    return res.status(200).json({
      ok: true,
      data: {
        sales: enrichedSales,
        meta: {
          total: sales.length,
          totalRevenue,
          totalPaid,
          totalPending,
          channels
        },
        customers,
        products
      }
    });
  }

  // ─── POST: registrar nueva venta ───────────────────────────
  if (req.method === 'POST') {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ') || auth.length < 15) {
      return res.status(401).json({ ok: false, message: 'No autorizado' });
    }

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const {
      customer_name,
      customer_phone = '',
      customer_email = '',
      channel = 'Manual',
      payment_status = 'paid',
      notes = '',
      date,
      items = []
    } = body;

    // Validaciones
    if (!customer_name || !customer_name.trim()) {
      return res.status(400).json({ ok: false, message: 'El nombre del cliente es requerido.' });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ ok: false, message: 'La venta debe tener al menos un producto.' });
    }
    for (const item of items) {
      if (!item.product_name || !item.quantity || item.quantity < 1 || !item.price || item.price < 0) {
        return res.status(400).json({ ok: false, message: 'Cada item debe tener producto, cantidad ≥ 1 y precio ≥ 0.' });
      }
    }

    const total = items.reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity)), 0);
    const amountPaid = payment_status === 'paid' ? total : 0;
    const saleDate = date ? new Date(date).toISOString() : new Date().toISOString();

    // 1. Upsert cliente: buscar por teléfono primero, luego por nombre
    let customerId;
    const phoneKey = (customer_phone || '').trim();
    const nameKey = (customer_name || '').trim();

    let existingRows;
    if (phoneKey) {
      existingRows = await sql`
        SELECT id FROM customers WHERE phone = ${phoneKey} LIMIT 1
      `;
    }
    if (!existingRows || existingRows.length === 0) {
      existingRows = await sql`
        SELECT id FROM customers WHERE LOWER(name) = LOWER(${nameKey}) LIMIT 1
      `;
    }

    if (existingRows.length > 0) {
      customerId = existingRows[0].id;
      // Actualizar datos si se proveyeron
      await sql`
        UPDATE customers SET
          phone = COALESCE(NULLIF(${phoneKey}, ''), phone),
          email = COALESCE(NULLIF(${customer_email.trim()}, ''), email)
        WHERE id = ${customerId}
      `;
    } else {
      const [newCustomer] = await sql`
        INSERT INTO customers (name, phone, email)
        VALUES (${nameKey}, ${phoneKey || null}, ${customer_email.trim() || null})
        RETURNING id
      `;
      customerId = newCustomer.id;
    }

    // 2. Insertar venta
    const [newSale] = await sql`
      INSERT INTO sales (customer_id, total, channel, status, payment_status, amount_paid, paid_amount, notes, created_at)
      VALUES (
        ${customerId},
        ${total},
        ${channel},
        'completed',
        ${payment_status},
        ${amountPaid},
        ${amountPaid},
        ${notes.trim() || null},
        ${saleDate}
      )
      RETURNING id
    `;

    // 3. Insertar items + descontar stock
    for (const item of items) {
      const qty = Number(item.quantity);
      const price = Number(item.price);
      const productId = item.product_id ? Number(item.product_id) : null;

      await sql`
        INSERT INTO sale_items (sale_id, product_id, product_name, price, quantity)
        VALUES (${newSale.id}, ${productId}, ${item.product_name}, ${price}, ${qty})
      `;

      // Descontar stock solo si hay product_id vinculado
      if (productId) {
        await sql`
          UPDATE products
          SET stock = GREATEST(0, stock - ${qty})
          WHERE id = ${productId}
        `;
      }
    }

    // 4. Actualizar totales del cliente
    await sql`
      UPDATE customers SET
        order_count      = order_count + 1,
        total_spent      = total_spent + ${amountPaid},
        total_debt       = total_debt  + ${payment_status === 'pending' ? total : 0},
        last_purchase_at = ${saleDate}
      WHERE id = ${customerId}
    `;

    return res.status(200).json({
      ok: true,
      message: `Venta registrada. Total: $${total.toLocaleString('es-CO')}.`,
      data: { sale_id: newSale.id, total, customer_id: customerId }
    });
  }

  return res.status(405).json({ ok: false, message: 'Método no permitido' });
}
