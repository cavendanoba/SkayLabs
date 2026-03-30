// Vista de Tarjetas de Crédito
import { storage } from '/copcash/js/models/storage.js';
import { TarjetasCalculos } from '/copcash/js/models/calculos.js';

export class TarjetasView {
  render(tarjetas = storage.getTarjetas()) {
    const totalDeuda = tarjetas.reduce((sum, t) => sum + TarjetasCalculos.calcularSaldoTarjeta(t), 0);

    const html = `
      <div class="w-full">
        <!-- Header -->
        <div class="mb-8">
          <div class="flex items-center justify-between mb-2">
            <h1 class="text-3xl font-bold text-neutral-900 dark:text-white">
              💳 Tarjetas de Crédito
            </h1>
            <button id="btn-add-tarjeta" class="btn-primary">
              + Nueva Tarjeta
            </button>
          </div>
          <p class="text-neutral-600 dark:text-neutral-400">
            Administra tus tarjetas y compras a cuotas
          </p>
        </div>

        <!-- KPI -->
        <div class="kpi-card danger mb-8">
          <div class="kpi-label">💰 Total Deuda en Tarjetas</div>
          <div class="kpi-value" style="color: #ef4444;">
            $${totalDeuda.toLocaleString('es-ES', { maximumFractionDigits: 0 })}
          </div>
          <div class="kpi-change">${tarjetas.length} tarjeta(s) registrada(s)</div>
        </div>

        ${this.renderFormularioTarjeta()}

        <!-- Tarjetas List -->
        <div class="space-y-4">
          ${tarjetas.length === 0 ? `
            <div class="card text-center py-12">
              <p class="text-neutral-500 dark:text-neutral-400 text-lg">
                📭 No hay tarjetas registradas
              </p>
              <p class="text-neutral-500 dark:text-neutral-400 text-sm mt-2">
                Registra tu primera tarjeta para comenzar
              </p>
            </div>
          ` : tarjetas.map(tarjeta => this.renderTarjeta(tarjeta)).join('')}
        </div>
      </div>
    `;

    return html;
  }

  renderTarjeta(tarjeta) {
    const saldo = TarjetasCalculos.calcularSaldoTarjeta(tarjeta);
    const disponible = TarjetasCalculos.calcularLimitDisponible(tarjeta);
    const pagaMensual = TarjetasCalculos.calcularPagaMensualTarjeta(tarjeta);
    const porcentajeUso = Math.round((saldo / tarjeta.limiteCrediticio) * 100);

    return `
      <div class="card">
        <!-- Header -->
        <div class="flex items-start justify-between mb-6 pb-4 border-b border-neutral-200 dark:border-neutral-700">
          <div>
            <h3 class="text-2xl font-bold text-neutral-900 dark:text-white">${tarjeta.nombre}</h3>
            <p class="text-sm text-neutral-600 dark:text-neutral-400">${tarjeta.banco}</p>
          </div>
          <div class="flex gap-2">
            <button class="btn-edit-tarjeta text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-lg" data-id="${tarjeta.id}">
              ✏️
            </button>
            <button class="btn-delete-tarjeta text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-lg" data-id="${tarjeta.id}">
              🗑️
            </button>
          </div>
        </div>

        <!-- KPI Cards -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div class="card bg-blue-50 dark:bg-blue-900/20">
            <p class="text-xs text-blue-700 dark:text-blue-300 font-semibold uppercase">Saldo</p>
            <p class="text-2xl font-bold text-blue-900 dark:text-blue-100">
              $${saldo.toLocaleString('es-ES', { maximumFractionDigits: 0 })}
            </p>
          </div>
          <div class="card bg-green-50 dark:bg-green-900/20">
            <p class="text-xs text-green-700 dark:text-green-300 font-semibold uppercase">Disponible</p>
            <p class="text-2xl font-bold text-green-900 dark:text-green-100">
              $${disponible.toLocaleString('es-ES', { maximumFractionDigits: 0 })}
            </p>
          </div>
          <div class="card bg-warning-50 dark:bg-warning-900/20">
            <p class="text-xs text-warning-700 dark:text-warning-300 font-semibold uppercase">A pagar</p>
            <p class="text-2xl font-bold text-warning-900 dark:text-warning-100">
              $${pagaMensual.toLocaleString('es-ES', { maximumFractionDigits: 0 })}
            </p>
          </div>
          <div class="card bg-neutral-100 dark:bg-neutral-700">
            <p class="text-xs text-neutral-700 dark:text-neutral-300 font-semibold uppercase">Límite</p>
            <p class="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
              $${tarjeta.limiteCrediticio.toLocaleString('es-ES', { maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>

        <!-- Utilización Progress Bar -->
        <div class="mb-6 p-4 bg-neutral-50 dark:bg-neutral-700/30 rounded-lg">
          <div class="flex justify-between items-center mb-2">
            <span class="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Utilización del crédito</span>
            <span class="text-sm font-bold text-neutral-900 dark:text-white">${porcentajeUso}%</span>
          </div>
          <div class="w-full bg-neutral-200 dark:bg-neutral-600 rounded-full h-3 overflow-hidden">
            <div class="bg-gradient-to-r from-warning-500 to-danger-500 h-3 rounded-full transition-all" style="width: ${Math.min(porcentajeUso, 100)}%"></div>
          </div>
        </div>

        <!-- Compras a Cuotas -->
        <div class="mb-4">
          <div class="flex items-center justify-between mb-3">
            <h4 class="font-bold text-neutral-900 dark:text-white">💳 Compras a Cuotas</h4>
            <button id="btn-add-compra-${tarjeta.id}" class="btn-add-compra btn-primary text-sm px-3 py-1" data-tarjeta-id="${tarjeta.id}">
              + Compra
            </button>
          </div>

          ${tarjeta.compras.length === 0 ? `
            <p class="text-neutral-500 dark:text-neutral-400 text-sm py-4 text-center">
              No hay compras registradas
            </p>
          ` : `
            <div class="space-y-3">
              ${tarjeta.compras.map(compra => {
                const valorCuota = TarjetasCalculos.calcularValorCuota(compra);
                const cuotasRestantes = TarjetasCalculos.calcularCuotasRestantes(compra);
                const montoRestante = TarjetasCalculos.calcularMontoRestante(compra);
                const porcentajePagado = Math.round((compra.cuotasPagadas / compra.cuotasTotal) * 100);

                return `
                  <div class="card bg-neutral-50 dark:bg-neutral-700/30 border border-neutral-200 dark:border-neutral-600">
                    <div class="flex justify-between items-start mb-3">
                      <div class="flex-1">
                        <p class="font-semibold text-neutral-900 dark:text-white">${compra.nombre}</p>
                        <p class="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                          Cuota: $${valorCuota.toLocaleString('es-ES', { maximumFractionDigits: 0 })}
                        </p>
                      </div>
                      <div class="text-right">
                        <p class="font-semibold text-neutral-900 dark:text-white">
                          $${montoRestante.toLocaleString('es-ES', { maximumFractionDigits: 0 })}
                        </p>
                        <p class="text-xs text-neutral-600 dark:text-neutral-400">
                          ${cuotasRestantes} cuota(s)
                        </p>
                      </div>
                    </div>
                    
                    <div class="flex items-center gap-2 mb-3">
                      <div class="flex-1 bg-neutral-300 dark:bg-neutral-600 rounded-full h-2 overflow-hidden">
                        <div class="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all" style="width: ${porcentajePagado}%"></div>
                      </div>
                      <span class="text-xs text-neutral-700 dark:text-neutral-300 font-semibold whitespace-nowrap">
                        ${compra.cuotasPagadas}/${compra.cuotasTotal}
                      </span>
                    </div>

                    <div class="flex gap-2">
                      ${cuotasRestantes > 0 ? `
                        <button class="btn-pagar-cuota flex-1 text-center bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white text-sm font-semibold px-2 py-1 rounded transition" data-tarjeta-id="${tarjeta.id}" data-compra-id="${compra.id}">
                          ✓ Pagar cuota
                        </button>
                      ` : `
                        <span class="flex-1 text-center text-xs text-green-600 dark:text-green-400 font-semibold py-2">
                          ✓ Totalmente pagado
                        </span>
                      `}
                      <button class="btn-edit-compra text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-bold" data-tarjeta-id="${tarjeta.id}" data-compra-id="${compra.id}">
                        ✏️
                      </button>
                      <button class="btn-delete-compra text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-bold" data-tarjeta-id="${tarjeta.id}" data-compra-id="${compra.id}">
                        🗑️
                      </button>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          `}
        </div>

        <!-- Información de fechas -->
        <div class="card bg-neutral-100 dark:bg-neutral-700/50 text-sm space-y-1 border-l-4 border-neutral-400">
          <p class="text-neutral-700 dark:text-neutral-300"><strong>📅 Cierre:</strong> día ${tarjeta.fechaCierre}</p>
          <p class="text-neutral-700 dark:text-neutral-300"><strong>💳 Pago:</strong> día ${tarjeta.fechaPago}</p>
        </div>
      </div>
    `;
  }

  renderFormularioTarjeta(tarjeta = null) {
    const isEdit = tarjeta !== null;

    return `
      <div id="form-tarjeta-container" class="card bg-neutral-50 dark:bg-neutral-700/30 mb-8 ${!isEdit ? 'hidden' : ''} overflow-hidden">
        <h2 class="text-lg font-semibold text-neutral-900 dark:text-white mb-6">
          ${isEdit ? '✏️ Editar Tarjeta' : '➕ Nueva Tarjeta de Crédito'}
        </h2>
        <form id="form-tarjeta" class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">Nombre</label>
              <input type="text" id="tarjeta-nombre" class="w-full"
                placeholder="Ej: Visa Oro" value="${tarjeta?.nombre || ''}" required>
            </div>
            <div>
              <label class="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">Banco</label>
              <input type="text" id="tarjeta-banco" class="w-full"
                placeholder="Ej: Banco Popular" value="${tarjeta?.banco || ''}" required>
            </div>
            <div>
              <label class="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">Límite de Crédito</label>
              <input type="number" id="tarjeta-limite" class="w-full"
                value="${tarjeta?.limiteCrediticio || ''}" step="0.01" min="0" required>
            </div>
            <div>
              <label class="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">Saldo Disponible</label>
              <input type="number" id="tarjeta-saldo" class="w-full"
                value="${tarjeta?.saldoDisponible || ''}" step="0.01" min="0" required>
            </div>
            <div>
              <label class="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">Día de Cierre</label>
              <input type="number" id="tarjeta-cierre" class="w-full"
                value="${tarjeta?.fechaCierre || ''}" min="1" max="31" required>
            </div>
            <div>
              <label class="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">Día de Pago</label>
              <input type="number" id="tarjeta-pago" class="w-full"
                value="${tarjeta?.fechaPago || ''}" min="1" max="31" required>
            </div>
          </div>
          <div class="flex gap-2 pt-4 border-t border-neutral-200 dark:border-neutral-600">
            <button type="submit" class="btn-primary">
              ${isEdit ? '✓ Actualizar' : '✓ Guardar'}
            </button>
            <button type="button" id="btn-cancel-tarjeta" class="bg-neutral-300 hover:bg-neutral-400 dark:bg-neutral-600 dark:hover:bg-neutral-500 text-neutral-900 dark:text-white px-4 py-2 rounded-lg font-semibold transition">
              Cancelar
            </button>
            ${isEdit ? `<input type="hidden" id="tarjeta-id" value="${tarjeta.id}">` : ''}
          </div>
        </form>
      </div>
    `;
  }

  renderFormularioCompra(tarjetaId, compra = null) {
    const isEdit = compra !== null;

    return `
      <div id="form-compra-container-${tarjetaId}" class="card bg-neutral-50 dark:bg-neutral-700/30 mb-8 ${!isEdit ? 'hidden' : ''} overflow-hidden">
        <h2 class="text-lg font-semibold text-neutral-900 dark:text-white mb-6">
          ${isEdit ? '✏️ Editar Compra' : '➕ Nueva Compra a Cuotas'}
        </h2>
        <form id="form-compra-${tarjetaId}" class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">Nombre de la Compra</label>
              <input type="text" id="compra-nombre-${tarjetaId}" class="w-full"
                value="${compra?.nombre || ''}" required>
            </div>
            <div>
              <label class="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">Monto Total</label>
              <input type="number" id="compra-monto-${tarjetaId}" class="w-full"
                value="${compra?.montoTotal || ''}" step="0.01" min="0" required>
            </div>
            <div>
              <label class="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">Cuotas Total</label>
              <input type="number" id="compra-cuotas-total-${tarjetaId}" class="w-full"
                value="${compra?.cuotasTotal || ''}" min="1" required>
            </div>
            <div>
              <label class="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">Cuotas Pagadas</label>
              <input type="number" id="compra-cuotas-pagadas-${tarjetaId}" class="w-full"
                value="${compra?.cuotasPagadas || 0}" min="0" required>
            </div>
            <div class="md:col-span-2">
              <label class="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">Fecha Primera Cuota (opcional)</label>
              <input type="date" id="compra-fecha-${tarjetaId}" class="w-full"
                value="${compra?.fechaPrimeraCompra || ''}">
            </div>
          </div>
          <div class="flex gap-2 pt-4 border-t border-neutral-200 dark:border-neutral-600">
            <button type="submit" class="btn-primary">
              ${isEdit ? '✓ Actualizar' : '✓ Guardar'}
            </button>
            <button type="button" id="btn-cancel-compra-${tarjetaId}" class="bg-neutral-300 hover:bg-neutral-400 dark:bg-neutral-600 dark:hover:bg-neutral-500 text-neutral-900 dark:text-white px-4 py-2 rounded-lg font-semibold transition">
              Cancelar
            </button>
            ${isEdit ? `<input type="hidden" id="compra-id-${tarjetaId}" value="${compra.id}">` : ''}
          </div>
        </form>
      </div>
    `;
  }
}
