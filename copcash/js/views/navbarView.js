// Vista de Navegación y Configuración
import { storage } from '/copcash/js/models/storage.js';

export class NavbarView {
  render() {
    return `
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div class="flex justify-between items-center">
          <!-- Logo -->
          <div class="flex items-center gap-3 font-bold">
            <span class="text-2xl">💰</span>
            <span class="text-xl font-bold text-neutral-900 dark:text-white tracking-tight">CopCash</span>
            <span class="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full font-semibold">v1.0</span>
          </div>

          <!-- Navegación Desktop -->
          <div class="hidden lg:flex items-center gap-1">
            ${this.renderNavLinks()}
          </div>

          <!-- Controles Derecha -->
          <div class="flex items-center gap-3">
            <button id="btn-dark-mode" class="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition" title="Cambiar tema">
              🌙
            </button>
            <button id="btn-menu-mobile" class="lg:hidden p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition" title="Menú">
              ☰
            </button>
          </div>
        </div>

        <!-- Menú Móvil -->
        <div id="mobile-menu" class="lg:hidden hidden mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700 space-y-2">
          ${this.renderNavLinks('mobile')}
        </div>
      </div>
    `;
  }

  renderNavLinks(mode = 'desktop') {
    const links = [
      { view: 'dashboard', label: '📊 Dashboard' },
      { view: 'gastos', label: '💸 Gastos' },
      { view: 'ingresos', label: '💵 Ingresos' },
      { view: 'tarjetas', label: '💳 Tarjetas' },
      { view: 'metas', label: '🎯 Metas' },
      { view: 'flujo', label: '📈 Flujo' },
      { view: 'categorias', label: '🏷️ Categorías' },
      { view: 'config', label: '⚙️ Config' }
    ];

    if (mode === 'mobile') {
      return links.map(link => `
        <button class="nav-link-mobile block w-full text-left px-4 py-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-medium transition text-sm" data-view="${link.view}">
          ${link.label}
        </button>
      `).join('');
    }

    return links.map(link => `
      <button class="nav-link px-3 py-2 rounded-lg text-neutral-700 dark:text-neutral-300 font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800 transition text-sm" data-view="${link.view}">
        ${link.label}
      </button>
    `).join('');
  }
}

export class ConfiguracionView {
  render() {
    const salario = storage.getSalario();

    return `
      <div class="space-y-6">
        <h1 class="text-4xl font-bold text-gray-800 dark:text-white">Configuración</h1>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Configuración de Salario -->
          <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h2 class="text-2xl font-bold text-gray-800 dark:text-white mb-4">Salario Mensual</h2>
            <form id="form-salario" class="space-y-4">
              <div>
                <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Monto</label>
                <input type="number" id="salario-monto" class="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-3 py-2" 
                  value="${salario.monto}" step="0.01" min="0" required>
              </div>
              <div>
                <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Día de Cobro</label>
                <input type="number" id="salario-dia" class="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-3 py-2" 
                  value="${salario.diaCobro}" min="1" max="31" required>
              </div>
              <div>
                <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Descripción</label>
                <input type="text" id="salario-descripcion" class="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-3 py-2" 
                  value="${salario.descripcion || ''}" required>
              </div>
              <button type="submit" class="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold">
                Guardar Configuración de Salario
              </button>
            </form>
          </div>

          <!-- Datos y Backups -->
          <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h2 class="text-2xl font-bold text-gray-800 dark:text-white mb-4">Datos y Backups</h2>
            <div class="space-y-3">
              <button id="btn-exportar-json" class="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold flex items-center justify-center gap-2">
                📥 Exportar a JSON
              </button>
              <button id="btn-importar-json" class="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-semibold flex items-center justify-center gap-2">
                📤 Importar desde JSON
              </button>
              <input type="file" id="file-importar" class="hidden" accept=".json" />
              <button id="btn-reset-datos" class="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold">
                🔄 Restaurar Datos de Ejemplo
              </button>
            </div>
          </div>
        </div>

        <!-- Información de la Aplicación -->
        <div class="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-6 rounded">
          <h3 class="text-lg font-bold text-blue-900 dark:text-blue-100 mb-3">ℹ️ Acerca de CopCash</h3>
          <div class="text-blue-800 dark:text-blue-200 space-y-2 text-sm">
            <p><strong>Versión:</strong> 1.0.0</p>
            <p><strong>Tipo:</strong> Aplicación Web SPA (Single Page Application)</p>
            <p><strong>Almacenamiento:</strong> LocalStorage (navegador)</p>
            <p><strong>Tecnología:</strong> HTML5, CSS3 (Tailwind), JavaScript ES6+</p>
            <p>
              <strong>Todos los datos se guardan localmente en tu navegador</strong> y nunca se envían a servidores externos.
              Realiza backups regulares exportando tus datos.
            </p>
          </div>
        </div>
      </div>
    `;
  }
}
