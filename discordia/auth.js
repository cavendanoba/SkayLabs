// discordia/auth.js
// ─────────────────────────────────────────────────────────────
// Guard de autenticación para el panel admin.
//
// ¿Cómo funciona?
// - requireAuth() se llama al inicio de admin.js
// - Lee el token de localStorage
// - Si no hay token → redirige a login.html inmediatamente
// - Si hay token → permite continuar
//
// ¿Por qué localStorage y no cookies?
// Para este caso (admin personal de un solo usuario) es
// suficiente. En una app multiusuario usaríamos JWT con
// httpOnly cookies y refresh tokens.
// ─────────────────────────────────────────────────────────────

export function requireAuth() {
  const token = localStorage.getItem('discordia_admin_token');
  if (!token) {
    window.location.href = './login.html';
    throw new Error('No autenticado'); // detiene la ejecución del resto del módulo
  }
  return token;
}

export function getAdminUser() {
  return localStorage.getItem('discordia_admin_user') || 'Admin';
}

export function logout() {
  localStorage.removeItem('discordia_admin_token');
  localStorage.removeItem('discordia_admin_user');
  window.location.href = './login.html';
}