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
    const proximaCuota = TarjetasCalculos.calcularProximaCuotaAPagar(tarjeta);
    const saldo = TarjetasCalculos.calcularSaldoTarjeta(tarjeta);
    const disponible = TarjetasCalculos.calcularLimitDisponible(tarjeta);
    const porcentajeUso = TarjetasCalculos.calcularPorcentajeUtilizacion(tarjeta);
    const diasParaPago = TarjetasCalculos.calcularDiasParaPago(tarjeta);
    const proximaFechaPago = TarjetasCalculos.calcularProximaFechaPago(tarjeta);
    const proximaFechaCierre = TarjetasCalculos.calcularProximaFechaCierre(tarjeta);
    const comprasActivas = TarjetasCalculos.obtenerComprasActivas(tarjeta);
    
    // Colores según estado de urgencia
    const estadoUrgencia = diasParaPago <= 3 ? 'danger' : diasParaPago <= 7 ? 'warning' : 'success';
    const colorEstado = diasParaPago <= 3 ? '#ef4444' : diasParaPago <= 7 ? '#ffa94d' : '#51cf66';

    return `
      <div class="card border-l-4" style="border-left-color: ${colorEstado};">
        <!-- Header -->
        <div class="flex items-start justify-between mb-6 pb-4 border-b border-neutral-200 dark:border-neutral-700">
          <div>
            <h3 class="text-2xl font-bold text-neutral-900 dark:text-white">${tarjeta.nombre}</h3>
            <p class="text-sm text-neutral-600 dark:text-neutral-400">${tarjeta.banco}</p>
          </div>
          <div class="flex gap-2">
            <button class="btn-edit-tarjeta text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-lg" data-id="${tarjeta.id}" title="Editar tarjeta">
              ✏️
            </button>
            <button class="btn-delete-tarjeta text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-lg" data-id="${tarjeta.id}" title="Eliminar tarjeta">
              🗑️
            </button>
          </div>
        </div>

        <!-- Resumen de Cuenta - Hero Section -->
        <div class="mb-6 p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800/40">
          <div class="flex items-start justify-between mb-4">
            <div>
              <p class="text-sm text-blue-700 dark:text-blue-300 font-semibold uppercase mb-2">🏦 Cuota a Pagar (Este Período)</p>
              <div class="flex items-baseline gap-2">
                <span class="text-4xl font-900" style="color: var(--primary);">
                  $${proximaCuota.toLocaleString('es-ES', { maximumFractionDigits: 0 })}
                </span>
                <span class="text-neutral-600 dark:text-neutral-400 font-semibold">COP</span>
              </div>
            </div>
            <div class="text-right">
              <span class="text-sm font-bold px-3 py-1 rounded-full" style="background-color: ${colorEstado}20; color: ${colorEstado};">
                ${diasParaPago} días para pagar
              </span>
            </div>
          </div>
          
          <div class="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            <div>
              <p class="text-blue-600 dark:text-blue-300 font-semibold">Fecha Pago</p>
              <p class="text-neutral-900 dark:text-white font-bold">${new Date(proximaFechaPago).toLocaleDateString('es-ES')}</p>
            </div>
            <div>
              <p class="text-blue-600 dark:text-blue-300 font-semibold">Cierre</p>
              <p class="text-neutral-900 dark:text-white font-bold">Día ${tarjeta.fechaCierre}</p>
            </div>
            <div>
              <p class="text-blue-600 dark:text-blue-300 font-semibold">Interés Anual</p>
              <p class="text-neutral-900 dark:text-white font-bold">${tarjeta.tasaInteresAnual}% TEA</p>
            </div>
          </div>
        </div>

        <!-- KPI Grid -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <!-- Uso del Crédito -->
          <div class="card bg-warning-50 dark:bg-warning-900/20">
            <p class="text-xs text-warning-700 dark:text-warning-300 font-semibold uppercase">Uso del Crédito</p>
            <p class="text-2xl font-bold text-warning-900 dark:text-warning-100">
              ${porcentajeUso}%
            </p>
            <div class="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-1 mt-2">
              <div class="bg-gradient-to-r from-warning-500 to-danger-500 h-1 rounded-full transition-all" style="width: ${Math.min(porcentajeUso, 100)}%"></div>
            </div>
          </div>

          <!-- Disponible -->
          <div class="card bg-green-50 dark:bg-green-900/20">
            <p class="text-xs text-green-700 dark:text-green-300 font-semibold uppercase">Disponible</p>
            <p class="text-2xl font-bold text-green-900 dark:text-green-100">
              $${disponible.toLocaleString('es-ES', { maximumFractionDigits: 0 })}
            </p>
          </div>

          <!-- Saldo Total -->
          <div class="card bg-neutral-100 dark:bg-neutral-700">
            <p class="text-xs text-neutral-700 dark:text-neutral-300 font-semibold uppercase">Saldo Total</p>
            <p class="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
              $${saldo.toLocaleString('es-ES', { maximumFractionDigits: 0 })}
            </p>
          </div>

          <!-- Límite -->
          <div class="card bg-blue-50 dark:bg-blue-900/20">
            <p class="text-xs text-blue-700 dark:text-blue-300 font-semibold uppercase">Límite</p>
            <p class="text-2xl font-bold text-blue-900 dark:text-blue-100">
              $${tarjeta.limiteCrediticio.toLocaleString('es-ES', { maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>

        <!-- Alertas de Intereses si hay Deuda Anterior -->
        ${tarjeta.saldoPeriodosAnteriores > 0 ? `
          <div class="mb-6 p-4 bg-danger-50 dark:bg-danger-900/30 border-l-4 border-danger-500 rounded-lg">
            <p class="text-sm font-bold text-danger-700 dark:text-danger-300 mb-3">
              ⚠️ Deuda de Períodos Anteriores
            </p>
            <div class="grid grid-cols-3 gap-3 text-sm">
              <div>
                <p class="text-danger-600 dark:text-danger-400 font-semibold">Saldo Anterior</p>
                <p class="text-danger-900 dark:text-danger-100 font-bold">$${tarjeta.saldoPeriodosAnteriores.toLocaleString('es-ES', { maximumFractionDigits: 0 })}</p>
              </div>
              <div>
                <p class="text-danger-600 dark:text-danger-400 font-semibold">Interés Generado</p>
                <p class="text-danger-900 dark:text-danger-100 font-bold">$${TarjetasCalculos.calcularInteresesDelPeriodo(tarjeta).toLocaleString('es-ES', { maximumFractionDigits: 0 })}</p>
              </div>
              <div>
                <p class="text-danger-600 dark:text-danger-400 font-semibold">Total a Pagar</p>
                <p class="text-danger-900 dark:text-danger-100 font-bold">$${(tarjeta.saldoPeriodosAnteriores + TarjetasCalculos.calcularInteresesDelPeriodo(tarjeta)).toLocaleString('es-ES', { maximumFractionDigits: 0 })}</p>
              </div>
            </div>
            <p class="text-xs text-danger-600 dark:text-danger-400 mt-3">
              💡 Paga la cuota completa para evitar más intereses
            </p>
          </div>
        ` : ''}

        <!-- Desglose de Compras a Cuotas -->
        <div class="mb-6">
          <div class="flex items-center justify-between mb-3">
            <h4 class="font-bold text-neutral-900 dark:text-white text-lg">
              🛒 Compras a Cuotas (${comprasActivas.length})
            </h4>
            <button id="btn-add-compra-${tarjeta.id}" class="btn-add-compra btn-primary text-sm px-3 py-1" data-tarjeta-id="${tarjeta.id}" title="Agregar nueva compra">
              + Compra
            </button>
          </div>

          ${comprasActivas.length === 0 ? `
            <p class="text-neutral-500 dark:text-neutral-400 text-sm py-6 text-center bg-neutral-50 dark:bg-neutral-700/30 rounded-lg">
              📭 Sin compras a cuotas
            </p>
          ` : `
            <div class="space-y-3">
              ${comprasActivas.map(compra => {
                const porcentajePagado = Math.round((compra.cuotasPagadas / compra.cuotasTotal) * 100);
                const colorBarra = compra.cuotasRestantes === 0 ? '#51cf66' : compra.cuotasRestantes === 1 ? '#ffa94d' : '#5b7cfa';

                return `
                  <div class="card bg-neutral-50 dark:bg-neutral-700/30 border border-neutral-200 dark:border-neutral-600">
                    <div class="flex justify-between items-start mb-4">
                      <div class="flex-1">
                        <p class="font-semibold text-neutral-900 dark:text-white text-lg">${compra.nombre}</p>
                        <div class="flex gap-4 mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                          <span>💰 $${compra.montoTotal.toLocaleString('es-ES', { maximumFractionDigits: 0 })}</span>
                          <span>📊 Cuota: $${compra.monto_cuota_fija.toLocaleString('es-ES', { maximumFractionDigits: 0 })}</span>
                        </div>
                      </div>
                      <div class="text-right">
                        <p class="text-sm text-neutral-600 dark:text-neutral-400 mb-1">Restante</p>
                        <p class="font-bold text-lg text-neutral-900 dark:text-white">
                          $${compra.montoRestante.toLocaleString('es-ES', { maximumFractionDigits: 0 })}
                        </p>
                      </div>
                    </div>
                    
                    <!-- Barra de progreso -->
                    <div class="flex items-center gap-3 mb-3">
                      <div class="flex-1 bg-neutral-300 dark:bg-neutral-600 rounded-full h-2 overflow-hidden">
                        <div class="h-2 rounded-full transition-all" style="width: ${porcentajePagado}%; background-color: ${colorBarra};"></div>
                      </div>
                      <div class="text-xs font-bold text-neutral-700 dark:text-neutral-300 whitespace-nowrap">
                        ${compra.cuotasPagadas}/${compra.cuotasTotal}
                      </div>
                    </div>

                    <!-- Botones de acción -->
                    <div class="flex gap-2 pt-3 border-t border-neutral-200 dark:border-neutral-600">
                      ${compra.cuotasRestantes > 0 ? `
                        <span class="flex-1 text-center text-xs text-neutral-600 dark:text-neutral-400 font-semibold py-2 bg-neutral-100 dark:bg-neutral-700 rounded-lg">
                          Próxima cuota: $${compra.monto_cuota_fija.toLocaleString('es-ES', { maximumFractionDigits: 0 })}
                        </span>
                      ` : `
                        <span class="flex-1 text-center text-xs text-green-600 dark:text-green-400 font-bold py-2 bg-green-50 dark:bg-green-900/30 rounded-lg">
                          ✓ Totalmente pagado
                        </span>
                      `}
                      <button class="btn-edit-compra text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 p-2" data-tarjeta-id="${tarjeta.id}" data-compra-id="${compra.id}" title="Editar compra">
                        ✏️
                      </button>
                      <button class="btn-delete-compra text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-2" data-tarjeta-id="${tarjeta.id}" data-compra-id="${compra.id}" title="Eliminar compra">
                        🗑️
                      </button>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          `}
        </div>

        <!-- Botón Principal de Pagar Cuenta -->
        <div class="mb-6 flex gap-3">
          <button class="btn-pagar-cuenta flex-1 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white text-lg font-bold px-6 py-4 rounded-xl transition transform hover:scale-105" 
            data-tarjeta-id="${tarjeta.id}" 
            data-monto="${proximaCuota}"
            title="Pagar la cuenta completa de este período">
            ✓ PAGAR CUENTA COMPLETA
          </button>
          <button class="btn-pagar-parcial px-6 py-4 bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-neutral-900 dark:text-white font-bold rounded-xl transition" 
            data-tarjeta-id="${tarjeta.id}"
            title="Realizar un pago parcial">
            💳 Pago Parcial
          </button>
        </div>

        <!-- Información de Fechas Compacta -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm bg-neutral-100 dark:bg-neutral-700/50 p-4 rounded-xl">
          <div>
            <p class="text-neutral-600 dark:text-neutral-400 font-semibold mb-1">📅 Próximo Cierre</p>
            <p class="text-neutral-900 dark:text-white font-bold">${new Date(proximaFechaCierre).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}</p>
          </div>
          <div>
            <p class="text-neutral-600 dark:text-neutral-400 font-semibold mb-1">💳 Vencimiento</p>
            <p class="text-neutral-900 dark:text-white font-bold">${new Date(proximaFechaPago).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}</p>
          </div>
          <div>
            <p class="text-neutral-600 dark:text-neutral-400 font-semibold mb-1">📊 TEA</p>
            <p class="text-neutral-900 dark:text-white font-bold">${tarjeta.tasaInteresAnual}% anual</p>
          </div>
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
              <label class="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">Tasa de Interés Anual (TEA %)</label>
              <input type="number" id="tarjeta-tasa-interes" class="w-full"
                placeholder="Ej: 19.32" value="${tarjeta?.tasaInteresAnual || '19.32'}" step="0.01" min="0" max="100" required>
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
          
          <div class="bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-500 p-4 rounded-lg">
            <p class="text-sm text-blue-700 dark:text-blue-300 font-semibold mb-2">💡 Información de TEA</p>
            <p class="text-xs text-blue-600 dark:text-blue-400">
              La Tasa Efectiva Anual es el interés que se aplica si no pagas la cuenta completa. 
              Valores típicos en Colombia: 18-25% anual.
            </p>
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
