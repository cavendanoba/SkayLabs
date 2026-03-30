// Vista de Metas de Ahorro
import { storage } from '/copcash/js/models/storage.js';
import { MetasCalculos } from '/copcash/js/models/calculos.js';

export class MetasView {
  render(metas = storage.getMetas()) {
    const totalAhorrado = metas.reduce((sum, m) => sum + m.montoActual, 0);
    const totalObjetivo = metas.reduce((sum, m) => sum + m.montoObjetivo, 0);

    const html = `
      <div class="space-y-6">
        <div class="flex justify-between items-center">
          <h1 class="text-4xl font-bold text-gray-800 dark:text-white">Metas de Ahorro</h1>
          <button id="btn-add-meta" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold">
            + Nueva Meta
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="bg-blue-100 dark:bg-blue-900/30 p-6 rounded-lg">
            <p class="text-sm text-blue-800 dark:text-blue-300 font-semibold">Total Ahorrado</p>
            <p class="text-3xl font-bold text-blue-900 dark:text-blue-100">$${totalAhorrado.toFixed(2)}</p>
          </div>
          <div class="bg-purple-100 dark:bg-purple-900/30 p-6 rounded-lg">
            <p class="text-sm text-purple-800 dark:text-purple-300 font-semibold">Total Objetivo</p>
            <p class="text-3xl font-bold text-purple-900 dark:text-purple-100">$${totalObjetivo.toFixed(2)}</p>
          </div>
          <div class="bg-green-100 dark:bg-green-900/30 p-6 rounded-lg">
            <p class="text-sm text-green-800 dark:text-green-300 font-semibold">Progreso Total</p>
            <p class="text-3xl font-bold text-green-900 dark:text-green-100">
              ${totalObjetivo > 0 ? Math.round((totalAhorrado / totalObjetivo) * 100) : 0}%
            </p>
          </div>
        </div>

        ${this.renderFormulario()}

        <div class="space-y-4">
          ${metas.length === 0 ? `
            <div class="bg-white dark:bg-gray-800 p-8 rounded-lg shadow text-center">
              <p class="text-gray-600 dark:text-gray-400 text-lg">No hay metas registradas</p>
            </div>
          ` : metas.map(meta => this.renderMeta(meta)).join('')}
        </div>
      </div>
    `;

    return html;
  }

  renderMeta(meta) {
    const porcentaje = MetasCalculos.calcularPorcentajeAlcanzado(meta);
    const restante = MetasCalculos.calcularMontoRestante(meta);
    const ahorroRequerido = MetasCalculos.calcularAhorroMensualRequerido(meta);
    const diasRestantes = meta.fechaObjetivo 
      ? Math.ceil((new Date(meta.fechaObjetivo) - new Date()) / (1000 * 60 * 60 * 24))
      : null;

    return `
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border-l-4 border-blue-500">
        <div class="flex justify-between items-start mb-4">
          <div>
            <h3 class="text-2xl font-bold text-gray-800 dark:text-white">${meta.nombre}</h3>
            ${meta.fechaObjetivo ? `
              <p class="text-sm text-gray-600 dark:text-gray-400">
                Objetivo: ${meta.fechaObjetivo}
                ${diasRestantes !== null ? `(${diasRestantes} días)` : ''}
              </p>
            ` : ''}
          </div>
          <div class="space-x-2">
            <button class="btn-edit-meta text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-lg" data-id="${meta.id}">
              ✏️
            </button>
            <button class="btn-delete-meta text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-lg" data-id="${meta.id}">
              🗑️
            </button>
          </div>
        </div>

        <!-- Barra de progreso principal -->
        <div class="mb-4">
          <div class="flex justify-between mb-2">
            <span class="text-sm font-semibold text-gray-700 dark:text-gray-300">Progreso</span>
            <span class="text-sm font-bold text-gray-700 dark:text-gray-300">$${meta.montoActual.toFixed(2)} / $${meta.montoObjetivo.toFixed(2)}</span>
          </div>
          <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div class="bg-gradient-to-r from-green-500 to-emerald-600 h-3 rounded-full transition-all" style="width: ${Math.min(porcentaje, 100)}%"></div>
          </div>
          <p class="text-xs text-gray-600 dark:text-gray-400 mt-1">${porcentaje}% completado</p>
        </div>

        <!-- Resumen financiero -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div class="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-900/30 p-3 rounded">
            <p class="text-xs text-red-700 dark:text-red-300 font-semibold uppercase">Falta</p>
            <p class="text-lg font-bold text-red-900 dark:text-red-100">$${restante.toFixed(2)}</p>
          </div>
          ${meta.fechaObjetivo && ahorroRequerido > 0 ? `
            <div class="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-900/30 p-3 rounded">
              <p class="text-xs text-orange-700 dark:text-orange-300 font-semibold uppercase">Mes requerido</p>
              <p class="text-lg font-bold text-orange-900 dark:text-orange-100">$${ahorroRequerido.toFixed(2)}</p>
            </div>
          ` : ''}
          ${meta.aporteAutomatico ? `
            <div class="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-900/30 p-3 rounded">
              <p class="text-xs text-purple-700 dark:text-purple-300 font-semibold uppercase">Aporte Automático</p>
              <p class="text-lg font-bold text-purple-900 dark:text-purple-100">$${meta.aporteAutomaticoMonto.toFixed(2)}</p>
            </div>
          ` : ''}
        </div>

        <!-- Botones de acción -->
        <div class="flex gap-2">
          <button id="btn-aporte-${meta.id}" class="btn-aporte-meta flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded font-semibold text-sm" data-id="${meta.id}">
            + Agregar Aporte
          </button>
        </div>
      </div>
    `;
  }

  renderFormulario(meta = null) {
    const isEdit = meta !== null;

    return `
      <div id="form-meta-container" class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow ${!isEdit ? 'hidden' : ''}">
        <h2 class="text-2xl font-bold mb-4 text-gray-800 dark:text-white">
          ${isEdit ? 'Editar Meta de Ahorro' : 'Nueva Meta de Ahorro'}
        </h2>
        <form id="form-meta" class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Nombre</label>
              <input type="text" id="meta-nombre" class="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-3 py-2" 
                placeholder="Ej: Viaje a la playa" value="${meta?.nombre || ''}" required>
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Monto Objetivo</label>
              <input type="number" id="meta-objetivo" class="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-3 py-2" 
                value="${meta?.montoObjetivo || ''}" step="0.01" min="0" required>
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Monto Actual Ahorrado</label>
              <input type="number" id="meta-actual" class="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-3 py-2" 
                value="${meta?.montoActual || 0}" step="0.01" min="0" required>
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Fecha Objetivo (opcional)</label>
              <input type="date" id="meta-fecha" class="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-3 py-2" 
                value="${meta?.fechaObjetivo || ''}">
            </div>
          </div>

          <div class="border-t border-gray-300 dark:border-gray-600 pt-4">
            <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-3">Aporte Automático Mensual</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="flex items-center">
                <input type="checkbox" id="meta-aporteAuto" class="mr-2" ${meta?.aporteAutomatico ? 'checked' : ''}>
                <label for="meta-aporteAuto" class="text-gray-700 dark:text-gray-300">Habilitar aporte automático</label>
              </div>
              <div>
                <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Monto Mensual</label>
                <input type="number" id="meta-aporteAutomonto" class="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-3 py-2" 
                  value="${meta?.aporteAutomaticoMonto || 0}" step="0.01" min="0">
              </div>
            </div>
          </div>

          <div class="flex gap-2">
            <button type="submit" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold">
              ${isEdit ? 'Actualizar' : 'Guardar'}
            </button>
            <button type="button" id="btn-cancel-meta" class="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded-lg font-semibold">
              Cancelar
            </button>
            ${isEdit ? `<input type="hidden" id="meta-id" value="${meta.id}">` : ''}
          </div>
        </form>
      </div>
    `;
  }

  renderDialogoAporte(meta) {
    return `
      <div id="dialog-aporte-${meta.id}" class="hidden fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-sm w-full mx-4">
          <h3 class="text-2xl font-bold text-gray-800 dark:text-white mb-4">${meta.nombre}</h3>
          <p class="text-gray-600 dark:text-gray-400 mb-4">¿Cuánto quieres aportar?</p>
          <input type="number" id="aporte-monto-${meta.id}" class="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-3 py-2 mb-4" 
            placeholder="Monto" step="0.01" min="0">
          <div class="flex gap-2">
            <button id="btn-aporte-confirm-${meta.id}" class="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-semibold">
              Aportар
            </button>
            <button id="btn-aporte-cancel-${meta.id}" class="flex-1 bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded font-semibold">
              Cancelar
            </button>
          </div>
        </div>
      </div>
    `;
  }
}
