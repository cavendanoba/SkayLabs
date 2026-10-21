// Cloudflare Pages Function — GET /api/status
// Verifica en vivo el estado de los servicios que SÍ exponen un endpoint HTTP público.
// No incluye PostgreSQL ni el túnel de Cloudflare en sí: no hay forma de verificarlos
// por HTTP sin exponer más superficie de la que ya está expuesta.

async function checkUrl(url, timeoutMs = 4000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { method: 'GET', signal: controller.signal });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

export async function onRequestGet() {
  const [nextcloudUp, casaosUp] = await Promise.all([
    checkUrl('https://nube.skaylabs.site/status.php'),
    checkUrl('https://casaos.skaylabs.site'),
  ]);

  const body = {
    checkedAt: new Date().toISOString(),
    services: [
      { name: 'Nextcloud', up: nextcloudUp, verifiable: true },
      { name: 'CasaOS', up: casaosUp, verifiable: true },
      { name: 'PostgreSQL', up: null, verifiable: false },
      { name: 'Cloudflare Tunnel', up: null, verifiable: false },
    ],
  };

  return new Response(JSON.stringify(body), {
    headers: {
      'content-type': 'application/json',
      'cache-control': 'no-store',
    },
  });
}
