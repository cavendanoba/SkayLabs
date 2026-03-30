// Vista de Ingresos Extra
import { storage } from '../models/storage.js';

export class IngresosExtraView {
  render(ingresos = storage.getIngresosExtra()) {
    const totalIngresos = ingresos.reduce((sum, i) => sum + i.monto, 0);

    const html = `
      <div class="space-y-6">
        <div class="flex justify-between items-center">
          <h1 class="text-4xl font-bold text-gray-800 dark:text-white">Ingresos Extra</h1>
          <button id="btn-add-ingresoExtra" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold">
            + Nuevo Ingreso Extra
          </button>
        </div>

        <div class="bg-gradient-to-br from-green-500 to-emerald-600 text-white p-6 rounded-lg shadow-lg">
          <p class="text-sm opacity-90">Total Ingresos Extra</p>
          <p class="text-4xl font-bold">$${totalIngresos.toFixed(2)}</p>
        </div>

        ${this.renderFormulario()}

        <div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <table class="w-full">
            <thead class="bg-gray-100 dark:bg-gray-700">
              <tr>
                <th class="px-4 py-3 text-left text-gray-700 dark:text-gray-300">Nombre</th>
                <th class="px-4 py-3 text-left text-gray-700 dark:text-gray-300">Monto</th>
                <th class="px-4 py-3 text-left text-gray-700 dark:text-gray-300">Fecha Esperada</th>
                <th class="px-4 py-3 text-left text-gray-700 dark:text-gray-300">Categoría</th>
                <th class="px-4 py-3 text-left text-gray-700 dark:text-gray-300">Estado</th>
                <th class="px-4 py-3 text-center text-gray-700 dark:text-gray-300">Acciones</th>
              </tr>
            </thead>
            <tbody>
              ${ingresos.length === 0 ? `
                <tr>
                  <td colspan="6" class="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
                    No hay ingresos extra registrados
                  </td>
                </tr>
              ` : ingresos.map(ingreso => {
                const categoria = storage.getCategoria(ingreso.categoria);
                return `
                  <tr class="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td class="px-4 py-3 text-gray-800 dark:text-white font-semibold">${ingreso.nombre}</td>
                    <td class="px-4 py-3 text-green-700 dark:text-green-400 font-bold">+$${ingreso.monto.toFixed(2)}</td>
                    <td class="px-4 py-3 text-gray-600 dark:text-gray-400 text-sm">${ingreso.fecha}</td>
                    <td class="px-4 py-3">
                      <span class="inline-block bg-green-200 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-2 py-1 rounded text-sm">
                        ${categoria?.icon} ${categoria?.nombre}
                      </span>
                    </td>
                    <td class="px-4 py-3">
                      <span class="inline-block ${ingreso.completado ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'} px-2 py-1 rounded text-sm">
                        ${ingreso.completado ? '✓ Recibido' : '⏳ Pendiente'}
                      </span>
                    </td>
                    <td class="px-4 py-3 text-center space-x-2">
                      <button class="btn-toggle-ingresoExtra text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300" data-id="${ingreso.id}">
                        ${ingreso.completado ? '↩️' : '✓'}
                      </button>
                      <button class="btn-edit-ingresoExtra text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300" data-id="${ingreso.id}">
                        ✏️
                      </button>
                      <button class="btn-delete-ingresoExtra text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300" data-id="${ingreso.id}">
                        🗑️
                      </button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    return html;
  }

  renderFormulario(ingreso = null) {
    const categorias = storage.getCategorias();
    const isEdit = ingreso !== null;

    return `
      <div id="form-ingresoExtra-container" class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow ${!isEdit ? 'hidden' : ''}">
        <h2 class="text-2xl font-bold mb-4 text-gray-800 dark:text-white">
          ${isEdit ? 'Editar Ingreso Extra' : 'Nuevo Ingreso Extra'}
        </h2>
        <form id="form-ingresoExtra" class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Nombre</label>
              <input type="text" id="ingresoExtra-nombre" class="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-3 py-2" 
                value="${ingreso?.nombre || ''}" required>
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Monto</label>
              <input type="number" id="ingresoExtra-monto" class="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-3 py-2" 
                value="${ingreso?.monto || ''}" step="0.01" min="0" required>
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Fecha Esperada</label>
              <input type="date" id="ingresoExtra-fecha" class="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-3 py-2" 
                value="${ingreso?.fecha || ''}" required>
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Categoría</label>
              <select id="ingresoExtra-categoria" class="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-3 py-2" required>
                <option value="">Seleccionar categoría</option>
                ${categorias.map(cat => `
                  <option value="${cat.id}" ${ingreso?.categoria === cat.id ? 'selected' : ''}>
                    ${cat.icon} ${cat.nombre}
                  </option>
                `).join('')}
              </select>
            </div>
          </div>
          <div class="flex gap-2">
            <button type="submit" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold">
              ${isEdit ? 'Actualizar' : 'Guardar'}
            </button>
            <button type="button" id="btn-cancel-ingresoExtra" class="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded-lg font-semibold">
              Cancelar
            </button>
            ${isEdit ? `<input type="hidden" id="ingresoExtra-id" value="${ingreso.id}">` : ''}
          </div>
        </form>
      </div>
    `;
  }
}
