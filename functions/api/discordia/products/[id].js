// functions/api/discordia/products/[id].js
// Maneja rutas dinámicas para productos:
// PUT  → /api/discordia/products/:id (editar)
// DELETE → /api/discordia/products/:id (desactivar)

import { getSql, json } from '../_lib/db.js';

export async function onRequestPut({ request, env, params }) {
  const sql = getSql(env);
  const productId = params.id;

  if (!productId || isNaN(productId)) {
    return json({ ok: false, message: 'ID de producto inválido.' }, 400);
  }

  try {
    const body = await request.json();
    const { name, price, stock, category, image, description, active } = body;

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
      WHERE id = ${Number(productId)}
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

export async function onRequestDelete({ request, env, params }) {
  const sql = getSql(env);
  const productId = params.id;

  if (!productId || isNaN(productId)) {
    return json({ ok: false, message: 'ID de producto inválido.' }, 400);
  }

  try {
    await sql`UPDATE products SET active = false, updated_at = NOW() WHERE id = ${Number(productId)}`;
    return json({ ok: true, message: 'Producto desactivado.' });
  } catch (err) {
    console.error('Error al desactivar producto:', err);
    return json({ ok: false, message: 'Error al desactivar el producto.' }, 500);
  }
}
