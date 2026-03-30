// Vista del Dashboard
import { storage } from '../models/storage.js';
import { IngresosGastosCalculos, MetasCalculos, TarjetasCalculos, FlujoCalculos } from '../models/calculos.js';

export class DashboardView {
  render() {
    const salario = storage.getSalario();
    const dineroLibre = IngresosGastosCalculos.calcularDineroLibre();
    const tarjetas = storage.getTarjetas();
    const metas = storage.getMetas();
    const alertas = IngresosGastosCalculos.verificarAlertasPresupuesto();
    const flujoCaja = FlujoCalculos.generarFlujoCaja(30);
    const alertasSaldo = FlujoCalculos.verificarAlertasSaldoNegativo(flujoCaja);

    const html = `
      <div class="space-y-6">
        <h1 class="text-4xl font-bold text-gray-800 dark:text-white">Dashboard Financiero</h1>

        <!-- Cards de Resumen Principal -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="bg-gradient-to-br from-green-500 to-emerald-600 text-white p-6 rounded-lg shadow-lg">
            <p class="text-sm opacity-90">Dinero Libre</p>
            <p class="text-3xl font-bold">$${dineroLibre.toFixed(2)}</p>
            <p class="text-xs opacity-75 mt-2">Después de gastos fijos y variables</p>
          </div>

          <div class="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-lg shadow-lg">
            <p class="text-sm opacity-90">Salario Mensual</p>
            <p class="text-3xl font-bold">$${salario.monto.toFixed(2)}</p>
            <p class="text-xs opacity-75 mt-2">Día de cobro: ${salario.diaCobro}</p>
          </div>

          <div class="bg-gradient-to-br from-purple-500 to-pink-600 text-white p-6 rounded-lg shadow-lg">
            <p class="text-sm opacity-90">Deuda Tarjetas</p>
            <p class="text-3xl font-bold">$${tarjetas.reduce((sum, t) => sum + TarjetasCalculos.calcularSaldoTarjeta(t), 0).toFixed(2)}</p>
            <p class="text-xs opacity-75 mt-2">${tarjetas.length} tarjeta(s)</p>
          </div>

          <div class="bg-gradient-to-br from-amber-500 to-orange-600 text-white p-6 rounded-lg shadow-lg">
            <p class="text-sm opacity-90">Metas Activas</p>
            <p class="text-3xl font-bold">${metas.length}</p>
            <p class="text-xs opacity-75 mt-2">Total: $${metas.reduce((sum, m) => sum + m.montoActual, 0).toFixed(2)}</p>
          </div>
        </div>

        <!-- Alertas de Presupuesto -->
        ${alertas.length > 0 ? `
          <div class="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded">
            <h3 class="text-red-800 dark:text-red-200 font-bold flex items-center gap-2">
              ⚠️ Alertas de Presupuesto
            </h3>
            <div class="mt-3 space-y-2">
              ${alertas.map(a => `
                <p class="text-red-700 dark:text-red-300 text-sm">
                  <strong>${a.categoria}:</strong> Gaston $${a.gasto.toFixed(2)} de $${a.presupuesto.toFixed(2)} 
                  <span class="text-red-600">+$${a.exceso.toFixed(2)} exceso</span>
                </p>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- Alertas de Saldo Negativo -->
        ${alertasSaldo.length > 0 ? `
          <div class="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 p-4 rounded">
            <h3 class="text-yellow-800 dark:text-yellow-200 font-bold flex items-center gap-2">
              ⚠️ Proyección: Saldo Negativo
            </h3>
            <div class="mt-3 space-y-1 text-sm">
              ${alertasSaldo.slice(0, 5).map(a => `
                <p class="text-yellow-700 dark:text-yellow-300">
                  ${a.fecha}: <strong>$${a.saldo.toFixed(2)}</strong>
                </p>
              `).join('')}
              ${alertasSaldo.length > 5 ? `<p class="text-yellow-700 dark:text-yellow-300 text-xs">... y ${alertasSaldo.length - 5} días más</p>` : ''}
            </div>
          </div>
        ` : ''}

        <!-- Resumen de Metas -->
        ${metas.length > 0 ? `
          <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h3 class="text-xl font-bold mb-4 text-gray-800 dark:text-white">Metas de Ahorro</h3>
            <div class="space-y-4">
              ${metas.slice(0, 3).map(meta => {
                const porcentaje = MetasCalculos.calcularPorcentajeAlcanzado(meta);
                const restante = MetasCalculos.calcularMontoRestante(meta);
                return `
                  <div>
                    <div class="flex justify-between mb-2">
                      <span class="text-gray-700 dark:text-gray-300 font-semibold">${meta.nombre}</span>
                      <span class="text-gray-600 dark:text-gray-400 text-sm">$${meta.montoActual.toFixed(2)} / $${meta.montoObjetivo.toFixed(2)}</span>
                    </div>
                    <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div class="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full" style="width: ${porcentaje}%"></div>
                    </div>
                    <p class="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      ${porcentaje}% - Falta: $${restante.toFixed(2)}
                    </p>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        ` : ''}

        <!-- Resumen Tarjetas de Crédito -->
        ${tarjetas.length > 0 ? `
          <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h3 class="text-xl font-bold mb-4 text-gray-800 dark:text-white">Tarjetas de Crédito</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              ${tarjetas.map(tarjeta => {
                const saldo = TarjetasCalculos.calcularSaldoTarjeta(tarjeta);
                const disponible = TarjetasCalculos.calcularLimitDisponible(tarjeta);
                const pago = TarjetasCalculos.calcularPagaMensualTarjeta(tarjeta);
                return `
                  <div class="border border-gray-300 dark:border-gray-600 rounded p-4">
                    <div class="flex justify-between items-start mb-3">
                      <div>
                        <p class="font-bold text-gray-800 dark:text-white">${tarjeta.nombre}</p>
                        <p class="text-xs text-gray-600 dark:text-gray-400">${tarjeta.banco}</p>
                      </div>
                      <span class="text-lg">💳</span>
                    </div>
                    <div class="space-y-2 text-sm">
                      <div class="flex justify-between">
                        <span class="text-gray-600 dark:text-gray-400">Saldo:</span>
                        <span class="font-semibold text-red-600">$${saldo.toFixed(2)}</span>
                      </div>
                      <div class="flex justify-between">
                        <span class="text-gray-600 dark:text-gray-400">Disponible:</span>
                        <span class="font-semibold text-green-600">$${disponible.toFixed(2)}</span>
                      </div>
                      <div class="flex justify-between">
                        <span class="text-gray-600 dark:text-gray-400">A pagar este mes:</span>
                        <span class="font-semibold">$${pago.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `;

    return html;
  }
}
