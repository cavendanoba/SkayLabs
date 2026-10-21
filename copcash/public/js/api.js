const CLAVE = 'copcash_token_v2';

function leer() { try { return localStorage.getItem(CLAVE); } catch { return null; } }

export const sesion = {
  token: leer(),
  guardar(t) { this.token = t; try { localStorage.setItem(CLAVE, t); } catch { /* sin almacenamiento */ } },
  salir() {
    this.token = null;
    try { localStorage.removeItem(CLAVE); } catch { /* nada */ }
    window.dispatchEvent(new Event('copcash:salir'));
  },
};

// La API vive junto a la página: /api en la red local, /copcash/api en skaylabs.site
const BASE_API = new URL('api', new URL('.', location.href)).pathname;

async function pedir(metodo, ruta, cuerpo) {
  const r = await fetch(`${BASE_API}${ruta}`, {
    method: metodo,
    headers: { 'Content-Type': 'application/json', ...(sesion.token ? { Authorization: `Bearer ${sesion.token}` } : {}) },
    body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
  });
  // Renovación de la sesión: el servidor manda un token nuevo de vez en cuando
  const nuevo = r.headers.get('X-Copcash-Token');
  if (nuevo && sesion.token) sesion.guardar(nuevo);
  let datos = null;
  try { datos = await r.json(); } catch { /* sin cuerpo */ }
  if (!r.ok) {
    const e = new Error(datos?.error || `El servidor respondió ${r.status}.`);
    e.status = r.status;
    if (r.status === 401 && sesion.token) sesion.salir();
    throw e;
  }
  return datos;
}

export const api = {
  get: (r) => pedir('GET', r),
  post: (r, c = {}) => pedir('POST', r, c),
  put: (r, c = {}) => pedir('PUT', r, c),
  del: (r) => pedir('DELETE', r),
};
