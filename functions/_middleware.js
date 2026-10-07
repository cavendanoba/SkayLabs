// Redirige skaylabs.pages.dev -> skaylabs.site (301), conservando ruta y query.
// /sw.js se exime: los navegadores no permiten actualizar un Service Worker
// a través de una redirección, y así los SW viejos pueden recibir el kill-switch.
export async function onRequest(context) {
  const url = new URL(context.request.url);
  if (url.hostname === 'skaylabs.pages.dev' && !url.pathname.endsWith('/sw.js')) {
    url.protocol = 'https:';
    url.hostname = 'skaylabs.site';
    url.port = '';
    return Response.redirect(url.toString(), 301);
  }
  return context.next();
}
