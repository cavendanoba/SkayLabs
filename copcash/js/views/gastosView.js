// Vista de Gastos Fijos
import { storage } from '/copcash/js/models/storage.js';

export class GastosFijosView {
  render(gastos = storage.getGastosFijos()) {
    const total = gastos.reduce((sum, g) => sum + g.monto, 0);

    const html = `
      <div class="space-y-6">
        <div class="flex justify-between items-center">
          <h1 class="text-4xl font-bold text-gray-800 dark:text-white">Gastos Fijos</h1>
          <button id="btn-add-gastoFijo" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold">
            + Nuevo Gasto Fijo
          </button>
        </div>

        <div class="bg-gradient-to-br from-red-500 to-red-600 text-white p-6 rounded-lg shadow-lg">
          <p class="text-sm opacity-90">Total Gastos Fijos</p>
          <p class="text-4xl font-bold">$${total.toFixed(2)}</p>
        </div>

        ${this.renderFormulario()}

        <div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <table class="w-full">
            <thead class="bg-gray-100 dark:bg-gray-700">
              <tr>
                <th class="px-4 py-3 text-left text-gray-700 dark:text-gray-300">Nombre</th>
                <th class="px-4 py-3 text-left text-gray-700 dark:text-gray-300">Monto</th>
                <th class="px-4 py-3 text-left text-gray-700 dark:text-gray-300">Categoría</th>
                <th class="px-4 py-3 text-left text-gray-700 dark:text-gray-300">Día de Vencimiento</th>
                <th class="px-4 py-3 text-left text-gray-700 dark:text-gray-300">Estado</th>
                <th class="px-4 py-3 text-center text-gray-700 dark:text-gray-300">Acciones</th>
              </tr>
            </thead>
            <tbody>
              ${gastos.length === 0 ? `
                <tr>
                  <td colspan="6" class="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
                    No hay gastos fijos registrados
                  </td>
                </tr>
              ` : gastos.map(gasto => {
                const categoria = storage.getCategoria(gasto.categoria);
                return `
                  <tr class="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td class="px-4 py-3 text-gray-800 dark:text-white font-semibold">${gasto.nombre}</td>
                    <td class="px-4 py-3 text-gray-800 dark:text-white">$${gasto.monto.toFixed(2)}</td>
                    <td class="px-4 py-3">
                      <span class="inline-block bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white px-2 py-1 rounded text-sm">
                        ${categoria?.icon} ${categoria?.nombre}
                      </span>
                    </td>
                    <td class="px-4 py-3 text-gray-800 dark:text-white">Día ${gasto.diaVencimiento}</td>
                    <td class="px-4 py-3">
                      <span class="inline-block ${gasto.activo ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' : 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300'} px-2 py-1 rounded text-sm">
                        ${gasto.activo ? '✓ Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td class="px-4 py-3 text-center space-x-2">
                      <button class="btn-edit-gastoFijo text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300" data-id="${gasto.id}">
                        ✏️
                      </button>
                      <button class="btn-delete-gastoFijo text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300" data-id="${gasto.id}">
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

  renderFormulario(gasto = null) {
    const categorias = storage.getCategorias();
    const isEdit = gasto !== null;

    return `
      <div id="form-gastoFijo-container" class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow ${!isEdit ? 'hidden' : ''}">
        <h2 class="text-2xl font-bold mb-4 text-gray-800 dark:text-white">
          ${isEdit ? 'Editar Gasto Fijo' : 'Nuevo Gasto Fijo'}
        </h2>
        <form id="form-gastoFijo" class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Nombre</label>
              <input type="text" id="gastoFijo-nombre" class="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-3 py-2" 
                value="${gasto?.nombre || ''}" required>
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Monto</label>
              <input type="number" id="gastoFijo-monto" class="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-3 py-2" 
                value="${gasto?.monto || ''}" step="0.01" min="0" required>
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Categoría</label>
              <select id="gastoFijo-categoria" class="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-3 py-2" required>
                <option value="">Seleccionar categoría</option>
                ${categorias.map(cat => `
                  <option value="${cat.id}" ${gasto?.categoria === cat.id ? 'selected' : ''}>
                    ${cat.icon} ${cat.nombre}
                  </option>
                `).join('')}
              </select>
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Día de Vencimiento</label>
              <input type="number" id="gastoFijo-dia" class="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-3 py-2" 
                value="${gasto?.diaVencimiento || ''}" min="1" max="31" required>
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Estado</label>
              <select id="gastoFijo-activo" class="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-3 py-2">
                <option value="true" ${gasto?.activo !== false ? 'selected' : ''}>Activo</option>
                <option value="false" ${gasto?.activo === false ? 'selected' : ''}>Inactivo</option>
              </select>
            </div>
          </div>
          <div class="flex gap-2">
            <button type="submit" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold">
              ${isEdit ? 'Actualizar' : 'Guardar'}
            </button>
            <button type="button" id="btn-cancel-gastoFijo" class="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded-lg font-semibold">
              Cancelar
            </button>
            ${isEdit ? `<input type="hidden" id="gastoFijo-id" value="${gasto.id}">` : ''}
          </div>
        </form>
      </div>
    `;
  }
}

// Vista de Gastos Variables
export class GastosVariablesView {
  render(gastos = storage.getGastosVariables()) {
    const totalPagados = gastos.filter(g => g.pagado).reduce((sum, g) => sum + g.monto, 0);
    const totalPendientes = gastos.filter(g => !g.pagado).reduce((sum, g) => sum + g.monto, 0);

    const html = `
      <div class="space-y-6">
        <div class="flex justify-between items-center">
          <h1 class="text-4xl font-bold text-gray-800 dark:text-white">Gastos Variables</h1>
          <button id="btn-add-gastoVariable" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold">
            + Nuevo Gasto Variable
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="bg-green-100 dark:bg-green-900/30 p-4 rounded-lg">
            <p class="text-sm text-green-800 dark:text-green-300">Pagados</p>
            <p class="text-3xl font-bold text-green-700 dark:text-green-400">$${totalPagados.toFixed(2)}</p>
          </div>
          <div class="bg-yellow-100 dark:bg-yellow-900/30 p-4 rounded-lg">
            <p class="text-sm text-yellow-800 dark:text-yellow-300">Pendientes</p>
            <p class="text-3xl font-bold text-yellow-700 dark:text-yellow-400">$${totalPendientes.toFixed(2)}</p>
          </div>
          <div class="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-lg">
            <p class="text-sm text-blue-800 dark:text-blue-300">Total</p>
            <p class="text-3xl font-bold text-blue-700 dark:text-blue-400">$${(totalPagados + totalPendientes).toFixed(2)}</p>
          </div>
        </div>

        ${this.renderFormulario()}

        <div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <table class="w-full">
            <thead class="bg-gray-100 dark:bg-gray-700">
              <tr>
                <th class="px-4 py-3 text-left text-gray-700 dark:text-gray-300">Nombre</th>
                <th class="px-4 py-3 text-left text-gray-700 dark:text-gray-300">Monto</th>
                <th class="px-4 py-3 text-left text-gray-700 dark:text-gray-300">Fecha</th>
                <th class="px-4 py-3 text-left text-gray-700 dark:text-gray-300">Categoría</th>
                <th class="px-4 py-3 text-left text-gray-700 dark:text-gray-300">Estado</th>
                <th class="px-4 py-3 text-center text-gray-700 dark:text-gray-300">Acciones</th>
              </tr>
            </thead>
            <tbody>
              ${gastos.length === 0 ? `
                <tr>
                  <td colspan="6" class="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
                    No hay gastos variables registrados
                  </td>
                </tr>
              ` : gastos.map(gasto => {
                const categoria = storage.getCategoria(gasto.categoria);
                return `
                  <tr class="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td class="px-4 py-3 text-gray-800 dark:text-white font-semibold">${gasto.nombre}</td>
                    <td class="px-4 py-3 text-gray-800 dark:text-white">$${gasto.monto.toFixed(2)}</td>
                    <td class="px-4 py-3 text-gray-600 dark:text-gray-400 text-sm">${gasto.fecha}</td>
                    <td class="px-4 py-3">
                      <span class="inline-block bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white px-2 py-1 rounded text-sm">
                        ${categoria?.icon} ${categoria?.nombre}
                      </span>
                    </td>
                    <td class="px-4 py-3">
                      <span class="inline-block ${gasto.pagado ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'} px-2 py-1 rounded text-sm">
                        ${gasto.pagado ? '✓ Pagado' : '✗ Pendiente'}
                      </span>
                    </td>
                    <td class="px-4 py-3 text-center space-x-2">
                      <button class="btn-toggle-gastoVariable text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300" data-id="${gasto.id}">
                        ${gasto.pagado ? '↩️' : '✓'}
                      </button>
                      <button class="btn-edit-gastoVariable text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300" data-id="${gasto.id}">
                        ✏️
                      </button>
                      <button class="btn-delete-gastoVariable text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300" data-id="${gasto.id}">
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

  renderFormulario(gasto = null) {
    const categorias = storage.getCategorias();
    const isEdit = gasto !== null;

    return `
      <div id="form-gastoVariable-container" class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow ${!isEdit ? 'hidden' : ''}">
        <h2 class="text-2xl font-bold mb-4 text-gray-800 dark:text-white">
          ${isEdit ? 'Editar Gasto Variable' : 'Nuevo Gasto Variable'}
        </h2>
        <form id="form-gastoVariable" class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Nombre</label>
              <input type="text" id="gastoVariable-nombre" class="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-3 py-2" 
                value="${gasto?.nombre || ''}" required>
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Monto</label>
              <input type="number" id="gastoVariable-monto" class="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-3 py-2" 
                value="${gasto?.monto || ''}" step="0.01" min="0" required>
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Fecha</label>
              <input type="date" id="gastoVariable-fecha" class="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-3 py-2" 
                value="${gasto?.fecha || ''}" required>
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Categoría</label>
              <select id="gastoVariable-categoria" class="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-3 py-2" required>
                <option value="">Seleccionar categoría</option>
                ${categorias.map(cat => `
                  <option value="${cat.id}" ${gasto?.categoria === cat.id ? 'selected' : ''}>
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
            <button type="button" id="btn-cancel-gastoVariable" class="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded-lg font-semibold">
              Cancelar
            </button>
            ${isEdit ? `<input type="hidden" id="gastoVariable-id" value="${gasto.id}">` : ''}
          </div>
        </form>
      </div>
    `;
  }
}
