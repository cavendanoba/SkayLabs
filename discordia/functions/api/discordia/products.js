// functions/api/discordia/products.js
// GET    → listar todos (incluyendo inactivos, para el admin)
// POST   → crear producto nuevo
// PUT    → editar producto existente
// DELETE → desactivar producto (nunca borramos, solo active=false)

import { getSql, json } from './_lib/db.js';

export async function onRequestGet({ env }) {
  const sql = getSql(env);
  const products = await sql`
    SELECT * FROM products ORDER BY active DESC, category, name
  `;
  return json({ ok: true, data: products });
}

export async function onRequestPost({ request, env }) {
  const sql = getSql(env);
  const body = await request.json();
  const { name, price, stock, category, image, description } = body;

  if (!name || !price || stock === undefined || !category) {
    return json({ ok: false, message: 'Faltan campos obligatorios.' }, 400);
  }

  const [product] = await sql`
    INSERT INTO products (name, price, stock, category, image, description)
    VALUES (${name}, ${Number(price)}, ${Number(stock)}, ${category}, ${image || null}, ${description || null})
    RETURNING *
  `;
  return json({ ok: true, data: product }, 201);
}

export async function onRequestPut({ request, env }) {
  const sql = getSql(env);
  const body = await request.json();
  const { id, name, price, stock, category, image, description, active } = body;

  if (!id) return json({ ok: false, message: 'ID requerido.' }, 400);

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
  return json({ ok: true, data: product });
}

export async function onRequestDelete({ request, env }) {
  const sql = getSql(env);
  const body = await request.json();
  const { id } = body;

  if (!id) return json({ ok: false, message: 'ID requerido.' }, 400);

  await sql`UPDATE products SET active = false, updated_at = NOW() WHERE id = ${Number(id)}`;
  return json({ ok: true, message: 'Producto desactivado.' });
}
