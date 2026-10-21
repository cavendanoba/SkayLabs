// functions/api/discordia/products.js
// GET  → listar todos (incluyendo inactivos, para el admin)
// POST → crear producto nuevo
// PUT  → editar producto (con ID en payload)
// DELETE → eliminar producto (con ID en payload)
// 
// Nota: También existen rutas dinámicas en products/[id].js para PUT/DELETE con ID en URL

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
<<<<<<< HEAD
  const { name, price, stock, category, image, description, active, cost_price, code } = body;
  const publicPrice = optionalMoney(price);
  const costPrice = optionalMoney(cost_price);
=======
  const { name, price, stock, category, image, description, code } = body;
>>>>>>> 30b96ae19e03ed9f87792572b07b3a3f71d26030

  if (!name || publicPrice === null || stock === undefined || !category) {
    return json({ ok: false, message: 'Faltan campos obligatorios.' }, 400);
  }

<<<<<<< HEAD
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
=======
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
>>>>>>> 30b96ae19e03ed9f87792572b07b3a3f71d26030
}

export async function onRequestPut({ request, env }) {
  const sql = getSql(env);
  const body = await request.json();
<<<<<<< HEAD
  const { id, name, price, stock, category, image, description, active, cost_price, code } = body;
=======
  const { id, name, price, stock, category, image, description, code } = body;
>>>>>>> 30b96ae19e03ed9f87792572b07b3a3f71d26030

  if (!id || !name || !price || stock === undefined || !category) {
    return json({ ok: false, message: 'Faltan campos obligatorios.' }, 400);
  }

<<<<<<< HEAD
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
=======
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
>>>>>>> 30b96ae19e03ed9f87792572b07b3a3f71d26030
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
