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

// cost_price se agregó después; si la columna aún no existe en la base,
// se guarda el producto sin ese campo en vez de fallar.
async function tieneCosto(sql) {
  const r = await sql`SELECT 1 FROM information_schema.columns
                      WHERE table_name = 'products' AND column_name = 'cost_price' LIMIT 1`;
  return r.length > 0;
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

  try {
    const activo = active !== undefined ? Boolean(active) : true;
    const [product] = (await tieneCosto(sql))
      ? await sql`
          INSERT INTO products (name, price, stock, category, image, description, active, cost_price, code)
          VALUES (${String(name).trim()}, ${publicPrice}, ${Number(stock)}, ${String(category).trim()},
                  ${optionalText(image)}, ${optionalText(description)}, ${activo}, ${costPrice}, ${optionalText(code)})
          RETURNING *`
      : await sql`
          INSERT INTO products (name, price, stock, category, image, description, active, code)
          VALUES (${String(name).trim()}, ${publicPrice}, ${Number(stock)}, ${String(category).trim()},
                  ${optionalText(image)}, ${optionalText(description)}, ${activo}, ${optionalText(code)})
          RETURNING *`;
    return json({ ok: true, data: product }, 201);
  } catch (err) {
    console.error('Error al crear producto:', err);
    return json({ ok: false, message: 'Error al crear el producto.' }, 500);
  }
}

export async function onRequestPut({ request, env }) {
  const sql = getSql(env);
  const body = await request.json();
  const { id, name, price, stock, category, image, description, active, cost_price, code } = body;
  const publicPrice = optionalMoney(price);
  const costPrice = optionalMoney(cost_price);

  if (!id || !name || publicPrice === null || stock === undefined || !category) {
    return json({ ok: false, message: 'Faltan campos obligatorios.' }, 400);
  }

  try {
    const activo = active !== undefined ? Boolean(active) : true;
    const [product] = (await tieneCosto(sql))
      ? await sql`
          UPDATE products SET
            name = ${String(name).trim()}, price = ${publicPrice}, stock = ${Number(stock)},
            category = ${String(category).trim()}, image = ${optionalText(image)},
            description = ${optionalText(description)}, active = ${activo},
            cost_price = ${costPrice}, code = ${optionalText(code)}
          WHERE id = ${Number(id)}
          RETURNING *`
      : await sql`
          UPDATE products SET
            name = ${String(name).trim()}, price = ${publicPrice}, stock = ${Number(stock)},
            category = ${String(category).trim()}, image = ${optionalText(image)},
            description = ${optionalText(description)}, active = ${activo},
            code = ${optionalText(code)}
          WHERE id = ${Number(id)}
          RETURNING *`;

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
