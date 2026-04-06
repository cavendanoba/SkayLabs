// Punto de entrada de la aplicacion - app.js
import { Router } from '/copcash/js/controllers/router.js';
import { NavbarView } from '/copcash/js/views/navbarView.js';
import { storage } from '/copcash/js/models/storage.js';

function renderAuthScreen() {
  const container = document.getElementById('app-container');
  const navbarContainer = document.getElementById('navbar-container');
  navbarContainer.innerHTML = '';

  container.innerHTML = `
    <div class="max-w-md mx-auto">
      <div class="card p-8">
        <h1 class="text-2xl font-bold mb-2 text-neutral-900 dark:text-white">Iniciar sesion</h1>
        <p class="text-sm text-neutral-600 dark:text-neutral-400 mb-6">Tus datos se guardan en Neon DB por usuario.</p>

        <form id="auth-form" class="space-y-4">
          <input id="auth-nombre" type="text" placeholder="Nombre (solo registro)" class="w-full border rounded px-3 py-2 dark:bg-neutral-800 dark:border-neutral-700" />
          <input id="auth-email" type="email" placeholder="Email" class="w-full border rounded px-3 py-2 dark:bg-neutral-800 dark:border-neutral-700" required />
          <input id="auth-password" type="password" placeholder="Contrasena" class="w-full border rounded px-3 py-2 dark:bg-neutral-800 dark:border-neutral-700" required />
          <button id="auth-submit" type="submit" class="w-full bg-blue-600 hover:bg-blue-700 text-white rounded py-2 font-semibold">Entrar</button>
        </form>

        <button id="auth-toggle" class="mt-4 w-full text-sm text-blue-600 dark:text-blue-400">No tienes cuenta? Registrate</button>
        <p id="auth-error" class="mt-3 text-sm text-red-500 hidden"></p>
      </div>
    </div>
  `;

  let isRegister = false;
  const form = document.getElementById('auth-form');
  const toggle = document.getElementById('auth-toggle');
  const submit = document.getElementById('auth-submit');
  const nombre = document.getElementById('auth-nombre');
  const error = document.getElementById('auth-error');

  const syncMode = () => {
    nombre.style.display = isRegister ? 'block' : 'none';
    submit.textContent = isRegister ? 'Crear cuenta' : 'Entrar';
    toggle.textContent = isRegister ? 'Ya tienes cuenta? Inicia sesion' : 'No tienes cuenta? Registrate';
  };
  syncMode();

  toggle.addEventListener('click', () => {
    isRegister = !isRegister;
    error.classList.add('hidden');
    syncMode();
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    error.classList.add('hidden');
    try {
      const email = document.getElementById('auth-email').value.trim();
      const password = document.getElementById('auth-password').value;
      if (isRegister) {
        await storage.register(email, password, nombre.value.trim() || null);
      } else {
        await storage.login(email, password);
      }
      await bootApp();
    } catch (err) {
      error.textContent = err.message;
      error.classList.remove('hidden');
    }
  });
}

async function bootApp() {
  if (!storage.isAuthenticated()) {
    renderAuthScreen();
    return;
  }

  await storage.refresh();

  const navbarContainer = document.getElementById('navbar-container');
  navbarContainer.innerHTML = new NavbarView().render();

  const router = new Router();
  router.navigate('dashboard');

  window.addEventListener('storage', () => {
    router.navigate(router.currentView);
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  const darkMode = localStorage.getItem('darkMode') === 'true';
  if (darkMode) document.documentElement.classList.add('dark');
  await bootApp();
});
