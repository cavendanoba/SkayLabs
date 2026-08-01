// functions/api/discordia/products.js
// GET  → listar todos (incluyendo inactivos, para el admin)
// POST → crear producto nuevo
// 
// Nota: PUT y DELETE están en products/[id].js para rutas dinámicas

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
  const { name, price, stock, category, image, description, code } = body;

  if (!name || !price || stock === undefined || !category) {
    return json({ ok: false, message: 'Faltan campos obligatorios.' }, 400);
  }

  try {
    const [product] = await sql`
      INSERT INTO products (name, price, stock, category, image, description, code)
      VALUES (${name}, ${Number(price)}, ${Number(stock)}, ${category}, ${image || null}, ${description || null}, ${code || null})
      RETURNING *
    `;
    return json({ ok: true, data: product }, 201);
  } catch (err) {
    console.error('Error al crear producto:', err);
    return json({ ok: false, message: 'Error al crear el producto.' }, 500);
  }
}
