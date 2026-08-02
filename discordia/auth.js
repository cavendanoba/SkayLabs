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

const INACTIVITY_TIMEOUT = 2 * 60 * 1000; // 2 minutos en milisegundos
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
  
  // Inicia el timer de inactividad
  resetInactivityTimer();
  return token;
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