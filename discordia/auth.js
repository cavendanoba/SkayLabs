// discordia/auth.js
// ─────────────────────────────────────────────────────────────
// Guard de autenticación para el panel admin.
//
// ¿Cómo funciona?
// - requireAuth() se llama al inicio de admin.js
// - Lee el token de localStorage
// - Si no hay token → redirige a login.html inmediatamente
// - Si hay token → permite continuar
// - Inactividad: Cierra sesión después de 2 minutos sin actividad
//
// ¿Por qué localStorage y no cookies?
// Para este caso (admin personal de un solo usuario) es
// suficiente. En una app multiusuario usaríamos JWT con
// httpOnly cookies y refresh tokens.
// ─────────────────────────────────────────────────────────────

const INACTIVITY_TIMEOUT = 60 * 60 * 1000; // 1 hora sin actividad
let inactivityTimer = null;

function resetInactivityTimer() {
  if (inactivityTimer) {
    clearTimeout(inactivityTimer);
  }
  
  // Solo inicia el timer si hay sesión activa
  if (localStorage.getItem('discordia_admin_token')) {
    inactivityTimer = setTimeout(() => {
      logout();
    }, INACTIVITY_TIMEOUT);
  }
}

// Detectar actividad del usuario en toda la página
if (typeof window !== 'undefined' && localStorage.getItem('discordia_admin_token')) {
  document.addEventListener('mousedown', resetInactivityTimer);
  document.addEventListener('keydown', resetInactivityTimer);
  document.addEventListener('touchstart', resetInactivityTimer);
  // Mover el mouse o desplazarse también cuenta como actividad (como máximo un reinicio cada 30 s).
  let ultimoReinicio = 0;
  const actividadSuave = () => {
    const ahora = Date.now();
    if (ahora - ultimoReinicio < 30000) return;
    ultimoReinicio = ahora;
    resetInactivityTimer();
  };
  document.addEventListener('mousemove', actividadSuave, { passive: true });
  document.addEventListener('scroll', actividadSuave, { passive: true, capture: true });
  document.addEventListener('click', resetInactivityTimer);
  
  // Inicia el timer cuando se carga la página
  resetInactivityTimer();
}

export function requireAuth() {
  const token = localStorage.getItem('discordia_admin_token');
  if (!token) {
    window.location.href = '/discordia/login.html';
    throw new Error('No autenticado'); // detiene la ejecución del resto del módulo
  }
  conectarApi(token);
  
  // Inicia el timer de inactividad
  resetInactivityTimer();
  return token;
}

// Todas las llamadas del panel a /api/discordia/ llevan el token; si el servidor
// responde 401 (token vencido o inválido) se vuelve al login.
let conectado = false;
function conectarApi(token) {
  if (conectado) return;
  conectado = true;
  const original = window.fetch.bind(window);
  window.fetch = async (recurso, opciones = {}) => {
    const url = new URL(typeof recurso === 'string' ? recurso : recurso.url, location.href);
    if (url.origin !== location.origin || !url.pathname.startsWith('/api/discordia/')) return original(recurso, opciones);
    const headers = new Headers(opciones.headers || (typeof recurso === 'string' ? undefined : recurso.headers));
    headers.set('Authorization', `Bearer ${token}`);
    const r = await original(recurso, { ...opciones, headers });
    if (r.status === 401) logout();
    return r;
  };
}

export function getAdminUser() {
  return localStorage.getItem('discordia_admin_user') || 'Admin';
}

export function logout() {
  if (inactivityTimer) {
    clearTimeout(inactivityTimer);
  }
  localStorage.removeItem('discordia_admin_token');
  localStorage.removeItem('discordia_admin_user');
  window.location.href = '/discordia/login.html';
}