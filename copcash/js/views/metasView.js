// Vista de Metas de Ahorro
import { storage } from '/copcash/js/models/storage.js';
import { MetasCalculos } from '/copcash/js/models/calculos.js';

export class MetasView {
  render(metas = storage.getMetas()) {
    const totalAhorrado = metas.reduce((sum, m) => sum + m.montoActual, 0);
    const totalObjetivo = metas.reduce((sum, m) => sum + m.montoObjetivo, 0);
    const porcentajeTotal = totalObjetivo > 0 ? Math.round((totalAhorrado / totalObjetivo) * 100) : 0;

    const html = `
      <div class="w-full">
        <!-- Header -->
        <div class="mb-8">
          <div class="flex items-center justify-between mb-2">
            <h1 class="text-3xl font-bold text-neutral-900 dark:text-white">
              🎯 Metas de Ahorro
            </h1>
            <button id="btn-add-meta" class="btn-primary">
              + Nueva Meta
            </button>
          </div>
          <p class="text-neutral-600 dark:text-neutral-400">
            Planifica y monitorea tus objetivos de ahorro
          </p>
        </div>

        <!-- KPI Grid -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div class="kpi-card blue">
            <div class="kpi-label">💰 Total Ahorrado</div>
            <div class="kpi-value" style="color: #2563eb;">
              $${totalAhorrado.toLocaleString('es-ES', { maximumFractionDigits: 0 })}
            </div>
            <div class="kpi-change">${metas.length} metas activas</div>
          </div>
          <div class="kpi-card warning">
            <div class="kpi-label">🎪 Objetivo Total</div>
            <div class="kpi-value" style="color: #f59e0b;">
              $${totalObjetivo.toLocaleString('es-ES', { maximumFractionDigits: 0 })}
            </div>
            <div class="kpi-change">Meta colectiva</div>
          </div>
          <div class="kpi-card green">
            <div class="kpi-label">📈 Progreso</div>
            <div class="kpi-value" style="color: #10b981;">
              ${porcentajeTotal}%
            </div>
            <div class="kpi-change">Del objetivo total</div>
          </div>
        </div>

        ${this.renderFormulario()}

        <!-- Metas List -->
        <div class="space-y-4">
          ${metas.length === 0 ? `
            <div class="card text-center py-12">
              <p class="text-neutral-500 dark:text-neutral-400 text-lg">
                📭 No hay metas registradas
              </p>
              <p class="text-neutral-500 dark:text-neutral-400 text-sm mt-2">
                Crea tu primera meta para empezar a ahorrar
              </p>
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
      <div class="card border-l-4 border-purple-500">
        <div class="flex items-start justify-between mb-4">
          <div class="flex-1">
            <h3 class="text-xl font-bold text-neutral-900 dark:text-white">${meta.nombre}</h3>
            ${meta.fechaObjetivo ? `
              <p class="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                📅 Objetivo: ${meta.fechaObjetivo}
                ${diasRestantes !== null ? `<span class="font-semibold">• ${diasRestantes} días</span>` : ''}
              </p>
            ` : ''}
          </div>
          <div class="flex gap-2">
            <button class="btn-edit-meta text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-lg" data-id="${meta.id}">
              ✏️
            </button>
            <button class="btn-delete-meta text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-lg" data-id="${meta.id}">
              🗑️
            </button>
          </div>
        </div>

        <!-- Progress Bar -->
        <div class="mb-6 p-4 bg-neutral-50 dark:bg-neutral-700/30 rounded-lg">
          <div class="flex justify-between items-center mb-2">
            <span class="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Progreso</span>
            <span class="text-sm font-bold text-neutral-900 dark:text-white">
              $${meta.montoActual.toLocaleString('es-ES', { maximumFractionDigits: 0 })} / $${meta.montoObjetivo.toLocaleString('es-ES', { maximumFractionDigits: 0 })}
            </span>
          </div>
          <div class="w-full bg-neutral-200 dark:bg-neutral-600 rounded-full h-3 overflow-hidden">
            <div class="bg-gradient-to-r from-purple-500 to-purple-600 h-3 rounded-full transition-all duration-300" style="width: ${Math.min(porcentaje, 100)}%"></div>
          </div>
          <p class="text-xs text-neutral-600 dark:text-neutral-400 mt-2 font-semibold">${porcentaje}% completado</p>
        </div>

        <!-- Summary Cards -->
        <div class="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
          <div class="card bg-red-50 dark:bg-red-900/20">
            <p class="text-xs text-red-700 dark:text-red-300 font-semibold uppercase">Falta</p>
            <p class="text-lg font-bold text-red-900 dark:text-red-100">
              $${restante.toLocaleString('es-ES', { maximumFractionDigits: 0 })}
            </p>
          </div>
          ${meta.fechaObjetivo && ahorroRequerido > 0 ? `
            <div class="card bg-warning-50 dark:bg-warning-900/20">
              <p class="text-xs text-warning-700 dark:text-warning-300 font-semibold uppercase">Mes</p>
              <p class="text-lg font-bold text-warning-900 dark:text-warning-100">
                $${ahorroRequerido.toLocaleString('es-ES', { maximumFractionDigits: 0 })}
              </p>
            </div>
          ` : ''}
          ${meta.aporteAutomatico ? `
            <div class="card bg-green-50 dark:bg-green-900/20">
              <p class="text-xs text-green-700 dark:text-green-300 font-semibold uppercase">Aporte Auto</p>
              <p class="text-lg font-bold text-green-900 dark:text-green-100">
                $${meta.aporteAutomaticoMonto.toLocaleString('es-ES', { maximumFractionDigits: 0 })}
              </p>
            </div>
          ` : ''}
        </div>

        <!-- Action Button -->
        <button id="btn-aporte-${meta.id}" class="btn-primary w-full" data-id="${meta.id}">
          💵 + Agregar Aporte
        </button>
      </div>
    `;
  }

  renderFormulario(meta = null) {
    const isEdit = meta !== null;

    return `
      <div id="form-meta-container" class="card bg-neutral-50 dark:bg-neutral-700/30 mb-8 ${!isEdit ? 'hidden' : ''} overflow-hidden">
        <h2 class="text-lg font-semibold text-neutral-900 dark:text-white mb-6">
          ${isEdit ? '✏️ Editar Meta de Ahorro' : '➕ Nueva Meta de Ahorro'}
        </h2>
        <form id="form-meta" class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">Nombre</label>
              <input type="text" id="meta-nombre" class="w-full"
                placeholder="Ej: Viaje a la playa" value="${meta?.nombre || ''}" required>
            </div>
            <div>
              <label class="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">Monto Objetivo</label>
              <input type="number" id="meta-objetivo" class="w-full"
                value="${meta?.montoObjetivo || ''}" step="0.01" min="0" required>
            </div>
            <div>
              <label class="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">Ahorrado Actual</label>
              <input type="number" id="meta-actual" class="w-full"
                value="${meta?.montoActual || 0}" step="0.01" min="0" required>
            </div>
            <div>
              <label class="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">Fecha Objetivo (opcional)</label>
              <input type="date" id="meta-fecha" class="w-full"
                value="${meta?.fechaObjetivo || ''}">
            </div>
          </div>

          <div class="border-t border-neutral-200 dark:border-neutral-600 pt-4">
            <h3 class="font-semibold text-neutral-900 dark:text-white mb-3">Aporte Automático Mensual</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="flex items-center">
                <input type="checkbox" id="meta-aporteAuto" class="mr-2" ${meta?.aporteAutomatico ? 'checked' : ''}>
                <label for="meta-aporteAuto" class="text-neutral-700 dark:text-neutral-300 font-medium">Habilitar aporte automático</label>
              </div>
              <div>
                <label class="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">Monto Mensual</label>
                <input type="number" id="meta-aporteAutomonto" class="w-full"
                  value="${meta?.aporteAutomaticoMonto || 0}" step="0.01" min="0">
              </div>
            </div>
          </div>

          <div class="flex gap-2 pt-4 border-t border-neutral-200 dark:border-neutral-600">
            <button type="submit" class="btn-primary">
              ${isEdit ? '✓ Actualizar' : '✓ Guardar'}
            </button>
            <button type="button" id="btn-cancel-meta" class="bg-neutral-300 hover:bg-neutral-400 dark:bg-neutral-600 dark:hover:bg-neutral-500 text-neutral-900 dark:text-white px-4 py-2 rounded-lg font-semibold transition">
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
        <div class="card max-w-sm w-full mx-4">
          <h3 class="text-2xl font-bold text-neutral-900 dark:text-white mb-2">${meta.nombre}</h3>
          <p class="text-neutral-600 dark:text-neutral-400 mb-4">¿Cuánto quieres aportar?</p>
          <input type="number" id="aporte-monto-${meta.id}" class="w-full mb-6"
            placeholder="Monto" step="0.01" min="0">
          <div class="flex gap-2">
            <button id="btn-aporte-confirm-${meta.id}" class="flex-1 btn-primary" data-id="${meta.id}">
              ✓ Aportar
            </button>
            <button id="btn-aporte-cancel-${meta.id}" class="flex-1 bg-neutral-300 hover:bg-neutral-400 dark:bg-neutral-600 dark:hover:bg-neutral-500 text-neutral-900 dark:text-white px-4 py-2 rounded-lg font-semibold transition">
              Cancelar
            </button>
          </div>
        </div>
      </div>
    `;
  }
}
