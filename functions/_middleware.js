// functions/_middleware.js
//
// Corre antes de cada petición a skaylabs.site.
// 1. Cierra el paso a archivos internos del repositorio que Pages publicaría por estar en la raíz
//    (scripts, backend viejo de Vercel, documentación, configuración, archivos ocultos).
// 2. Responde 404 de inmediato a las rutas que usan los bots que buscan secretos (.env, .git, .ssh…).
// 3. Agrega cabeceras de seguridad a todas las respuestas.

const PREFIJOS_BLOQUEADOS = [
  '/scripts/', '/backend/', '/trash/', '/node_modules/', '/functions/',
  '/api/copcash/', '/api/health.js', '/conf/', '/config/', '/@fs/', '/wp-', '/phpmyadmin', '/cgi-bin/',
];
const ARCHIVOS_BLOQUEADOS = new Set([
  '/package.json', '/package-lock.json', '/vercel.json', '/wrangler.toml', '/404.js', '/netlify.toml',
]);
const EXTENSIONES_BLOQUEADAS = /\.(md|toml|sql|env|bak|save|old|orig|log|sh|ps1|lock|ya?ml|ini|pem|key|crt|sqlite|db|zip|tar|gz)$/i;

function bloqueada(rutaCruda) {
  let ruta;
  try { ruta = decodeURIComponent(rutaCruda); } catch { return true; }
  ruta = ruta.toLowerCase();
  if (ruta.includes('..') || ruta.includes('\\') || ruta.includes('\0')) return true; // salirse de carpetas
  if (ruta.split('/').some((seg) => seg.startsWith('.') && seg !== '.well-known')) return true; // .env, .git, .ssh, .wrangler…
  if (ARCHIVOS_BLOQUEADOS.has(ruta)) return true;
  if (PREFIJOS_BLOQUEADOS.some((p) => ruta.startsWith(p))) return true;
  // archivos .js sueltos del backend viejo de Vercel (las funciones nuevas no llevan extensión)
  if (ruta.startsWith('/api/') && ruta.endsWith('.js')) return true;
  if (EXTENSIONES_BLOQUEADAS.test(ruta)) return true;
  return false;
}

const CABECERAS = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Frame-Options': 'SAMEORIGIN',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

export async function onRequest({ request, next }) {
  const url = new URL(request.url);
  // skaylabs.pages.dev -> skaylabs.site (301), conservando ruta y query.
  // /sw.js se exime: un Service Worker no se puede actualizar a través de una
  // redirección, y así los SW viejos reciben el kill-switch.
  // Las URLs de vista previa (xxxx.skaylabs.pages.dev) no se redirigen.
  if (url.hostname === 'skaylabs.pages.dev' && !url.pathname.endsWith('/sw.js')) {
    const destino = new URL(url);
    destino.protocol = 'https:';
    destino.hostname = 'skaylabs.site';
    destino.port = '';
    return Response.redirect(destino.toString(), 301);
  }
  if (bloqueada(url.pathname)) {
    return new Response('No encontrado', { status: 404, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } });
  }
  const resp = await next();
  const salida = new Response(resp.body, resp);
  for (const [k, v] of Object.entries(CABECERAS)) if (!salida.headers.has(k)) salida.headers.set(k, v);
  return salida;
}
