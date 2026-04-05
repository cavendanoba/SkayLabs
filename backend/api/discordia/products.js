// backend/api/discordia/products.js
// CRUD completo de productos para el panel admin.
// GET    → listar todos (incluyendo inactivos para el admin)
// POST   → crear producto nuevo
// PUT    → editar producto existente
// DELETE → desactivar producto (nunca borramos, solo active=false)
import { sql } from './db.js';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  // ── GET: todos los productos (admin ve inactivos también) ──
  if (req.method === 'GET') {
    const products = await sql`
      SELECT * FROM products ORDER BY active DESC, category, name
    `;
    return res.status(200).json({ ok: true, data: products });
  }

  // ── POST: crear producto ───────────────────────────────────
  if (req.method === 'POST') {
    const { name, price, stock, category, image, description } = req.body;

    if (!name || !price || stock === undefined || !category) {
      return res.status(400).json({ ok: false, message: 'Faltan campos obligatorios.' });
    }

    const [product] = await sql`
      INSERT INTO products (name, price, stock, category, image, description)
      VALUES (${name}, ${Number(price)}, ${Number(stock)}, ${category}, ${image || null}, ${description || null})
      RETURNING *
    `;
    return res.status(201).json({ ok: true, data: product });
  }

  // ── PUT: editar producto ───────────────────────────────────
  if (req.method === 'PUT') {
    const { id, name, price, stock, category, image, description, active } = req.body;

    if (!id) return res.status(400).json({ ok: false, message: 'ID requerido.' });

    const [product] = await sql`
      UPDATE products SET
        name        = ${name},
        price       = ${Number(price)},
        stock       = ${Number(stock)},
        category    = ${category},
        image       = ${image || null},
        description = ${description || null},
        active      = ${active !== undefined ? active : true},
        updated_at  = NOW()
      WHERE id = ${Number(id)}
      RETURNING *
    `;
    return res.status(200).json({ ok: true, data: product });
  }

  // ── DELETE: desactivar producto ───────────────────────────
  if (req.method === 'DELETE') {
    const { id } = req.body;
    if (!id) return res.status(400).json({ ok: false, message: 'ID requerido.' });

    await sql`UPDATE products SET active = false, updated_at = NOW() WHERE id = ${Number(id)}`;
    return res.status(200).json({ ok: true, message: 'Producto desactivado.' });
  }

  return res.status(405).json({ ok: false, message: 'Método no permitido.' });
}