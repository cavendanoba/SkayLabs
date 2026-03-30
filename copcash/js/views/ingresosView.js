// Vista de Ingresos Extra - Diseño Profesional
import { storage } from '/copcash/js/models/storage.js';

export class IngresosExtraView {
  render(ingresos = storage.getIngresosExtra()) {
    const totalIngresos = ingresos.reduce((sum, i) => sum + i.monto, 0);
    const completados = ingresos.filter(i => i.completado).length;

    const html = `
      <div class="w-full">
        <!-- Header -->
        <div class="mb-8">
          <div class="flex items-center justify-between mb-2">
            <h1 class="text-3xl font-bold text-neutral-900 dark:text-white">
              💎 Ingresos Extras
            </h1>
            <button id="btn-add-ingresoExtra" class="btn-primary">
              + Nuevo
            </button>
          </div>
          <p class="text-neutral-600 dark:text-neutral-400">
            Ingresos adicionales y fuentes alternativas
          </p>
        </div>

        <!-- KPI -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div class="kpi-card green">
            <div class="kpi-label">💰 Total Ingresos Extras</div>
            <div class="kpi-value" style="color: #10b981;">
              $${totalIngresos.toLocaleString('es-ES', { maximumFractionDigits: 0 })}
            </div>
            <div class="kpi-change">${completados} de ${ingresos.length} recibidos</div>
          </div>

          <div class="card">
            <div class="flex items-start justify-between">
              <div>
                <p class="text-sm font-semibold text-neutral-600 dark:text-neutral-400 mb-1">Ingreso Promedio</p>
                <p class="text-2xl font-bold text-neutral-900 dark:text-white">
                  $${ingresos.length > 0 ? Math.round(totalIngresos / ingresos.length) : 0}
                </p>
              </div>
              <span class="text-2xl">📈</span>
            </div>
          </div>
        </div>

        ${this.renderFormulario()}

        <!-- Tabla -->
        <div class="card overflow-hidden">
          <h2 class="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
            Listado de Ingresos
          </h2>
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr>
                  <th class="px-4 py-3 text-left">Nombre</th>
                  <th class="px-4 py-3 text-right">Monto</th>
                  <th class="px-4 py-3 text-left">Fecha Esperada</th>
                  <th class="px-4 py-3 text-center">Estado</th>
                  <th class="px-4 py-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                ${ingresos.length === 0 ? `
                  <tr>
                    <td colspan="5" class="px-4 py-6 text-center text-neutral-500 dark:text-neutral-400">
                      No hay ingresos extras registrados
                    </td>
                  </tr>
                ` : ingresos.map(ingreso => `
                  <tr class="border-t border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition">
                    <td class="px-4 py-3 font-semibold text-neutral-900 dark:text-white">${ingreso.nombre}</td>
                    <td class="px-4 py-3 text-right font-bold text-green-600 dark:text-green-400">
                      +$${ingreso.monto.toLocaleString('es-ES', { maximumFractionDigits: 0 })}
                    </td>
                    <td class="px-4 py-3 text-sm text-neutral-600 dark:text-neutral-400">${ingreso.fecha}</td>
                    <td class="px-4 py-3 text-center">
                      <span class="badge ${ingreso.completado ? 'badge-success' : 'badge-warning'}">
                        ${ingreso.completado ? '✓ Recibido' : '⏳ Pendiente'}
                      </span>
                    </td>
                    <td class="px-4 py-3 text-center space-x-2">
                      <button class="btn-toggle-ingresoExtra ${ingreso.completado ? 'text-gray-600 dark:text-gray-400' : 'text-green-600 dark:text-green-400'} hover:opacity-70 font-bold" data-id="${ingreso.id}">
                        ${ingreso.completado ? '↩️' : '✓'}
                      </button>
                      <button class="btn-edit-ingresoExtra text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-bold" data-id="${ingreso.id}">
                        ✏️
                      </button>
                      <button class="btn-delete-ingresoExtra text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-bold" data-id="${ingreso.id}">
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

  renderFormulario(ingreso = null) {
    const isEdit = ingreso !== null;

    return `
      <div id="form-ingresoExtra-container" class="card bg-neutral-50 dark:bg-neutral-700/30 mb-8 ${!isEdit ? 'hidden' : ''} overflow-hidden">
        <h2 class="text-lg font-semibold text-neutral-900 dark:text-white mb-6">
          ${isEdit ? '✏️ Editar Ingreso Extra' : '➕ Nuevo Ingreso Extra'}
        </h2>
        <form id="form-ingresoExtra" class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">Nombre</label>
              <input type="text" id="ingresoExtra-nombre" class="w-full"
                value="${ingreso?.nombre || ''}" required>
            </div>
            <div>
              <label class="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">Monto</label>
              <input type="number" id="ingresoExtra-monto" class="w-full"
                value="${ingreso?.monto || ''}" step="0.01" min="0" required>
            </div>
            <div>
              <label class="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">Fecha Esperada</label>
              <input type="date" id="ingresoExtra-fecha" class="w-full"
                value="${ingreso?.fecha || ''}" required>
            </div>
          </div>
          <div class="flex gap-2 pt-4 border-t border-neutral-200 dark:border-neutral-600">
            <button type="submit" class="btn-primary">
              ${isEdit ? '✓ Actualizar' : '✓ Guardar'}
            </button>
            <button type="button" id="btn-cancel-ingresoExtra" class="bg-neutral-300 hover:bg-neutral-400 dark:bg-neutral-600 dark:hover:bg-neutral-500 text-neutral-900 dark:text-white px-4 py-2 rounded-lg font-semibold transition">
              Cancelar
            </button>
            ${isEdit ? `<input type="hidden" id="ingresoExtra-id" value="${ingreso.id}">` : ''}
          </div>
        </form>
      </div>
    `;
  }
}
