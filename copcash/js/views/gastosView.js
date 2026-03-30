// Vista de Gastos - Diseño Profesional
import { storage } from '/copcash/js/models/storage.js';

export class GastosFijosView {
  render(gastos = storage.getGastosFijos()) {
    const total = gastos.reduce((sum, g) => sum + g.monto, 0);
    const activos = gastos.filter(g => g.activo).length;

    const html = `
      <div class="w-full">
        <!-- Header -->
        <div class="mb-8">
          <div class="flex items-center justify-between mb-2">
            <h1 class="text-3xl font-bold text-neutral-900 dark:text-white">
              🏠 Gastos Fijos
            </h1>
            <button id="btn-add-gastoFijo" class="btn-primary">
              + Nuevo
            </button>
          </div>
          <p class="text-neutral-600 dark:text-neutral-400">
            Gastos recurrentes mensuales
          </p>
        </div>

        <!-- KPI -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div class="kpi-card danger">
            <div class="kpi-label">🏷️ Total Mensual</div>
            <div class="kpi-value" style="color: #ef4444;">
              $${total.toLocaleString('es-ES', { maximumFractionDigits: 0 })}
            </div>
            <div class="kpi-change">${activos} gasto(s) activo(s)</div>
          </div>

          <div class="card">
            <div class="flex items-start justify-between">
              <div>
                <p class="text-sm font-semibold text-neutral-600 dark:text-neutral-400 mb-1">Gasto Promedio</p>
                <p class="text-2xl font-bold text-neutral-900 dark:text-white">
                  $${gastos.length > 0 ? Math.round(total / gastos.length) : 0}
                </p>
              </div>
              <span class="text-2xl">📊</span>
            </div>
          </div>
        </div>

        ${this.renderFormulario()}

        <!-- Tabla -->
        <div class="card overflow-hidden">
          <h2 class="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
            Listado de Gastos Fijos
          </h2>
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr>
                  <th class="px-4 py-3 text-left">Nombre</th>
                  <th class="px-4 py-3 text-right">Monto</th>
                  <th class="px-4 py-3 text-left">Categoría</th>
                  <th class="px-4 py-3 text-center">Vencimiento</th>
                  <th class="px-4 py-3 text-center">Estado</th>
                  <th class="px-4 py-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                ${gastos.length === 0 ? `
                  <tr>
                    <td colspan="6" class="px-4 py-6 text-center text-neutral-500 dark:text-neutral-400">
                      No hay gastos fijos registrados
                    </td>
                  </tr>
                ` : gastos.map(gasto => {
                  const categoria = storage.getCategoria(gasto.categoria);
                  return `
                    <tr class="border-t border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition">
                      <td class="px-4 py-3 font-semibold text-neutral-900 dark:text-white">${gasto.nombre}</td>
                      <td class="px-4 py-3 text-right font-bold text-neutral-900 dark:text-white">
                        $${gasto.monto.toLocaleString('es-ES', { maximumFractionDigits: 0 })}
                      </td>
                      <td class="px-4 py-3">
                        <span class="badge" style="background: ${categoria?.color}20; color: ${categoria?.color}; border-left: 3px solid ${categoria?.color}">
                          ${categoria?.icon} ${categoria?.nombre}
                        </span>
                      </td>
                      <td class="px-4 py-3 text-center text-sm text-neutral-600 dark:text-neutral-400">
                        Día ${gasto.diaVencimiento}
                      </td>
                      <td class="px-4 py-3 text-center">
                        <span class="badge ${gasto.activo ? 'badge-success' : 'badge-danger'}">
                          ${gasto.activo ? '✓ Activo' : '✗ Inactivo'}
                        </span>
                      </td>
                      <td class="px-4 py-3 text-center space-x-2">
                        <button class="btn-edit-gastoFijo text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-bold" data-id="${gasto.id}">
                          ✏️
                        </button>
                        <button class="btn-delete-gastoFijo text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-bold" data-id="${gasto.id}">
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
      </div>
    `;

    return html;
  }

  renderFormulario(gasto = null) {
    const categorias = storage.getCategorias();
    const isEdit = gasto !== null;

    return `
      <div id="form-gastoFijo-container" class="card bg-neutral-50 dark:bg-neutral-700/30 mb-8 ${!isEdit ? 'hidden' : ''} overflow-hidden">
        <h2 class="text-lg font-semibold text-neutral-900 dark:text-white mb-6">
          ${isEdit ? '✏️ Editar Gasto Fijo' : '➕ Nuevo Gasto Fijo'}
        </h2>
        <form id="form-gastoFijo" class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">Nombre</label>
              <input type="text" id="gastoFijo-nombre" class="w-full" 
                value="${gasto?.nombre || ''}" required>
            </div>
            <div>
              <label class="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">Monto</label>
              <input type="number" id="gastoFijo-monto" class="w-full" 
                value="${gasto?.monto || ''}" step="0.01" min="0" required>
            </div>
            <div>
              <label class="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">Día Vencimiento</label>
              <input type="number" id="gastoFijo-dia" class="w-full" 
                value="${gasto?.diaVencimiento || ''}" min="1" max="31" required>
            </div>
            <div>
              <label class="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">Categoría</label>
              <select id="gastoFijo-categoria" class="w-full" required>
                <option value="">Seleccionar categoría</option>
                ${categorias.map(cat => `
                  <option value="${cat.id}" ${gasto?.categoria === cat.id ? 'selected' : ''}>
                    ${cat.icon} ${cat.nombre}
                  </option>
                `).join('')}
              </select>
            </div>
            <div>
              <label class="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">Estado</label>
              <select id="gastoFijo-activo" class="w-full">
                <option value="true" ${gasto?.activo !== false ? 'selected' : ''}>Activo</option>
                <option value="false" ${gasto?.activo === false ? 'selected' : ''}>Inactivo</option>
              </select>
            </div>
          </div>
          <div class="flex gap-2 pt-4 border-t border-neutral-200 dark:border-neutral-600">
            <button type="submit" class="btn-primary">
              ${isEdit ? '✓ Actualizar' : '✓ Guardar'}
            </button>
            <button type="button" id="btn-cancel-gastoFijo" class="bg-neutral-300 hover:bg-neutral-400 dark:bg-neutral-600 dark:hover:bg-neutral-500 text-neutral-900 dark:text-white px-4 py-2 rounded-lg font-semibold transition">
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
    const total = totalPagados + totalPendientes;

    const html = `
      <div class="w-full">
        <!-- Header -->
        <div class="mb-8">
          <div class="flex items-center justify-between mb-2">
            <h1 class="text-3xl font-bold text-neutral-900 dark:text-white">
              🛒 Gastos Variables
            </h1>
            <button id="btn-add-gastoVariable" class="btn-primary">
              + Nuevo
            </button>
          </div>
          <p class="text-neutral-600 dark:text-neutral-400">
            Gastos ocasionales y no planificados
          </p>
        </div>

        <!-- KPIs -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div class="kpi-card green">
            <div class="kpi-label">✓ Pagados</div>
            <div class="kpi-value" style="color: #10b981;">
              $${totalPagados.toLocaleString('es-ES', { maximumFractionDigits: 0 })}
            </div>
          </div>
          <div class="kpi-card warning">
            <div class="kpi-label">⏳ Pendientes</div>
            <div class="kpi-value" style="color: #f59e0b;">
              $${totalPendientes.toLocaleString('es-ES', { maximumFractionDigits: 0 })}
            </div>
          </div>
          <div class="kpi-card blue">
            <div class="kpi-label">📊 Total</div>
            <div class="kpi-value" style="color: #2563eb;">
              $${total.toLocaleString('es-ES', { maximumFractionDigits: 0 })}
            </div>
          </div>
        </div>

        ${this.renderFormulario()}

        <!-- Tabla -->
        <div class="card overflow-hidden">
          <h2 class="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
            Listado de Gastos Variables
          </h2>
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr>
                  <th class="px-4 py-3 text-left">Nombre</th>
                  <th class="px-4 py-3 text-right">Monto</th>
                  <th class="px-4 py-3 text-left">Fecha</th>
                  <th class="px-4 py-3 text-left">Categoría</th>
                  <th class="px-4 py-3 text-center">Estado</th>
                  <th class="px-4 py-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                ${gastos.length === 0 ? `
                  <tr>
                    <td colspan="6" class="px-4 py-6 text-center text-neutral-500 dark:text-neutral-400">
                      No hay gastos variables registrados
                    </td>
                  </tr>
                ` : gastos.map(gasto => {
                  const categoria = storage.getCategoria(gasto.categoria);
                  return `
                    <tr class="border-t border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition">
                      <td class="px-4 py-3 font-semibold text-neutral-900 dark:text-white">${gasto.nombre}</td>
                      <td class="px-4 py-3 text-right font-bold text-neutral-900 dark:text-white">
                        $${gasto.monto.toLocaleString('es-ES', { maximumFractionDigits: 0 })}
                      </td>
                      <td class="px-4 py-3 text-sm text-neutral-600 dark:text-neutral-400">${gasto.fecha}</td>
                      <td class="px-4 py-3">
                        <span class="badge" style="background: ${categoria?.color}20; color: ${categoria?.color}; border-left: 3px solid ${categoria?.color}">
                          ${categoria?.icon} ${categoria?.nombre}
                        </span>
                      </td>
                      <td class="px-4 py-3 text-center">
                        <span class="badge ${gasto.pagado ? 'badge-success' : 'badge-warning'}">
                          ${gasto.pagado ? '✓ Pagado' : '⏳ Pendiente'}
                        </span>
                      </td>
                      <td class="px-4 py-3 text-center space-x-2">
                        <button class="btn-toggle-gastoVariable ${gasto.pagado ? 'text-gray-600 dark:text-gray-400' : 'text-green-600 dark:text-green-400'} hover:opacity-70 font-bold" data-id="${gasto.id}">
                          ${gasto.pagado ? '↩️' : '✓'}
                        </button>
                        <button class="btn-edit-gastoVariable text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-bold" data-id="${gasto.id}">
                          ✏️
                        </button>
                        <button class="btn-delete-gastoVariable text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-bold" data-id="${gasto.id}">
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
      </div>
    `;

    return html;
  }

  renderFormulario(gasto = null) {
    const categorias = storage.getCategorias();
    const isEdit = gasto !== null;

    return `
      <div id="form-gastoVariable-container" class="card bg-neutral-50 dark:bg-neutral-700/30 mb-8 ${!isEdit ? 'hidden' : ''} overflow-hidden">
        <h2 class="text-lg font-semibold text-neutral-900 dark:text-white mb-6">
          ${isEdit ? '✏️ Editar Gasto Variable' : '➕ Nuevo Gasto Variable'}
        </h2>
        <form id="form-gastoVariable" class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">Nombre</label>
              <input type="text" id="gastoVariable-nombre" class="w-full" 
                value="${gasto?.nombre || ''}" required>
            </div>
            <div>
              <label class="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">Monto</label>
              <input type="number" id="gastoVariable-monto" class="w-full" 
                value="${gasto?.monto || ''}" step="0.01" min="0" required>
            </div>
            <div>
              <label class="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">Fecha</label>
              <input type="date" id="gastoVariable-fecha" class="w-full" 
                value="${gasto?.fecha || ''}" required>
            </div>
            <div>
              <label class="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">Categoría</label>
              <select id="gastoVariable-categoria" class="w-full" required>
                <option value="">Seleccionar categoría</option>
                ${categorias.map(cat => `
                  <option value="${cat.id}" ${gasto?.categoria === cat.id ? 'selected' : ''}>
                    ${cat.icon} ${cat.nombre}
                  </option>
                `).join('')}
              </select>
            </div>
          </div>
          <div class="flex gap-2 pt-4 border-t border-neutral-200 dark:border-neutral-600">
            <button type="submit" class="btn-primary">
              ${isEdit ? '✓ Actualizar' : '✓ Guardar'}
            </button>
            <button type="button" id="btn-cancel-gastoVariable" class="bg-neutral-300 hover:bg-neutral-400 dark:bg-neutral-600 dark:hover:bg-neutral-500 text-neutral-900 dark:text-white px-4 py-2 rounded-lg font-semibold transition">
              Cancelar
            </button>
            ${isEdit ? `<input type="hidden" id="gastoVariable-id" value="${gasto.id}">` : ''}
          </div>
        </form>
      </div>
    `;
  }
}
