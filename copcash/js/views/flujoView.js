// Vista del Flujo de Caja Proyectado
import { FlujoCalculos } from '/copcash/js/models/calculos.js';

export class FlujoView {
  render(diasAdelante = 60) {
    const flujoCaja = FlujoCalculos.generarFlujoCaja(diasAdelante);
    const alertas = FlujoCalculos.verificarAlertasSaldoNegativo(flujoCaja);
    
    const saldos = flujoCaja.map(d => d.saldoFinal);
    const minSaldo = Math.min(...saldos);
    const maxSaldo = Math.max(...saldos);
    const saldoFinal = flujoCaja[flujoCaja.length - 1]?.saldoFinal || 0;

    const html = `
      <div class="w-full">
        <!-- Header -->
        <div class="mb-8">
          <div class="flex items-center justify-between mb-2">
            <h1 class="text-3xl font-bold text-neutral-900 dark:text-white">
              📈 Flujo de Caja Proyectado
            </h1>
          </div>
          <p class="text-neutral-600 dark:text-neutral-400">
            Proyección de saldo para los próximos ${diasAdelante} días
          </p>
        </div>

        <!-- KPI Grid -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div class="kpi-card blue">
            <div class="kpi-label">💰 Saldo Actual</div>
            <div class="kpi-value" style="color: #2563eb;">
              $${(flujoCaja[0]?.saldoFinal || 0).toLocaleString('es-ES', { maximumFractionDigits: 0 })}
            </div>
            <div class="kpi-change">Hoy</div>
          </div>
          <div class="kpi-card green">
            <div class="kpi-label">📈 Máximo</div>
            <div class="kpi-value" style="color: #10b981;">
              $${maxSaldo.toLocaleString('es-ES', { maximumFractionDigits: 0 })}
            </div>
            <div class="kpi-change">En el período</div>
          </div>
          <div class="kpi-card danger">
            <div class="kpi-label">📉 Mínimo</div>
            <div class="kpi-value" style="color: #ef4444;">
              $${minSaldo.toLocaleString('es-ES', { maximumFractionDigits: 0 })}
            </div>
            <div class="kpi-change">En el período</div>
          </div>
          <div class="kpi-card warning">
            <div class="kpi-label">🎯 Fin de Período</div>
            <div class="kpi-value" style="color: #f59e0b;">
              $${saldoFinal.toLocaleString('es-ES', { maximumFractionDigits: 0 })}
            </div>
            <div class="kpi-change">Día ${diasAdelante}</div>
          </div>
        </div>

        <!-- Alerts -->
        ${alertas.length > 0 ? `
          <div class="alert alert-danger mb-8">
            <h3 class="font-bold flex items-center gap-2 mb-3">
              ⚠️ ${alertas.length} Día(s) con Saldo Negativo
            </h3>
            <div class="space-y-1">
              ${alertas.map(a => `
                <p class="text-sm">
                  <strong>${a.fecha}:</strong> $${a.saldo.toLocaleString('es-ES', { maximumFractionDigits: 2 })}
                </p>
              `).join('')}
            </div>
          </div>
        ` : `
          <div class="alert alert-success mb-8">
            <p class="font-semibold">
              ✓ Buena noticia: No hay saldos negativos proyectados en los próximos ${diasAdelante} días
            </p>
          </div>
        `}

        <!-- Table -->
        <div class="card overflow-hidden">
          <h2 class="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
            Detalle del Flujo
          </h2>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr>
                  <th class="px-4 py-3 text-left">Fecha</th>
                  <th class="px-4 py-3 text-left">Evento</th>
                  <th class="px-4 py-3 text-right">Monto</th>
                  <th class="px-4 py-3 text-right">Saldo</th>
                </tr>
              </thead>
              <tbody>
                ${flujoCaja.map((dia, index) => `
                  ${dia.eventos.length > 0 ? dia.eventos.map((evento, idx) => `
                    <tr class="border-t border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition ${evento.tipo === 'egreso' ? 'bg-red-50/30 dark:bg-red-900/10' : 'bg-green-50/30 dark:bg-green-900/10'}">
                      <td class="px-4 py-3 text-neutral-900 dark:text-white font-semibold">
                        ${idx === 0 ? `
                          <span class="text-xs badge badge-${minSaldo < 0 ? 'danger' : 'info'}">
                            ${dia.fecha}
                          </span>
                        ` : ''}
                      </td>
                      <td class="px-4 py-3 text-neutral-800 dark:text-neutral-200">
                        <span class="text-xs font-semibold text-neutral-600 dark:text-neutral-400 block">${evento.categoria}</span>
                        <span class="text-neutral-900 dark:text-white">${evento.descripcion}</span>
                      </td>
                      <td class="px-4 py-3 text-right font-semibold">
                        <span class="${evento.tipo === 'egreso' ? 'text-red-700 dark:text-red-400' : 'text-green-700 dark:text-green-400'}">
                          ${evento.tipo === 'egreso' ? '-' : '+'}$${evento.monto.toLocaleString('es-ES', { maximumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td class="px-4 py-3 text-right">
                        ${idx === dia.eventos.length - 1 ? `
                          <span class="inline-block font-bold px-3 py-1 rounded text-sm ${dia.saldoFinal < 0 ? 'badge badge-danger' : 'badge badge-success'}">
                            $${dia.saldoFinal.toLocaleString('es-ES', { maximumFractionDigits: 0 })}
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
      </div>
    `;

    return html;
  }
}
