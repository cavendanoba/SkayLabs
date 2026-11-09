// functions/api/discordia/image/[[key]].js
// GET público → entrega una foto de producto guardada en R2.
// El nombre de cada archivo es único, así que se puede cachear para siempre.

export async function onRequestGet({ params, env }) {
  const key = (params.key || []).join('/');
  if (!key.startsWith('products/')) return new Response('No encontrada', { status: 404 });

  const objeto = await env.IMAGES.get(key);
  if (!objeto) return new Response('No encontrada', { status: 404 });

  return new Response(objeto.body, {
    headers: {
      'Content-Type': objeto.httpMetadata?.contentType || 'application/octet-stream',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
