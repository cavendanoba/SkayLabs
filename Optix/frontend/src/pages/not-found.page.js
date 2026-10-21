// frontend/src/pages/not-found.page.js
export function render(container) {
  container.innerHTML = `
    <div class="error-page">
      <div class="error-content">
        <div class="error-code">404</div>
        <h1 class="error-title">Página no encontrada</h1>
        <p class="error-description">
          La página que buscas no existe o fue movida a otra dirección.
        </p>
        <a href="/dashboard" class="btn btn-primary" id="error-back">Ir al dashboard</a>
      </div>
    </div>
  `;
  document.getElementById('error-back')?.addEventListener('click', (e) => {
    e.preventDefault();
    import('../utils/router.js').then(({ default: router }) => router.navigate('/dashboard'));
  });
}
export default { render };
