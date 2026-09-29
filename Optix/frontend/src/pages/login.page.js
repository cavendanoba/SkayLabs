// frontend/src/pages/login.page.js

import authService from '../services/auth.service.js';
import Toast from '../components/toast.component.js';
import router from '../utils/router.js';

export async function renderLoginPage(container) {
  container.innerHTML = `
    <div class="login-wrapper">
      <div class="login-panel login-panel-dark">
        <div class="login-content">
          <img src="/brand/svg/optix-logo-dark.svg" class="login-logo-img" alt="Optix" />
          <p class="login-tagline">Gestión Clínica Oftalmológica</p>
        </div>
      </div>

      <div class="login-panel login-panel-light">
        <div class="login-form-wrapper">
          <div class="login-form-container">
            <h2>Iniciar Sesión</h2>
            <p class="text-muted">Ingresa tus credenciales para acceder</p>

            <form id="loginForm" class="login-form">
              <div class="form-group">
                <label for="email">Correo Electrónico</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="admin@optix.co"
                  required
                  autocomplete="email"
                />
                <div class="form-error" id="emailError"></div>
              </div>

              <div class="form-group">
                <label for="password">Contraseña</label>
                <div class="password-wrapper">
                  <input
                    type="password"
                    id="password"
                    name="password"
                    placeholder="••••••••"
                    required
                    autocomplete="current-password"
                  />
                  <button type="button" class="password-toggle" id="togglePassword">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  </button>
                </div>
                <div class="form-error" id="passwordError"></div>
              </div>

              <button type="submit" class="btn btn-primary btn-full">
                Iniciar Sesión
              </button>

              <div class="form-error text-center" id="generalError"></div>
            </form>

            <div class="login-footer">
              <a href="#" class="forgot-password">¿Olvidaste tu contraseña?</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  attachLoginEventHandlers();
}

function attachLoginEventHandlers() {
  const form = document.getElementById('loginForm');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const togglePasswordBtn = document.getElementById('togglePassword');
  const generalError = document.getElementById('generalError');

  // Demo users
  emailInput.value = 'admin@optix.co';
  passwordInput.value = 'Admin2026!';

  togglePasswordBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const type = passwordInput.type === 'password' ? 'text' : 'password';
    passwordInput.type = type;
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    generalError.textContent = '';

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
      generalError.textContent = 'Por favor completa todos los campos';
      return;
    }

    try {
      form.querySelector('button').disabled = true;

      const user = await authService.login(email, password);
      Toast.success(`¡Bienvenido, ${user.name}!`);

      // Redirigir al dashboard
      setTimeout(() => {
        router.navigate('/dashboard');
      }, 500);
    } catch (error) {
      console.error('Error de login:', error);
      generalError.textContent = error.error || 'Error al iniciar sesión';
    } finally {
      form.querySelector('button').disabled = false;
    }
  });
}

// CSS para la página de login
if (!document.querySelector('#login-styles')) {
  const style = document.createElement('style');
  style.id = 'login-styles';
  style.textContent = `
    .login-wrapper {
      display: grid;
      grid-template-columns: 1fr 1fr;
      min-height: 100vh;
      background: var(--color-bg);
    }

    .login-panel {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
    }

    .login-panel-dark {
      background: linear-gradient(135deg, var(--color-midnight) 0%, var(--color-navy) 100%);
    }

    .login-content {
      text-align: center;
      color: var(--color-accent);
    }

    .login-logo-img {
      width: 320px;
      max-width: 85%;
      margin-bottom: 1.5rem;
      border-radius: 14px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.45);
    }

    .login-title {
      font-size: 2.5rem;
      font-weight: 800;
      margin: 0;
      color: var(--color-accent);
      letter-spacing: 2px;
    }

    .login-tagline {
      font-size: var(--font-size-sm);
      margin: 0.5rem 0 0 0;
      opacity: 0.8;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .login-form-wrapper {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .login-form-container {
      width: 100%;
      max-width: 400px;
    }

    .login-form-container h2 {
      font-size: var(--font-size-2xl);
      margin-bottom: 0.5rem;
      color: var(--color-text);
    }

    .login-form-container > p {
      margin-bottom: 2rem;
    }

    .login-form {
      margin-bottom: 2rem;
    }

    .password-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }

    .password-wrapper input {
      padding-right: 3rem;
      width: 100%;
    }

    .password-toggle {
      position: absolute;
      right: 0.75rem;
      background: none;
      border: none;
      cursor: pointer;
      color: var(--color-text-muted);
      transition: color var(--transition-base);
      display: flex;
      align-items: center;
      padding: 0.5rem;
    }

    .password-toggle:hover {
      color: var(--color-text);
    }

    .login-footer {
      text-align: center;
    }

    .forgot-password {
      font-size: var(--font-size-sm);
      color: var(--color-accent);
    }

    .form-error.text-center {
      margin-top: 1rem;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .login-wrapper {
        grid-template-columns: 1fr;
      }

      .login-panel-dark {
        display: none;
      }

      .login-form-container {
        padding: 2rem;
      }
    }
  `;
  document.head.appendChild(style);
}

export default renderLoginPage;
