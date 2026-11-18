// functions/api/discordia/discounts.js
// POST (solo admin)
//   { ids: [1, 2], pct: 20 }  → aplica 20 % de descuento a esos productos
//   { ids: [1, 2], pct: 0 }   → quita el descuento y devuelve el precio original
//
// El precio original queda en reference_price ("antes") y price pasa a ser el
// precio con descuento, redondeado a la centena. Así el carrito, WhatsApp y las
// ventas usan el precio rebajado sin cambios. Si el producto ya tenía descuento,
// el nuevo porcentaje se calcula sobre el precio original, no sobre el rebajado.

import { getSql, json } from './_lib/db.js';

export async function onRequestPost({ request, env }) {
  let body;
  try { body = await request.json(); } catch { return json({ ok: false, message: 'JSON inválido.' }, 400); }

  const ids = [...new Set((Array.isArray(body.ids) ? body.ids : []).map(Number).filter(n => Number.isInteger(n) && n > 0))];
  const pct = Number(body.pct);
  if (!ids.length) return json({ ok: false, message: 'Selecciona al menos un producto.' }, 400);
  if (!Number.isFinite(pct) || pct < 0 || pct > 90) return json({ ok: false, message: 'El descuento debe estar entre 1 % y 90 %.' }, 400);

  const sql = getSql(env);
  try {
    const rows = pct === 0
      ? await sql`
          UPDATE products
          SET price = reference_price, reference_price = NULL, updated_at = NOW()
          WHERE id = ANY(${ids}) AND reference_price > price
          RETURNING *`
      : await sql`
          UPDATE products p
          SET reference_price = b.base,
              price = GREATEST(100, ROUND(b.base * (100 - ${pct}) / 10000.0) * 100),
              updated_at = NOW()
          FROM (
            SELECT id, CASE WHEN reference_price > price THEN reference_price ELSE price END AS base
            FROM products WHERE id = ANY(${ids}) AND price > 0
          ) b
          WHERE p.id = b.id
          RETURNING p.*`;
    return json({ ok: true, data: rows });
  } catch (err) {
    console.error('[Discordia descuentos]', err);
    return json({ ok: false, message: 'No se pudo guardar el descuento.' }, 500);
  }
}

export async function onRequestGet() {
  return json({ ok: false, message: 'Método no permitido.' }, 405);
}
