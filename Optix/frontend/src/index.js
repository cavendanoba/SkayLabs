// frontend/src/index.js

import './assets/styles/main.css';
import router from './utils/router.js';
import themeUtil from './utils/theme.js';
import authService from './services/auth.service.js';

// Páginas
import renderLoginPage from './pages/login.page.js';
import renderDashboardPage from './pages/dashboard.page.js';

// Inicializar tema
themeUtil.init();

// Registrar rutas base
router.register('/login', renderLoginPage);
router.register('/dashboard', renderDashboardPage);

// Rutas dinámicas (lazy load para rendimiento)
router.register('/patients', async (container) => {
  const { render } = await import('./pages/patients.page.js');
  render(container);
});
router.register('/appointments', async (container) => {
  const { render } = await import('./pages/appointments.page.js');
  render(container);
});
router.register('/transactions', async (container) => {
  const { render } = await import('./pages/transactions.page.js');
  render(container);
});
router.register('/admin/users', async (container, params) => {
  const user = authService.getLocalUser();
  if (user?.role !== 'ADMIN') {
    router.navigate('/403');
    return;
  }
  const { render } = await import('./pages/users.page.js');
  render(container);
});
router.register('/hx-records', async (container) => {
  const { render } = await import('./pages/hx-records.page.js');
  render(container);
});
router.register('/hx-records/:id', async (container, params) => {
  const { renderEditor } = await import('./pages/hx-records.page.js');
  renderEditor(container, params.id);
});
router.register('/403', async (container) => {
  const { render } = await import('./pages/forbidden.page.js');
  render(container);
});
router.register('/404', async (container) => {
  const { render } = await import('./pages/not-found.page.js');
  render(container);
});

// Guard de autenticación
router.beforeEach(async (path) => {
  const isAuthenticated = authService.isAuthenticated();

  if (path === '/login') {
    if (isAuthenticated) {
      router.navigate('/dashboard');
      return false;
    }
    return true;
  }

  // Páginas públicas de error
  if (path === '/403' || path === '/404') return true;

  // Todas las otras rutas requieren autenticación
  if (!isAuthenticated) {
    router.navigate('/login');
    return false;
  }

  return true;
});

// Iniciar la app
window.addEventListener('DOMContentLoaded', () => {
  const path = window.location.pathname || '/';

  if (path === '/' || path === '') {
    router.navigate(authService.isAuthenticated() ? '/dashboard' : '/login');
  } else {
    router.navigate(path + window.location.search);
  }
});

window.router = router;
window.authService = authService;
window.themeUtil = themeUtil;
