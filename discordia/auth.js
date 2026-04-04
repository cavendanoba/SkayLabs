// discordia/auth.js
// Verifica que hay sesión activa — si no, redirige al login
export function requireAuth() {
  const token = localStorage.getItem('discordia_admin_token');
  if (!token) {
    window.location.href = './login.html';
  }
}

export function logout() {
  localStorage.removeItem('discordia_admin_token');
  localStorage.removeItem('discordia_admin_user');
  window.location.href = './login.html';
}