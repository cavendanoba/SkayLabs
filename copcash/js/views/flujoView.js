// Vista del Flujo de Caja Proyectado
import { FlujoCalculos } from '../models/calculos.js';

export class FlujoView {
  render(diasAdelante = 60) {
    const flujoCaja = FlujoCalculos.generarFlujoCaja(diasAdelante);
    const alertas = FlujoCalculos.verificarAlertasSaldoNegativo(flujoCaja);
    
    // Calcular mínimo y máximo saldo
    const saldos = flujoCaja.map(d => d.saldoFinal);
    const minSaldo = Math.min(...saldos);
    const maxSaldo = Math.max(...saldos);

    const html = `
      <div class="space-y-6">
        <h1 class="text-4xl font-bold text-gray-800 dark:text-white">Flujo de Caja Proyectado</h1>

        <!-- Resumen -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div class="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-lg">
            <p class="text-sm text-blue-800 dark:text-blue-300 font-semibold uppercase">Saldo Actual</p>
            <p class="text-2xl font-bold text-blue-900 dark:text-blue-100">$${flujoCaja[0]?.saldoFinal.toFixed(2) || '0.00'}</p>
          </div>
          <div class="bg-green-100 dark:bg-green-900/30 p-4 rounded-lg">
            <p class="text-sm text-green-800 dark:text-green-300 font-semibold uppercase">Máximo Saldo</p>
            <p class="text-2xl font-bold text-green-900 dark:text-green-100">$${maxSaldo.toFixed(2)}</p>
          </div>
          <div class="bg-red-100 dark:bg-red-900/30 p-4 rounded-lg">
            <p class="text-sm text-red-800 dark:text-red-300 font-semibold uppercase">Mínimo Saldo</p>
            <p class="text-2xl font-bold text-red-900 dark:text-red-100">$${minSaldo.toFixed(2)}</p>
          </div>
          <div class="bg-purple-100 dark:bg-purple-900/30 p-4 rounded-lg">
            <p class="text-sm text-purple-800 dark:text-purple-300 font-semibold uppercase">Fin de Período</p>
            <p class="text-2xl font-bold text-purple-900 dark:text-purple-100">$${flujoCaja[flujoCaja.length - 1]?.saldoFinal.toFixed(2) || '0.00'}</p>
          </div>
        </div>

        <!-- Alertas -->
        ${alertas.length > 0 ? `
          <div class="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded">
            <h3 class="text-red-800 dark:text-red-200 font-bold flex items-center gap-2 mb-3">
              ⚠️ ${alertas.length} Día(s) con Saldo Negativo
            </h3>
            <div class="space-y-1">
              ${alertas.map(a => `
                <p class="text-red-700 dark:text-red-300 text-sm">
                  <strong>${a.fecha}:</strong> $${a.saldo.toFixed(2)}
                </p>
              `).join('')}
            </div>
          </div>
        ` : `
          <div class="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 p-4 rounded">
            <p class="text-green-800 dark:text-green-200 font-semibold">
              ✓ Buena noticia: No hay saldos negativos proyectados en los próximos ${diasAdelante} días
            </p>
          </div>
        `}

        <!-- Tabla de flujo -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-gray-100 dark:bg-gray-700 sticky top-0">
              <tr>
                <th class="px-4 py-3 text-left text-gray-700 dark:text-gray-300">Fecha</th>
                <th class="px-4 py-3 text-left text-gray-700 dark:text-gray-300">Evento</th>
                <th class="px-4 py-3 text-right text-gray-700 dark:text-gray-300">Monto</th>
                <th class="px-4 py-3 text-right text-gray-700 dark:text-gray-300">Saldo</th>
              </tr>
            </thead>
            <tbody>
              ${flujoCaja.map((dia, index) => `
                ${dia.eventos.length > 0 ? dia.eventos.map((evento, idx) => `
                  <tr class="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 ${evento.tipo === 'egreso' ? 'bg-red-50 dark:bg-red-900/10' : 'bg-green-50 dark:bg-green-900/10'}">
                    <td class="px-4 py-3 text-gray-800 dark:text-white font-semibold">
                      ${idx === 0 ? `
                        <span class="text-xs bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-white px-2 py-1 rounded">
                          ${dia.fecha}
                        </span>
                      ` : ''}
                    </td>
                    <td class="px-4 py-3 text-gray-800 dark:text-white">
                      <span class="text-xs font-semibold text-gray-600 dark:text-gray-400 block">${evento.categoria}</span>
                      ${evento.descripcion}
                    </td>
                    <td class="px-4 py-3 text-right font-semibold">
                      <span class="${evento.tipo === 'egreso' ? 'text-red-700 dark:text-red-400' : 'text-green-700 dark:text-green-400'}">
                        ${evento.tipo === 'egreso' ? '-' : '+'}$${evento.monto.toFixed(2)}
                      </span>
                    </td>
                    <td class="px-4 py-3 text-right">
                      ${idx === dia.eventos.length - 1 ? `
                        <span class="inline-block font-bold px-3 py-1 rounded ${dia.saldoFinal < 0 ? 'bg-red-200 dark:bg-red-900/40 text-red-800 dark:text-red-300' : 'bg-green-200 dark:bg-green-900/40 text-green-800 dark:text-green-300'}">
                          $${dia.saldoFinal.toFixed(2)}
                        </span>
                      ` : ''}
                    </td>
                  </tr>
                `).join('') : ''}
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    return html;
  }
}
