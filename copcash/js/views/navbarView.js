// Vista de Navegación y Configuración
import { storage } from '/copcash/js/models/storage.js';

export class NavbarView {
  render() {
    return `
      <nav class="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-900 dark:to-blue-800 text-white shadow-lg">
        <div class="max-w-7xl mx-auto px-4">
          <div class="flex justify-between items-center h-16">
            <div class="flex items-center gap-2">
              <span class="text-2xl">💰</span>
              <span class="font-bold text-xl">CopCash</span>
            </div>
            
            <div class="hidden md:flex items-center gap-6">
              <button class="nav-link hover:bg-blue-500 dark:hover:bg-blue-700 px-3 py-2 rounded transition" data-view="dashboard">
                📊 Dashboard
              </button>
              <button class="nav-link hover:bg-blue-500 dark:hover:bg-blue-700 px-3 py-2 rounded transition" data-view="gastos">
                💸 Gastos
              </button>
              <button class="nav-link hover:bg-blue-500 dark:hover:bg-blue-700 px-3 py-2 rounded transition" data-view="ingresos">
                💵 Ingresos
              </button>
              <button class="nav-link hover:bg-blue-500 dark:hover:bg-blue-700 px-3 py-2 rounded transition" data-view="tarjetas">
                💳 Tarjetas
              </button>
              <button class="nav-link hover:bg-blue-500 dark:hover:bg-blue-700 px-3 py-2 rounded transition" data-view="metas">
                🎯 Metas
              </button>
              <button class="nav-link hover:bg-blue-500 dark:hover:bg-blue-700 px-3 py-2 rounded transition" data-view="flujo">
                📈 Flujo
              </button>
              <button class="nav-link hover:bg-blue-500 dark:hover:bg-blue-700 px-3 py-2 rounded transition" data-view="categorias">
                🏷️ Categorías
              </button>
              <button class="nav-link hover:bg-blue-500 dark:hover:bg-blue-700 px-3 py-2 rounded transition" data-view="config">
                ⚙️ Config
              </button>
            </div>

            <div class="flex items-center gap-2">
              <button id="btn-dark-mode" class="p-2 hover:bg-blue-500 dark:hover:bg-blue-700 rounded transition">
                🌙
              </button>
              <button id="btn-menu-mobile" class="md:hidden p-2 hover:bg-blue-500 dark:hover:bg-blue-700 rounded transition">
                ☰
              </button>
            </div>
          </div>

          <!-- Menú móvil -->
          <div id="mobile-menu" class="md:hidden hidden pb-4 space-y-2">
            <button class="nav-link-mobile block w-full text-left hover:bg-blue-500 dark:hover:bg-blue-700 px-3 py-2 rounded transition" data-view="dashboard">
              📊 Dashboard
            </button>
            <button class="nav-link-mobile block w-full text-left hover:bg-blue-500 dark:hover:bg-blue-700 px-3 py-2 rounded transition" data-view="gastos">
              💸 Gastos
            </button>
            <button class="nav-link-mobile block w-full text-left hover:bg-blue-500 dark:hover:bg-blue-700 px-3 py-2 rounded transition" data-view="ingresos">
              💵 Ingresos
            </button>
            <button class="nav-link-mobile block w-full text-left hover:bg-blue-500 dark:hover:bg-blue-700 px-3 py-2 rounded transition" data-view="tarjetas">
              💳 Tarjetas
            </button>
            <button class="nav-link-mobile block w-full text-left hover:bg-blue-500 dark:hover:bg-blue-700 px-3 py-2 rounded transition" data-view="metas">
              🎯 Metas
            </button>
            <button class="nav-link-mobile block w-full text-left hover:bg-blue-500 dark:hover:bg-blue-700 px-3 py-2 rounded transition" data-view="flujo">
              📈 Flujo
            </button>
            <button class="nav-link-mobile block w-full text-left hover:bg-blue-500 dark:hover:bg-blue-700 px-3 py-2 rounded transition" data-view="categorias">
              🏷️ Categorías
            </button>
            <button class="nav-link-mobile block w-full text-left hover:bg-blue-500 dark:hover:bg-blue-700 px-3 py-2 rounded transition" data-view="config">
              ⚙️ Config
            </button>
          </div>
        </div>
      </nav>
    `;
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
