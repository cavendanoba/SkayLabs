// functions/api/discordia/import-image.js
// POST (solo admin) { product_id, url } → copia a R2 una foto de la tienda del proveedor
// y la asigna al producto. Solo acepta los servidores de imágenes de Trendy y Engol.
// Con gallery: true la agrega a sus fotos adicionales en vez de reemplazar la principal.

import { getSql, json } from './_lib/db.js';
import { guardarImagen, TIPOS, MAX_BYTES } from './_lib/images.js';

const PERMITIDOS = /(^|\.)(vtexassets\.com|vteximg\.com\.br|cdn\.shopify\.com)$/i;

export async function onRequestPost({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, message: 'JSON inválido.' }, 400);
  }

  const productId = Number(body.product_id);
  let origen;
  try {
    origen = new URL(body.url);
  } catch {
    return json({ ok: false, message: 'URL inválida.' }, 400);
  }
  if (!productId || origen.protocol !== 'https:' || !PERMITIDOS.test(origen.hostname)) {
    return json({ ok: false, message: 'Producto o servidor no permitido.' }, 400);
  }

  const resp = await fetch(origen.toString(), { redirect: 'manual' });
  if (!resp.ok) return json({ ok: false, message: `El proveedor respondió ${resp.status}.` }, 502);

  const tipo = (resp.headers.get('Content-Type') || '').split(';')[0].trim().toLowerCase();
  if (!TIPOS[tipo]) return json({ ok: false, message: `Formato no permitido: ${tipo}.` }, 400);

  const datos = await resp.arrayBuffer();
  if (datos.byteLength > MAX_BYTES) return json({ ok: false, message: 'La imagen supera los 3 MB.' }, 400);

  const url = await guardarImagen(env, datos, tipo);
  const sql = getSql(env);
  const [producto] = body.gallery
    ? await sql`UPDATE products SET gallery = COALESCE(gallery, '[]'::jsonb) || ${JSON.stringify([url])}::jsonb, updated_at = NOW() WHERE id = ${productId} RETURNING id`
    : await sql`UPDATE products SET image = ${url}, updated_at = NOW() WHERE id = ${productId} RETURNING id`;
  if (!producto) return json({ ok: false, message: 'Producto no encontrado.' }, 404);

  return json({ ok: true, url });
}
