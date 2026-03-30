// Vista de Tarjetas de Crédito
import { storage } from '../models/storage.js';
import { TarjetasCalculos } from '../models/calculos.js';

export class TarjetasView {
  render(tarjetas = storage.getTarjetas()) {
    const totalDeuda = tarjetas.reduce((sum, t) => sum + TarjetasCalculos.calcularSaldoTarjeta(t), 0);

    const html = `
      <div class="space-y-6">
        <div class="flex justify-between items-center">
          <h1 class="text-4xl font-bold text-gray-800 dark:text-white">Tarjetas de Crédito</h1>
          <button id="btn-add-tarjeta" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold">
            + Nueva Tarjeta
          </button>
        </div>

        <div class="bg-gradient-to-br from-purple-500 to-pink-600 text-white p-6 rounded-lg shadow-lg">
          <p class="text-sm opacity-90">Total Deuda en Tarjetas</p>
          <p class="text-4xl font-bold">$${totalDeuda.toFixed(2)}</p>
          <p class="text-xs opacity-75 mt-2">${tarjetas.length} tarjeta(s) registrada(s)</p>
        </div>

        ${this.renderFormularioTarjeta()}

        <div class="space-y-4">
          ${tarjetas.length === 0 ? `
            <div class="bg-white dark:bg-gray-800 p-8 rounded-lg shadow text-center">
              <p class="text-gray-600 dark:text-gray-400 text-lg">No hay tarjetas registradas</p>
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
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div class="flex justify-between items-start mb-4">
          <div>
            <h3 class="text-2xl font-bold text-gray-800 dark:text-white">${tarjeta.nombre}</h3>
            <p class="text-gray-600 dark:text-gray-400">${tarjeta.banco}</p>
          </div>
          <div class="space-x-2">
            <button class="btn-edit-tarjeta text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-lg" data-id="${tarjeta.id}">
              ✏️
            </button>
            <button class="btn-delete-tarjeta text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-lg" data-id="${tarjeta.id}">
              🗑️
            </button>
          </div>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded">
            <p class="text-xs text-blue-700 dark:text-blue-300 font-semibold uppercase">Saldo</p>
            <p class="text-2xl font-bold text-blue-900 dark:text-blue-100">$${saldo.toFixed(2)}</p>
          </div>
          <div class="bg-green-50 dark:bg-green-900/20 p-4 rounded">
            <p class="text-xs text-green-700 dark:text-green-300 font-semibold uppercase">Disponible</p>
            <p class="text-2xl font-bold text-green-900 dark:text-green-100">$${disponible.toFixed(2)}</p>
          </div>
          <div class="bg-orange-50 dark:bg-orange-900/20 p-4 rounded">
            <p class="text-xs text-orange-700 dark:text-orange-300 font-semibold uppercase">A pagar mes</p>
            <p class="text-2xl font-bold text-orange-900 dark:text-orange-100">$${pagaMensual.toFixed(2)}</p>
          </div>
          <div class="bg-purple-50 dark:bg-purple-900/20 p-4 rounded">
            <p class="text-xs text-purple-700 dark:text-purple-300 font-semibold uppercase">Límite</p>
            <p class="text-2xl font-bold text-purple-900 dark:text-purple-100">$${tarjeta.limiteCrediticio.toFixed(2)}</p>
          </div>
        </div>

        <!-- Barra de utilización -->
        <div class="mb-6">
          <div class="flex justify-between mb-2">
            <span class="text-sm font-semibold text-gray-700 dark:text-gray-300">Utilización del crédito</span>
            <span class="text-sm font-bold text-gray-700 dark:text-gray-300">${porcentajeUso}%</span>
          </div>
          <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div class="bg-gradient-to-r from-red-500 to-orange-500 h-3 rounded-full" style="width: ${Math.min(porcentajeUso, 100)}%"></div>
          </div>
        </div>

        <!-- Compras a cuotas -->
        <div class="mb-4">
          <div class="flex justify-between items-center mb-3">
            <h4 class="font-bold text-gray-800 dark:text-white">Compras a Cuotas</h4>
            <button id="btn-add-compra-${tarjeta.id}" class="btn-add-compra bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm font-semibold" data-tarjeta-id="${tarjeta.id}">
              + Compra
            </button>
          </div>

          ${tarjeta.compras.length === 0 ? `
            <p class="text-gray-500 dark:text-gray-400 text-sm">No hay compras registradas</p>
          ` : `
            <div class="space-y-3">
              ${tarjeta.compras.map(compra => {
                const valorCuota = TarjetasCalculos.calcularValorCuota(compra);
                const cuotasRestantes = TarjetasCalculos.calcularCuotasRestantes(compra);
                const montoRestante = TarjetasCalculos.calcularMontoRestante(compra);
                const porcentajePagado = Math.round((compra.cuotasPagadas / compra.cuotasTotal) * 100);

                return `
                  <div class="border border-gray-300 dark:border-gray-600 rounded p-3 bg-gray-50 dark:bg-gray-700/50">
                    <div class="flex justify-between items-start mb-2">
                      <div class="flex-1">
                        <p class="font-semibold text-gray-800 dark:text-white">${compra.nombre}</p>
                        <p class="text-xs text-gray-600 dark:text-gray-400">Valor cuota: $${valorCuota.toFixed(2)}</p>
                      </div>
                      <div class="text-right">
                        <p class="font-semibold text-gray-800 dark:text-white">$${montoRestante.toFixed(2)}</p>
                        <p class="text-xs text-gray-600 dark:text-gray-400">${cuotasRestantes} cuota(s)</p>
                      </div>
                    </div>
                    
                    <div class="flex items-center gap-2 mb-2">
                      <div class="flex-1 bg-gray-300 dark:bg-gray-600 rounded-full h-2">
                        <div class="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full" style="width: ${porcentajePagado}%"></div>
                      </div>
                      <span class="text-xs text-gray-700 dark:text-gray-300 font-semibold">${compra.cuotasPagadas}/${compra.cuotasTotal}</span>
                    </div>

                    <div class="flex gap-2">
                      ${cuotasRestantes > 0 ? `
                        <button class="btn-pagar-cuota text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 text-sm font-semibold" data-tarjeta-id="${tarjeta.id}" data-compra-id="${compra.id}">
                          ✓ Pagar cuota
                        </button>
                      ` : `<span class="text-xs text-green-600 dark:text-green-400 font-semibold">✓ Totalmente pagado</span>`}
                      <button class="btn-edit-compra text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm" data-tarjeta-id="${tarjeta.id}" data-compra-id="${compra.id}">
                        ✏️
                      </button>
                      <button class="btn-delete-compra text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm" data-tarjeta-id="${tarjeta.id}" data-compra-id="${compra.id}">
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
        <div class="bg-gray-100 dark:bg-gray-700/50 p-3 rounded text-sm">
          <p class="text-gray-700 dark:text-gray-300"><strong>Cierre:</strong> día ${tarjeta.fechaCierre}</p>
          <p class="text-gray-700 dark:text-gray-300"><strong>Pago:</strong> día ${tarjeta.fechaPago}</p>
        </div>
      </div>
    `;
  }

  renderFormularioTarjeta(tarjeta = null) {
    const isEdit = tarjeta !== null;

    return `
      <div id="form-tarjeta-container" class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow ${!isEdit ? 'hidden' : ''}">
        <h2 class="text-2xl font-bold mb-4 text-gray-800 dark:text-white">
          ${isEdit ? 'Editar Tarjeta' : 'Nueva Tarjeta de Crédito'}
        </h2>
        <form id="form-tarjeta" class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Nombre</label>
              <input type="text" id="tarjeta-nombre" class="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-3 py-2" 
                placeholder="Ej: Visa Oro" value="${tarjeta?.nombre || ''}" required>
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Banco</label>
              <input type="text" id="tarjeta-banco" class="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-3 py-2" 
                placeholder="Ej: Banco Popular" value="${tarjeta?.banco || ''}" required>
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Límite de Crédito</label>
              <input type="number" id="tarjeta-limite" class="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-3 py-2" 
                value="${tarjeta?.limiteCrediticio || ''}" step="0.01" min="0" required>
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Saldo Disponible</label>
              <input type="number" id="tarjeta-saldo" class="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-3 py-2" 
                value="${tarjeta?.saldoDisponible || ''}" step="0.01" min="0" required>
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Día de Cierre</label>
              <input type="number" id="tarjeta-cierre" class="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-3 py-2" 
                value="${tarjeta?.fechaCierre || ''}" min="1" max="31" required>
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Día de Pago</label>
              <input type="number" id="tarjeta-pago" class="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-3 py-2" 
                value="${tarjeta?.fechaPago || ''}" min="1" max="31" required>
            </div>
          </div>
          <div class="flex gap-2">
            <button type="submit" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold">
              ${isEdit ? 'Actualizar' : 'Guardar'}
            </button>
            <button type="button" id="btn-cancel-tarjeta" class="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded-lg font-semibold">
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
      <div id="form-compra-container-${tarjetaId}" class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow ${!isEdit ? 'hidden' : ''}">
        <h2 class="text-2xl font-bold mb-4 text-gray-800 dark:text-white">
          ${isEdit ? 'Editar Compra' : 'Nueva Compra a Cuotas'}
        </h2>
        <form id="form-compra-${tarjetaId}" class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Nombre de la Compra</label>
              <input type="text" id="compra-nombre-${tarjetaId}" class="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-3 py-2" 
                value="${compra?.nombre || ''}" required>
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Monto Total</label>
              <input type="number" id="compra-monto-${tarjetaId}" class="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-3 py-2" 
                value="${compra?.montoTotal || ''}" step="0.01" min="0" required>
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Cuotas Total</label>
              <input type="number" id="compra-cuotas-total-${tarjetaId}" class="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-3 py-2" 
                value="${compra?.cuotasTotal || ''}" min="1" required>
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Cuotas Pagadas</label>
              <input type="number" id="compra-cuotas-pagadas-${tarjetaId}" class="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-3 py-2" 
                value="${compra?.cuotasPagadas || 0}" min="0" required>
            </div>
            <div class="md:col-span-2">
              <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Fecha Primera Cuota (opcional)</label>
              <input type="date" id="compra-fecha-${tarjetaId}" class="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-3 py-2" 
                value="${compra?.fechaPrimeraCompra || ''}">
            </div>
          </div>
          <div class="flex gap-2">
            <button type="submit" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold">
              ${isEdit ? 'Actualizar' : 'Guardar'}
            </button>
            <button type="button" id="btn-cancel-compra-${tarjetaId}" class="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded-lg font-semibold">
              Cancelar
            </button>
            ${isEdit ? `<input type="hidden" id="compra-id-${tarjetaId}" value="${compra.id}">` : ''}
          </div>
        </form>
      </div>
    `;
  }
}
