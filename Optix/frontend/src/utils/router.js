// frontend/src/utils/router.js

export class Router {
  constructor() {
    this.routes = new Map();
    this.currentRoute = null;
    this.beforeEachGuards = [];
  }

  register(path, handler, meta = {}) {
    this.routes.set(path, { handler, meta });
  }

  beforeEach(guard) {
    this.beforeEachGuards.push(guard);
  }

  // Busca la ruta exacta o un patrón con parámetros (ej: /hx-records/:id)
  match(path) {
    if (this.routes.has(path)) return { route: this.routes.get(path), params: {} };

    const segments = path.split('/');
    for (const [pattern, route] of this.routes) {
      if (!pattern.includes(':')) continue;
      const parts = pattern.split('/');
      if (parts.length !== segments.length) continue;

      const params = {};
      const matches = parts.every((part, i) => {
        if (part.startsWith(':')) {
          params[part.slice(1)] = decodeURIComponent(segments[i]);
          return segments[i] !== '';
        }
        return part === segments[i];
      });
      if (matches) return { route, params };
    }
    return null;
  }

  async navigate(fullPath) {
    const [path, queryString = ''] = fullPath.split('?');

    // Ejecutar guards
    for (const guard of this.beforeEachGuards) {
      const result = await guard(path);
      if (result === false) {
        return;
      }
    }

    const matched = this.match(path);
    if (!matched) {
      return this.navigate('/404');
    }
    const { route, params } = matched;

    this.currentRoute = { path, params, ...route };

    // Limpiar
    const app = document.getElementById('app');
    app.innerHTML = '';

    // Renderizar
    try {
      await route.handler(app, params, new URLSearchParams(queryString));
    } catch (error) {
      console.error('Error al renderizar ruta:', error);
      app.innerHTML = '<div class="alert alert-danger">Error al cargar la página</div>';
    }

    // Actualizar URL
    window.history.pushState({ path: fullPath }, '', fullPath);
  }

  get(path) {
    return this.routes.get(path);
  }

  getCurrentRoute() {
    return this.currentRoute;
  }
}

export const router = new Router();

// Manejar navegación del historial
window.addEventListener('popstate', (e) => {
  if (e.state?.path) {
    router.navigate(e.state.path);
  }
});

export default router;
