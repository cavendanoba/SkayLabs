// functions/api/discordia/_lib/images.js
// Guarda fotos de productos en el bucket R2 (binding IMAGES).

export const TIPOS = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
export const MAX_BYTES = 3 * 1024 * 1024;

export async function guardarImagen(env, datos, tipo) {
  const key = `products/${crypto.randomUUID()}.${TIPOS[tipo]}`;
  await env.IMAGES.put(key, datos, { httpMetadata: { contentType: tipo } });
  return `/api/discordia/image/${key}`;
}
