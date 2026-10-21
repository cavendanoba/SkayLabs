// functions/api/discordia/_lib/auth.js
// Token firmado (HMAC-SHA256) para el panel admin de Discordia.
// Necesita la variable secreta DISCORDIA_TOKEN_SECRETO en Cloudflare Pages.

const enc = new TextEncoder();
const b64url = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const desdeB64url = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4)), (c) => c.charCodeAt(0));

async function clave(secreto) {
  return crypto.subtle.importKey('raw', enc.encode(secreto), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

const DURACION = 12 * 3600; // 12 horas

export async function firmarToken(usuario, secreto) {
  if (!secreto || secreto.length < 32) throw new Error('Falta DISCORDIA_TOKEN_SECRETO (mínimo 32 caracteres).');
  const cuerpo = b64url(enc.encode(JSON.stringify({ u: usuario, exp: Math.floor(Date.now() / 1000) + DURACION })));
  const firma = await crypto.subtle.sign('HMAC', await clave(secreto), enc.encode(cuerpo));
  return `${cuerpo}.${b64url(firma)}`;
}

export async function verificarToken(token, secreto) {
  if (!token || !secreto) return null;
  const [cuerpo, firma] = String(token).split('.');
  if (!cuerpo || !firma) return null;
  let ok = false;
  try { ok = await crypto.subtle.verify('HMAC', await clave(secreto), desdeB64url(firma), enc.encode(cuerpo)); } catch { return null; }
  if (!ok) return null;
  try {
    const p = JSON.parse(new TextDecoder().decode(desdeB64url(cuerpo)));
    if (!p.exp || p.exp < Math.floor(Date.now() / 1000)) return null;
    return p;
  } catch { return null; }
}
