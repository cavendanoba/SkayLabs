// functions/api/discordia/products.js
// GET  → listar todos (incluyendo inactivos, para el admin)
// POST → crear producto nuevo
// PUT  → editar producto (con ID en payload)
// DELETE → eliminar producto (con ID en payload)
// 
// Nota: También existen rutas dinámicas en products/[id].js para PUT/DELETE con ID en URL

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

export async function onRequestPut({ request, env }) {
  const sql = getSql(env);
  const body = await request.json();
  const { id, name, price, stock, category, image, description, code } = body;

  if (!id || !name || !price || stock === undefined || !category) {
    return json({ ok: false, message: 'Faltan campos obligatorios.' }, 400);
  }

  try {
    const [product] = await sql`
      UPDATE products
      SET name = ${name}, price = ${Number(price)}, stock = ${Number(stock)}, 
          category = ${category}, image = ${image || null}, 
          description = ${description || null}, code = ${code || null}
      WHERE id = ${Number(id)}
      RETURNING *
    `;

    if (!product) {
      return json({ ok: false, message: 'Producto no encontrado.' }, 404);
    }

    return json({ ok: true, data: product });
  } catch (err) {
    console.error('Error al actualizar producto:', err);
    return json({ ok: false, message: 'Error al actualizar el producto.' }, 500);
  }
}

export async function onRequestDelete({ request, env }) {
  const sql = getSql(env);
  const body = await request.json();
  const { id } = body;

  if (!id) {
    return json({ ok: false, message: 'ID del producto es requerido.' }, 400);
  }

  try {
    // Soft delete: marcar como inactivo
    const [product] = await sql`
      UPDATE products
      SET active = false
      WHERE id = ${Number(id)}
      RETURNING *
    `;

    if (!product) {
      return json({ ok: false, message: 'Producto no encontrado.' }, 404);
    }

    return json({ ok: true, data: product });
  } catch (err) {
    console.error('Error al eliminar producto:', err);
    return json({ ok: false, message: 'Error al eliminar el producto.' }, 500);
  }
}
