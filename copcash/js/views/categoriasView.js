// Vista de Categorías y Presupuestos
import { storage } from '/copcash/js/models/storage.js';
import { IngresosGastosCalculos } from '/copcash/js/models/calculos.js';

export class CategoriasView {
  render(categorias = storage.getCategorias()) {
    const gastosPorCat = IngresosGastosCalculos.calcularGastosPorCategoria();

    const html = `
      <div class="w-full">
        <!-- Header -->
        <div class="mb-8">
          <div class="flex items-center justify-between mb-2">
            <h1 class="text-3xl font-bold text-neutral-900 dark:text-white">
              💼 Categorías y Presupuestos
            </h1>
            <button id="btn-add-categoria" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition">
              + Nueva
            </button>
          </div>
          <p class="text-neutral-600 dark:text-neutral-400">
            Administra tus categorías de gastos y presupuestos
          </p>
        </div>

        <!-- Resumen de Gastos por Categoría -->
        <div class="mb-8">
          <h2 class="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
            Resumen por Categoría
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            ${Object.entries(gastosPorCat).map(([catId, datos]) => {
              const porcentaje = datos.presupuesto > 0 ? Math.round((datos.total / datos.presupuesto) * 100) : 0;
              const excedido = datos.total > datos.presupuesto;

              return `
                <div class="card">
                  <div class="flex items-start justify-between mb-4">
                    <div>
                      <p class="text-sm font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                        ${datos.icon} ${datos.nombre}
                      </p>
                      <p class="text-lg font-bold text-neutral-900 dark:text-white">
                        $${datos.total.toLocaleString('es-ES', { maximumFractionDigits: 0 })}
                      </p>
                    </div>
                    <span class="badge ${excedido ? 'badge-danger' : 'badge-success'}">
                      ${porcentaje}%
                    </span>
                  </div>
                  <div class="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
                    <div class="progress-bar ${excedido ? '' : ''}" 
                      style="width: ${Math.min(porcentaje, 100)}%; background: ${excedido ? 'linear-gradient(90deg, #ef4444 0%, #f97316 100%)' : 'linear-gradient(90deg, #10b981 0%, #34d399 100%)'}"></div>
                  </div>
                  <div class="text-xs text-neutral-600 dark:text-neutral-400 mt-2 flex justify-between">
                    <span>Límite: $${datos.presupuesto.toLocaleString('es-ES', { maximumFractionDigits: 0 })}</span>
                    <span>${excedido ? `⚠️ Exceso: $${(datos.total - datos.presupuesto).toLocaleString('es-ES', { maximumFractionDigits: 0 })}` : 'En control'}</span>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        ${this.renderFormulario()}

        <!-- Tabla de Categorías -->
        <div class="card overflow-hidden">
          <h2 class="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
            Todas las Categorías
          </h2>
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr>
                  <th class="px-4 py-3 text-left">Ícono</th>
                  <th class="px-4 py-3 text-left">Nombre</th>
                  <th class="px-4 py-3 text-right">Presupuesto</th>
                  <th class="px-4 py-3 text-center">Color</th>
                  <th class="px-4 py-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                ${categorias.length === 0 ? `
                  <tr>
                    <td colspan="5" class="px-4 py-6 text-center text-neutral-500 dark:text-neutral-400">
                      No hay categorías registradas
                    </td>
                  </tr>
                ` : categorias.map(cat => `
                  <tr class="border-t border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition">
                    <td class="px-4 py-3 text-2xl">${cat.icon}</td>
                    <td class="px-4 py-3 font-semibold text-neutral-900 dark:text-white">${cat.nombre}</td>
                    <td class="px-4 py-3 text-right text-neutral-900 dark:text-white font-semibold">
                      $${cat.presupuesto.toLocaleString('es-ES', { maximumFractionDigits: 0 })}
                    </td>
                    <td class="px-4 py-3 text-center">
                      <div class="w-8 h-8 rounded mx-auto" style="background-color: ${cat.color}; border: 1px solid var(--neutral-300);"></div>
                    </td>
                    <td class="px-4 py-3 text-center space-x-2">
                      <button class="btn-edit-categoria text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-bold" data-id="${cat.id}">
                        ✏️
                      </button>
                      <button class="btn-delete-categoria text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-bold" data-id="${cat.id}">
                        🗑️
                      </button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    return html;
  }

  renderFormulario(categoria = null) {
    const isEdit = categoria !== null;
    const colores = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#F7B731', '#5F27CD', '#A4B0BD', '#FF8C42', '#95E1D3'];

    return `
      <div id="form-categoria-container" class="card ${!isEdit ? 'hidden' : ''} bg-neutral-50 dark:bg-neutral-700/30 mb-8">
        <h2 class="text-lg font-semibold text-neutral-900 dark:text-white mb-6">
          ${isEdit ? '✏️ Editar Categoría' : '➕ Nueva Categoría'}
        </h2>
        <form id="form-categoria" class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">Nombre</label>
              <input type="text" id="categoria-nombre" class="w-full" 
                value="${categoria?.nombre || ''}" required>
            </div>
            <div>
              <label class="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">Ícono (emoji)</label>
              <input type="text" id="categoria-icon" class="w-full" 
                value="${categoria?.icon || '📌'}" maxlength="2" required>
            </div>
            <div>
              <label class="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">Presupuesto Mensual</label>
              <input type="number" id="categoria-presupuesto" class="w-full" 
                value="${categoria?.presupuesto || ''}" step="0.01" min="0" required>
            </div>
            <div>
              <label class="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">Color</label>
              <div class="flex gap-2">
                ${colores.map(color => `
                  <button type="button" class="color-picker w-8 h-8 rounded border-2 transition-all ${categoria?.color === color ? 'border-black dark:border-white ring-2 ring-offset-2' : 'border-neutral-300 dark:border-neutral-600 hover:ring-1'}" 
                    style="background-color: ${color}" data-color="${color}" title="${color}"></button>
                `).join('')}
              </div>
              <input type="hidden" id="categoria-color" value="${categoria?.color || '#A4B0BD'}">
            </div>
          </div>
          <div class="flex gap-2 pt-4 border-t border-neutral-200 dark:border-neutral-600">
            <button type="submit" class="btn-primary">
              ${isEdit ? '✓ Actualizar' : '✓ Guardar'}
            </button>
            <button type="button" id="btn-cancel-categoria" class="bg-neutral-300 hover:bg-neutral-400 dark:bg-neutral-600 dark:hover:bg-neutral-500 text-neutral-900 dark:text-white px-4 py-2 rounded-lg font-semibold transition">
              Cancelar
            </button>
            ${isEdit ? `<input type="hidden" id="categoria-id" value="${categoria.id}">` : ''}
          </div>
        </form>
      </div>
    `;
  }
}
