// functions/copcash/[[path]].js
//
// skaylabs.site/copcash/* → servidor de CopCash en casa, a través del Cloudflare Tunnel.
// La app corre en el servidor (Node + PostgreSQL); esta función solo reenvía cada petición.
//
// Variables de entorno del proyecto de Pages (Settings → Environment variables, en Production):
//   COPCASH_ORIGEN   = https://copcash-origen.skaylabs.site   (el hostname del túnel)
//   COPCASH_SECRETO  = el mismo valor de ORIGEN_SECRETO del .env del servidor (márcala como "Encrypt")
//
// El servidor rechaza cualquier petición que llegue por Cloudflare sin ese secreto,
// así que entrar directo a copcash-origen.skaylabs.site no sirve.

const SALTAR = ['host', 'cf-connecting-ip', 'cf-ipcountry', 'cf-ray', 'cf-visitor', 'x-forwarded-for', 'x-real-ip', 'x-copcash-origen', 'x-copcash-cliente-ip'];

export async function onRequest({ request, env }) {
  if (!env.COPCASH_ORIGEN || !env.COPCASH_SECRETO) {
    return new Response('CopCash todavía no está configurado en este sitio.', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  }

  const url = new URL(request.url);
  const destino = new URL(url.pathname + url.search, env.COPCASH_ORIGEN);

  const headers = new Headers();
  for (const [k, v] of request.headers) if (!SALTAR.includes(k.toLowerCase())) headers.set(k, v);
  headers.set('x-copcash-origen', env.COPCASH_SECRETO);
  headers.set('x-copcash-cliente-ip', request.headers.get('cf-connecting-ip') || '');

  const conCuerpo = !['GET', 'HEAD'].includes(request.method);
  let resp;
  try {
    resp = await fetch(destino, {
      method: request.method,
      headers,
      body: conCuerpo ? await request.arrayBuffer() : undefined, // cuerpos pequeños (JSON)
      redirect: 'manual',
    });
  } catch {
    return new Response('No pude conectar con el servidor de CopCash. Puede que esté apagado.', { status: 502, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  }

  // Si el servidor redirige, la dirección debe quedar en skaylabs.site y no en el origen
  const salida = new Response(resp.body, resp);
  const loc = salida.headers.get('Location');
  if (loc) {
    const l = new URL(loc, destino);
    if (l.host === destino.host) salida.headers.set('Location', l.pathname + l.search);
  }
  salida.headers.set('Strict-Transport-Security', 'max-age=31536000');
  return salida;
}
