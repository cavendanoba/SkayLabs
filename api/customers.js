// api/customers.js
// ─────────────────────────────────────────────────────────────
// Módulo de Clientes:
//   GET    → lista todos los clientes con métricas agregadas
//   POST   → crea un nuevo cliente
//   PUT    → edita un cliente existente (id en body)
//   DELETE → elimina un cliente (solo si no tiene ventas)
// ─────────────────────────────────────────────────────────────
import { sql } from './db.js';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  // ─── GET: lista de clientes ────────────────────────────────
  if (req.method === 'GET') {
    const customers = await sql`
      SELECT
        id, name, phone, email, city, notes,
        total_spent, total_debt, order_count, last_purchase_at,
        created_at
      FROM customers
      ORDER BY total_spent DESC NULLS LAST, name ASC
    `;

    const totalSpent = customers.reduce((sum, c) => sum + Number(c.total_spent || 0), 0);
    const totalDebt  = customers.reduce((sum, c) => sum + Number(c.total_debt  || 0), 0);
    const withDebt   = customers.filter(c => Number(c.total_debt || 0) > 0).length;
    const cities     = [...new Set(customers.map(c => c.city).filter(Boolean))].length;

    return res.status(200).json({
      ok: true,
      data: {
        customers,
        meta: {
          total: customers.length,
          totalSpent,
          totalDebt,
          withDebt,
          cities
        }
      }
    });
  }

  // ─── POST: crear cliente ───────────────────────────────────
  if (req.method === 'POST') {
    const { name, phone = '', email = '', city = '', notes = '' } = req.body || {};

    if (!name || name.trim() === '') {
      return res.status(400).json({ ok: false, message: 'El nombre del cliente es requerido.' });
    }

    const [row] = await sql`
      INSERT INTO customers (name, phone, email, city, notes, total_spent, total_debt, order_count)
      VALUES (
        ${name.trim()},
        ${phone.trim() || null},
        ${email.trim() || null},
        ${city.trim() || null},
        ${notes.trim() || null},
        0, 0, 0
      )
      RETURNING id, name, phone, email, city, notes, total_spent, total_debt, order_count, last_purchase_at, created_at
    `;
    return res.status(201).json({ ok: true, data: row });
  }

  // ─── PUT: actualizar cliente ───────────────────────────────
  if (req.method === 'PUT') {
    const { id, name, phone, email, city, notes } = req.body || {};

    if (!id) return res.status(400).json({ ok: false, message: 'id requerido.' });
    if (!name || name.trim() === '') return res.status(400).json({ ok: false, message: 'El nombre es requerido.' });

    const [row] = await sql`
      UPDATE customers
      SET
        name       = ${name.trim()},
        phone      = ${phone?.trim() || null},
        email      = ${email?.trim() || null},
        city       = ${city?.trim() || null},
        notes      = ${notes?.trim() || null},
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING id, name, phone, email, city, notes, total_spent, total_debt, order_count, last_purchase_at, created_at
    `;

    if (!row) return res.status(404).json({ ok: false, message: 'Cliente no encontrado.' });
    return res.status(200).json({ ok: true, data: row });
  }

  // ─── DELETE: eliminar cliente ──────────────────────────────
  if (req.method === 'DELETE') {
    const { id } = req.body || {};
    if (!id) return res.status(400).json({ ok: false, message: 'id requerido.' });

    // Verificar si tiene ventas registradas
    const [check] = await sql`SELECT COUNT(*)::int AS cnt FROM sales WHERE customer_id = ${id}`;
    if (check.cnt > 0) {
      return res.status(409).json({
        ok: false,
        message: `Este cliente tiene ${check.cnt} venta(s) registrada(s) y no puede eliminarse.`
      });
    }

    await sql`DELETE FROM customers WHERE id = ${id}`;
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ ok: false, message: 'Method not allowed' });
}
