// Punto de entrada de la aplicación - app.js
import { Router } from '/copcash/js/controllers/router.js';
import { NavbarView } from '/copcash/js/views/navbarView.js';
import { storage } from '/copcash/js/models/storage.js';

document.addEventListener('DOMContentLoaded', () => {
  // Restaurar modo oscuro
  const darkMode = localStorage.getItem('darkMode') === 'true';
  if (darkMode) {
    document.documentElement.classList.add('dark');
  }

  // Renderizar navbar
  const navbarContainer = document.getElementById('navbar-container');
  navbarContainer.innerHTML = new NavbarView().render();

  // Inicializar router
  const router = new Router();

  // Navegación inicial
  router.navigate('dashboard');

  // Listener para cambios en el storage desde otras pestañas
  window.addEventListener('storage', () => {
    router.navigate(router.currentView);
  });
});
