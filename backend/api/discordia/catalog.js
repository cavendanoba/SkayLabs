// backend/api/discordia/catalog.js
// Módulo de Catálogo:
//   GET    → lista todos los productos activos
//   POST   → crea un nuevo producto
//   PUT    → actualiza un producto existente (id en body)
//   DELETE → elimina un producto (soft delete: active=false)
import { sql } from './db.js';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  // ─── GET: lista de productos ───────────────────────────────
  if (req.method === 'GET') {
    const rows = await sql`
      SELECT id, name, price, stock, category, image, description, active
      FROM products
      WHERE active = true
      ORDER BY name ASC
    `;

    // Métricas agregadas
    const totalValue = rows.reduce((sum, p) => sum + Number(p.price) * Number(p.stock), 0);
    const lowStock = rows.filter(p => Number(p.stock) <= 5).length;
    const categories = [...new Set(rows.map(p => p.category).filter(Boolean))];

    return res.status(200).json({
      ok: true,
      data: {
        products: rows,
        meta: {
          total: rows.length,
          lowStock,
          totalValue,
          categories: categories.length
        }
      }
    });
  }

  // ─── POST: crear producto ──────────────────────────────────
  if (req.method === 'POST') {
    const { name, price, stock = 0, category = '', image = '', description = '' } = req.body || {};

    if (!name || name.trim() === '') {
      return res.status(400).json({ ok: false, message: 'El nombre del producto es requerido.' });
    }
    if (price == null || Number(price) < 0) {
      return res.status(400).json({ ok: false, message: 'El precio debe ser un número >= 0.' });
    }

    const [row] = await sql`
      INSERT INTO products (name, price, stock, category, image, description, active)
      VALUES (
        ${name.trim()},
        ${Number(price)},
        ${Number(stock) || 0},
        ${category.trim() || null},
        ${image.trim() || 'assets/default.png'},
        ${description.trim() || null},
        true
      )
      RETURNING id, name, price, stock, category, image, description, active
    `;
    return res.status(201).json({ ok: true, data: row });
  }

  // ─── PUT: actualizar producto ──────────────────────────────
  if (req.method === 'PUT') {
    const { id, name, price, stock, category, image, description } = req.body || {};

    if (!id) return res.status(400).json({ ok: false, message: 'id requerido.' });
    if (!name || name.trim() === '') return res.status(400).json({ ok: false, message: 'El nombre es requerido.' });
    if (price == null || Number(price) < 0) return res.status(400).json({ ok: false, message: 'El precio debe ser >= 0.' });

    const [row] = await sql`
      UPDATE products
      SET
        name        = ${name.trim()},
        price       = ${Number(price)},
        stock       = ${Number(stock) >= 0 ? Number(stock) : 0},
        category    = ${category?.trim() || null},
        image       = ${image?.trim() || 'assets/default.png'},
        description = ${description?.trim() || null}
      WHERE id = ${id} AND active = true
      RETURNING id, name, price, stock, category, image, description, active
    `;

    if (!row) return res.status(404).json({ ok: false, message: 'Producto no encontrado.' });
    return res.status(200).json({ ok: true, data: row });
  }

  // ─── DELETE: soft delete (active = false) ──────────────────
  if (req.method === 'DELETE') {
    const { id } = req.body || {};
    if (!id) return res.status(400).json({ ok: false, message: 'id requerido.' });

    await sql`UPDATE products SET active = false WHERE id = ${id}`;
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ ok: false, message: 'Method not allowed' });
}