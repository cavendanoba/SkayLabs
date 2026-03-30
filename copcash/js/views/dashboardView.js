// Vista del Dashboard - Diseño Profesional y Minimalista
import { storage } from '/copcash/js/models/storage.js';
import { IngresosGastosCalculos, MetasCalculos, TarjetasCalculos, FlujoCalculos } from '/copcash/js/models/calculos.js';

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
      <div class="w-full">
        <!-- Header profesional -->
        <div class="mb-8">
          <h1 class="text-3xl font-bold text-neutral-900 dark:text-white mb-2">
            📊 Dashboard Financiero
          </h1>
          <p class="text-neutral-600 dark:text-neutral-400">
            Resumen de tu situación financiera actual
          </p>
        </div>

        <!-- KPI Principal - Dinero Libre -->
        <div class="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-8">
          <div class="lg:col-span-2 kpi-card blue">
            <div class="kpi-label">💰 Saldo Disponible</div>
            <div class="kpi-value" style="color: #2563eb;">
              $${dineroLibre.toLocaleString('es-ES', { maximumFractionDigits: 0 })}
            </div>
            <div class="kpi-change">
              Después de gastos fijos, variables y tarjetas
            </div>
          </div>

          <div class="kpi-card green">
            <div class="kpi-label">💵 Salario Mensual</div>
            <div class="kpi-value" style="color: #10b981;">
              $${salario.monto.toLocaleString('es-ES', { maximumFractionDigits: 0 })}
            </div>
            <div class="kpi-change">Día de cobro: ${salario.diaCobro}</div>
          </div>

          <div class="kpi-card warning">
            <div class="kpi-label">💳 Deuda Tarjetas</div>
            <div class="kpi-value" style="color: #f59e0b;">
              $${tarjetas.reduce((sum, t) => sum + TarjetasCalculos.calcularSaldoTarjeta(t), 0).toLocaleString('es-ES', { maximumFractionDigits: 0 })}
            </div>
            <div class="kpi-change">${tarjetas.length} tarjeta(s) activa(s)</div>
          </div>

          <div class="kpi-card">
            <div class="kpi-label">🎯 Metas Activas</div>
            <div class="kpi-value" style="color: #8b5cf6;">
              $${metas.reduce((sum, m) => sum + m.montoActual, 0).toLocaleString('es-ES', { maximumFractionDigits: 0 })}
            </div>
            <div class="kpi-change">${metas.length} meta(s) en progreso</div>
          </div>
        </div>

        <!-- Alertas críticas -->
        ${
          alertas.length > 0
            ? \`
          <div class="mb-8">
            <h3 class="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
              ⚠️ Alertas de Presupuesto
            </h3>
            <div class="space-y-3">
              \${alertas
                .map(
                  (a) => \`
                <div class="alert alert-warning">
                  <strong>\${a.categoria}:</strong> Gastaste $\${a.gasto.toLocaleString('es-ES', { maximumFractionDigits: 0 })} de $\${a.presupuesto.toLocaleString('es-ES', { maximumFractionDigits: 0 })} 
                  <span class="text-red-600 font-semibold">+$\${a.exceso.toLocaleString('es-ES', { maximumFractionDigits: 0 })} exceso</span>
                </div>
              \`
                )
                .join('')}
            </div>
          </div>
        \`
            : ''
        }

        <!-- Alertas de saldo negativo -->
        ${
          alertasSaldo.length > 0
            ? \`
          <div class="mb-8">
            <h3 class="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
              ⚠️ Proyección: Saldo Negativo
            </h3>
            <div class="card bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500">
              <div class="space-y-2 text-sm">
                \${alertasSaldo
                  .slice(0, 5)
                  .map(
                    (a) => \`
                  <div class="flex justify-between">
                    <span class="text-red-700 dark:text-red-300">\${a.fecha}:</span>
                    <strong class="text-red-600 dark:text-red-400">$\${a.saldo.toLocaleString('es-ES', { maximumFractionDigits: 0 })}</strong>
                  </div>
                \`
                  )
                  .join('')}
                \${
                  alertasSaldo.length > 5
                    ? \`<p class="text-xs text-red-600 dark:text-red-400 pt-2">... y \${alertasSaldo.length - 5} días más con saldo negativo</p>\`
                    : ''
                }
              </div>
            </div>
          </div>
        \`
            : ''
        }

        <!-- Resumen de Tarjetas -->
        ${
          tarjetas.length > 0
            ? \`
          <div class="mb-8">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-semibold text-neutral-900 dark:text-white">
                💳 Estado de Tarjetas
              </h3>
              <span class="badge badge-danger">\${tarjetas.length} activas</span>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              \${tarjetas
                .map((tarjeta) => {
                  const saldo = TarjetasCalculos.calcularSaldoTarjeta(tarjeta);
                  const disponible = TarjetasCalculos.calcularLimitDisponible(tarjeta);
                  const pago = TarjetasCalculos.calcularPagaMensualTarjeta(tarjeta);

                  return \`
                <div class="card border-l-4 border-blue-500">
                  <div class="flex items-start justify-between mb-4">
                    <div>
                      <p class="text-sm font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                        \${tarjeta.nombre}
                      </p>
                      <p class="text-xs text-neutral-500 dark:text-neutral-500">\${tarjeta.banco || ''}</p>
                    </div>
                    <span class="text-2xl">💳</span>
                  </div>
                  <div class="space-y-3">
                    <div class="flex justify-between items-center">
                      <span class="text-sm text-neutral-600 dark:text-neutral-400">Saldo:</span>
                      <span class="font-bold text-red-600">$\${saldo.toLocaleString('es-ES', { maximumFractionDigits: 0 })}</span>
                    </div>
                    <div class="flex justify-between items-center">
                      <span class="text-sm text-neutral-600 dark:text-neutral-400">Disponible:</span>
                      <span class="font-bold text-green-600">$\${disponible.toLocaleString('es-ES', { maximumFractionDigits: 0 })}</span>
                    </div>
                    <div class="flex justify-between items-center pt-2 border-t border-neutral-200 dark:border-neutral-700">
                      <span class="text-sm text-neutral-600 dark:text-neutral-400">A pagar:</span>
                      <span class="font-bold text-neutral-900 dark:text-white">$\${pago.toLocaleString('es-ES', { maximumFractionDigits: 0 })}</span>
                    </div>
                  </div>
                </div>
              \`;
                })
                .join('')}
            </div>
          </div>
        \`
            : ''
        }

        <!-- Metas de Ahorro -->
        ${
          metas.length > 0
            ? \`
          <div class="mb-8">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-semibold text-neutral-900 dark:text-white">
                🎯 Metas de Ahorro
              </h3>
              <span class="text-sm text-neutral-600 dark:text-neutral-400">
                \${metas.length} meta(s)
              </span>
            </div>
            <div class="space-y-4">
              \${metas
                .map((meta) => {
                  const porcentaje = MetasCalculos.calcularPorcentajeAlcanzado(meta);
                  const restante = MetasCalculos.calcularMontoRestante(meta);

                  return \`
                <div class="card">
                  <div class="flex items-start justify-between mb-4">
                    <div>
                      <p class="font-semibold text-neutral-900 dark:text-white mb-1">
                        \${meta.nombre}
                      </p>
                      <p class="text-sm text-neutral-600 dark:text-neutral-400">
                        $\${meta.montoActual.toLocaleString('es-ES', { maximumFractionDigits: 0 })} / $\${meta.montoObjetivo.toLocaleString('es-ES', { maximumFractionDigits: 0 })}
                      </p>
                    </div>
                    <span class="text-2xl">🎯</span>
                  </div>
                  <div class="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2 mb-3">
                    <div
                      class="progress-bar"
                      style="width: \${porcentaje}%; background: linear-gradient(90deg, #8b5cf6 0%, #a78bfa 100%);"
                    ></div>
                  </div>
                  <div class="flex items-center justify-between text-xs text-neutral-600 dark:text-neutral-400">
                    <span>\${porcentaje}% completado</span>
                    <span>Falta: $\${restante.toLocaleString('es-ES', { maximumFractionDigits: 0 })}</span>
                  </div>
                </div>
              \`;
                })
                .join('')}
            </div>
          </div>
        \`
            : ''
        }

        <!-- Resumen y Recomendaciones -->
        <div class="card bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-none">
          <div class="flex items-start justify-between">
            <div>
              <h4 class="font-semibold text-neutral-900 dark:text-white mb-3">
                💡 Resumen del Mes
              </h4>
              <ul class="text-sm text-neutral-700 dark:text-neutral-300 space-y-1">
                <li>✓ Salario: $${salario.monto.toLocaleString('es-ES', { maximumFractionDigits: 0 })}</li>
                <li>✓ Tarjetas Pendientes: $${tarjetas.reduce((sum, t) => sum + TarjetasCalculos.calcularSaldoTarjeta(t), 0).toLocaleString('es-ES', { maximumFractionDigits: 0 })}</li>
                <li>✓ Metas: $${metas.reduce((sum, m) => sum + m.montoActual, 0).toLocaleString('es-ES', { maximumFractionDigits: 0 })}</li>
                <li>✓ Disponible: $${dineroLibre.toLocaleString('es-ES', { maximumFractionDigits: 0 })}</li>
              </ul>
            </div>
            <div class="text-right">
              <p class="text-sm text-neutral-600 dark:text-neutral-400 mb-2">
                Actualización
              </p>
              <p class="text-2xl font-bold text-blue-600 dark:text-blue-400">
                ${new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
              </p>
            </div>
          </div>
        </div>
      </div>
    `;

    return html;
  }
}
