// frontend/src/layouts/authenticated.layout.js
import { renderNavbar, initNavbarEvents } from '../components/navbar.component.js';

export function renderAuthenticatedLayout(container, contentHTML) {
  container.innerHTML = `
    ${renderNavbar()}
    <main class="app-main" id="app-main">
      <div class="app-content" id="app-content">
        ${contentHTML}
      </div>
      <footer class="app-footer">
        <img src="/brand/svg/optix-logo-horizontal.svg" class="footer-logo" alt="Optix by SkayLabs" />
        <span class="footer-copy">© ${new Date().getFullYear()} SkayLabs · Todos los derechos reservados</span>
      </footer>
    </main>
  `;
  initNavbarEvents();
}

export function getContentContainer() {
  return document.getElementById('app-content');
}

export function setPageTitle(title) {
  document.title = `${title} | Optix`;
}

export default renderAuthenticatedLayout;
