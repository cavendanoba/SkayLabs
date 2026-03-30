// Vista de Categorías y Presupuestos
import { storage } from '../models/storage.js';
import { IngresosGastosCalculos } from '../models/calculos.js';

export class CategoriasView {
  render(categorias = storage.getCategorias()) {
    const gastosPorCat = IngresosGastosCalculos.calcularGastosPorCategoria();

    const html = `
      <div class="space-y-6">
        <div class="flex justify-between items-center">
          <h1 class="text-4xl font-bold text-gray-800 dark:text-white">Categorías y Presupuestos</h1>
          <button id="btn-add-categoria" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold">
            + Nueva Categoría
          </button>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 class="text-2xl font-bold text-gray-800 dark:text-white mb-4">Resumen de Gastos por Categoría</h2>
          <div class="space-y-3">
            ${Object.entries(gastosPorCat).map(([catId, datos]) => {
              const porcentaje = datos.presupuesto > 0 ? Math.round((datos.total / datos.presupuesto) * 100) : 0;
              const excedido = datos.total > datos.presupuesto;

              return `
                <div class="border border-gray-300 dark:border-gray-600 rounded p-4">
                  <div class="flex justify-between items-start mb-2">
                    <span class="text-lg font-semibold text-gray-800 dark:text-white">
                      ${datos.icon} ${datos.nombre}
                    </span>
                    <span class="text-sm font-semibold ${excedido ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}">
                      $${datos.total.toFixed(2)} / $${datos.presupuesto.toFixed(2)}
                    </span>
                  </div>
                  <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
                    <div class="bg-gradient-to-r ${excedido ? 'from-red-500 to-orange-500' : 'from-blue-500 to-purple-600'} h-2 rounded-full transition-all" 
                      style="width: ${Math.min(porcentaje, 100)}%"></div>
                  </div>
                  <div class="text-xs text-gray-600 dark:text-gray-400 flex justify-between">
                    <span>${porcentaje > 100 ? `⚠️ ${porcentaje}% - Exceso: $${(datos.total - datos.presupuesto).toFixed(2)}` : `${porcentaje}% utilizado`}</span>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        ${this.renderFormulario()}

        <div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <table class="w-full">
            <thead class="bg-gray-100 dark:bg-gray-700">
              <tr>
                <th class="px-4 py-3 text-left text-gray-700 dark:text-gray-300">Ícono</th>
                <th class="px-4 py-3 text-left text-gray-700 dark:text-gray-300">Nombre</th>
                <th class="px-4 py-3 text-left text-gray-700 dark:text-gray-300">Presupuesto</th>
                <th class="px-4 py-3 text-left text-gray-700 dark:text-gray-300">Color</th>
                <th class="px-4 py-3 text-center text-gray-700 dark:text-gray-300">Acciones</th>
              </tr>
            </thead>
            <tbody>
              ${categorias.length === 0 ? `
                <tr>
                  <td colspan="5" class="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
                    No hay categorías registradas
                  </td>
                </tr>
              ` : categorias.map(cat => `
                <tr class="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td class="px-4 py-3 text-2xl">${cat.icon}</td>
                  <td class="px-4 py-3 text-gray-800 dark:text-white font-semibold">${cat.nombre}</td>
                  <td class="px-4 py-3 text-gray-800 dark:text-white">$${cat.presupuesto.toFixed(2)}</td>
                  <td class="px-4 py-3">
                    <div class="flex items-center gap-2">
                      <div class="w-8 h-8 rounded" style="background-color: ${cat.color}"></div>
                      <span class="text-gray-600 dark:text-gray-400 text-sm">${cat.color}</span>
                    </div>
                  </td>
                  <td class="px-4 py-3 text-center space-x-2">
                    <button class="btn-edit-categoria text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300" data-id="${cat.id}">
                      ✏️
                    </button>
                    <button class="btn-delete-categoria text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300" data-id="${cat.id}">
                      🗑️
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    return html;
  }

  renderFormulario(categoria = null) {
    const isEdit = categoria !== null;
    const colores = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#F7B731', '#5F27CD', '#A4B0BD', '#FF8C42', '#95E1D3'];

    return `
      <div id="form-categoria-container" class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow ${!isEdit ? 'hidden' : ''}">
        <h2 class="text-2xl font-bold mb-4 text-gray-800 dark:text-white">
          ${isEdit ? 'Editar Categoría' : 'Nueva Categoría'}
        </h2>
        <form id="form-categoria" class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Nombre</label>
              <input type="text" id="categoria-nombre" class="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-3 py-2" 
                value="${categoria?.nombre || ''}" required>
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Ícono (emoji)</label>
              <input type="text" id="categoria-icon" class="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-3 py-2" 
                value="${categoria?.icon || '📌'}" maxlength="2" required>
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Presupuesto Mensual</label>
              <input type="number" id="categoria-presupuesto" class="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-3 py-2" 
                value="${categoria?.presupuesto || ''}" step="0.01" min="0" required>
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Color</label>
              <div class="flex gap-2 mb-2">
                ${colores.map(color => `
                  <button type="button" class="color-picker w-8 h-8 rounded border-2 ${categoria?.color === color ? 'border-black dark:border-white' : 'border-gray-300 dark:border-gray-600'}" 
                    style="background-color: ${color}" data-color="${color}" title="${color}"></button>
                `).join('')}
              </div>
              <input type="hidden" id="categoria-color" value="${categoria?.color || '#A4B0BD'}">
              <input type="text" id="categoria-color-input" class="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-3 py-2" 
                value="${categoria?.color || '#A4B0BD'}" placeholder="#000000">
            </div>
          </div>
          <div class="flex gap-2">
            <button type="submit" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold">
              ${isEdit ? 'Actualizar' : 'Guardar'}
            </button>
            <button type="button" id="btn-cancel-categoria" class="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded-lg font-semibold">
              Cancelar
            </button>
            ${isEdit ? `<input type="hidden" id="categoria-id" value="${categoria.id}">` : ''}
          </div>
        </form>
      </div>
    `;
  }
}
