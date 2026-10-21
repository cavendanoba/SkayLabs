// functions/api/discordia/products.js
// GET    → listar todos (incluyendo inactivos, para el admin)
// POST   → crear producto nuevo
// PUT    → editar producto existente
// DELETE → desactivar producto (nunca borramos, solo active=false)

import { getSql, json } from './_lib/db.js';

function optionalMoney(value) {
  if (value === undefined || value === null || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function optionalText(value) {
  const text = String(value ?? '').trim();
  return text || null;
}

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
  const { name, price, stock, category, image, description, active, cost_price, code } = body;
  const publicPrice = optionalMoney(price);
  const costPrice = optionalMoney(cost_price);

  if (!name || publicPrice === null || stock === undefined || !category) {
    return json({ ok: false, message: 'Faltan campos obligatorios.' }, 400);
  }

  const [product] = await sql`
    INSERT INTO products (name, price, stock, category, image, description, active, cost_price, code)
    VALUES (
      ${name.trim()}, ${publicPrice}, ${Number(stock)}, ${category.trim()},
      ${optionalText(image)}, ${optionalText(description)}, ${active !== undefined ? Boolean(active) : true},
      ${costPrice}, ${optionalText(code)}
    )
    RETURNING *
  `;
  return json({ ok: true, data: product }, 201);
}

export async function onRequestPut({ request, env }) {
  const sql = getSql(env);
  const body = await request.json();
  const { id, name, price, stock, category, image, description, active, cost_price, code } = body;

  if (!id) return json({ ok: false, message: 'ID requerido.' }, 400);

  const publicPrice = optionalMoney(price);
  const costPrice = optionalMoney(cost_price);
  if (!name || publicPrice === null || stock === undefined || !category) {
    return json({ ok: false, message: 'Faltan campos obligatorios.' }, 400);
  }

  const [product] = await sql`
    UPDATE products SET
      name        = ${name.trim()},
      price       = ${publicPrice},
      stock       = ${Number(stock)},
      category    = ${category.trim()},
      image       = ${optionalText(image)},
      description = ${optionalText(description)},
      active      = ${active !== undefined ? active : true},
      cost_price  = ${costPrice},
      code        = ${optionalText(code)},
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
