// frontend/src/pages/forbidden.page.js
export function render(container) {
  container.innerHTML = `
    <div class="error-page">
      <div class="error-content">
        <div class="error-code">403</div>
        <h1 class="error-title">Acceso denegado</h1>
        <p class="error-description">
          No tienes permisos para acceder a esta sección.
          Contacta al administrador si crees que es un error.
        </p>
        <a href="/dashboard" class="btn btn-primary" id="error-back">Volver al dashboard</a>
      </div>
    </div>
  `;
  document.getElementById('error-back')?.addEventListener('click', (e) => {
    e.preventDefault();
    import('../utils/router.js').then(({ default: router }) => router.navigate('/dashboard'));
  });
}
export default { render };
