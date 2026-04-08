// Vista del Dashboard - Diseño Profesional y Minimalista
import { storage } from '/copcash/js/models/storage.js';
import { IngresosGastosCalculos, MetasCalculos, TarjetasCalculos, FlujoCalculos } from '/copcash/js/models/calculos.js';

export class DashboardView {
  constructor() {
    this.salario = storage.getSalario();
    this.gastosFijos = storage.getGastosFijos();
    this.gastosVariables = storage.getGastosVariables();
    this.flujoCaja = FlujoCalculos.generarFlujoCaja(30);
    this.categorias = storage.getCategorias();
  }

  render() {
    const dineroLibre = IngresosGastosCalculos.calcularDineroLibre();
    const tarjetas = storage.getTarjetas();
    const metas = storage.getMetas();
    const alertas = IngresosGastosCalculos.verificarAlertasPresupuesto();
    const alertasSaldo = FlujoCalculos.verificarAlertasSaldoNegativo(this.flujoCaja);
    const gastosFijos = this.gastosFijos;
    const gastosVariables = this.gastosVariables;
    const categorias = this.categorias;

    const totalGastos = gastosFijos.reduce((sum, g) => sum + g.monto, 0) + 
                       gastosVariables.reduce((sum, g) => sum + g.monto, 0);
    const deudaTarjetas = tarjetas.reduce((sum, t) => sum + TarjetasCalculos.calcularSaldoTarjeta(t), 0);
    const ahorroMetas = metas.reduce((sum, m) => sum + m.montoActual, 0);

    const html = `
      <div class="w-full max-w-7xl mx-auto px-4 py-6">
        <!-- Hero Section -->
        <div class="mb-8">
          <h1 class="text-4xl md:text-5xl font-800 text-neutral-900 dark:text-white mb-2 tracking-tight">
            Bienvenido a CopCash
          </h1>
          <p class="text-lg text-neutral-500 dark:text-neutral-400">
            ${new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <!-- Primary KPI - Saldo Disponible -->
        <div class="mb-8">
          <div class="card bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-neutral-700 dark:to-neutral-800 border-none">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <p class="text-neutral-600 dark:text-neutral-400 text-lg mb-2">Saldo Disponible</p>
                <div class="flex items-baseline gap-2">
                  <span class="text-5xl font-800 text-primary" style="color: var(--primary);">
                    $${dineroLibre.toLocaleString('es-ES', { maximumFractionDigits: 0 })}
                  </span>
                  <span class="text-neutral-500 dark:text-neutral-400">COP</span>
                </div>
                <p class="text-sm text-neutral-600 dark:text-neutral-400 mt-4">
                  Después de gastos, deudas y metas
                </p>
              </div>
              <div class="hidden md:flex justify-center">
                <div class="text-6xl">💰</div>
              </div>
            </div>
          </div>
        </div>

        <!-- KPI Grid -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div class="kpi-card blue">
            <div class="kpi-label">💵 Salario</div>
            <div class="kpi-value" style="color: #5b7cfa;">
              $${this.salario.monto.toLocaleString('es-ES', { maximumFractionDigits: 0 })}
            </div>
            <div class="kpi-change">Día ${this.salario.diaCobro}</div>
          </div>

          <div class="kpi-card warning">
            <div class="kpi-label">💳 Deuda Tarjetas</div>
            <div class="kpi-value" style="color: #ffa94d;">
              $${deudaTarjetas.toLocaleString('es-ES', { maximumFractionDigits: 0 })}
            </div>
            <div class="kpi-change">${tarjetas.length} tarjeta(s)</div>
          </div>

          <div class="kpi-card green">
            <div class="kpi-label">🎯 Ahorro en Metas</div>
            <div class="kpi-value" style="color: #51cf66;">
              $${ahorroMetas.toLocaleString('es-ES', { maximumFractionDigits: 0 })}
            </div>
            <div class="kpi-change">${metas.length} meta(s)</div>
          </div>

          <div class="kpi-card" style="background: linear-gradient(135deg, #ffe8a3 0%, #ffcc99 100%);">
            <div class="kpi-label">📊 Gastos Mes</div>
            <div class="kpi-value" style="color: #d97706;">
              $${totalGastos.toLocaleString('es-ES', { maximumFractionDigits: 0 })}
            </div>
            <div class="kpi-change">Total gastado</div>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="mb-8 grid grid-cols-2 md:grid-cols-4 gap-3">
          <button id="dashboard-btn-add-gasto" class="card hover:shadow-lg transition cursor-pointer text-center py-6 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 hover:border-blue-400">
            <div class="text-3xl mb-2">🏠</div>
            <div class="text-sm font-semibold text-neutral-900 dark:text-white">Agregar Gasto</div>
          </button>
          <button id="dashboard-btn-add-ingreso" class="card hover:shadow-lg transition cursor-pointer text-center py-6 bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 hover:border-green-400">
            <div class="text-3xl mb-2">💰</div>
            <div class="text-sm font-semibold text-neutral-900 dark:text-white">Agregar Ingreso</div>
          </button>
          <button id="dashboard-btn-add-tarjeta" class="card hover:shadow-lg transition cursor-pointer text-center py-6 bg-warning-50 dark:bg-warning-900/20 border-2 border-warning-200 dark:border-warning-800 hover:border-warning-400">
            <div class="text-3xl mb-2">💳</div>
            <div class="text-sm font-semibold text-neutral-900 dark:text-white">Nueva Tarjeta</div>
          </button>
          <button id="dashboard-btn-add-meta" class="card hover:shadow-lg transition cursor-pointer text-center py-6 bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-200 dark:border-purple-800 hover:border-purple-400">
            <div class="text-3xl mb-2">🎯</div>
            <div class="text-sm font-semibold text-neutral-900 dark:text-white">Nueva Meta</div>
          </button>
        </div>

        <!-- Alerts Section -->
        ${alertas.length > 0 || alertasSaldo.length > 0 ? `
          <div class="mb-8 space-y-4">
            ${alertasSaldo.length > 0 ? `
              <div class="alert alert-danger">
                <div class="flex items-center gap-2 mb-2">
                  <span class="text-xl">⚠️</span>
                  <strong>Proyección: Saldo Negativo en ${alertasSaldo.length} día(s)</strong>
                </div>
                <p class="text-sm mt-2">Los primeros días con saldo negativo:</p>
                <div class="mt-2 space-y-1">
                  ${alertasSaldo.slice(0, 3).map(a => `
                    <div class="text-sm">• ${a.fecha}: $${a.saldo.toLocaleString('es-ES', { maximumFractionDigits: 0 })}</div>
                  `).join('')}
                </div>
              </div>
            ` : ''}
            
            ${alertas.length > 0 ? `
              <div class="alert alert-warning">
                <div class="flex items-center gap-2 mb-2">
                  <span class="text-xl">⚠️</span>
                  <strong>Categorías Sobrepasadas: ${alertas.length}</strong>
                </div>
                ${alertas.map(a => `
                  <div class="text-sm mt-1">
                    • <strong>${a.categoria}:</strong> $${a.gasto.toLocaleString('es-ES', { maximumFractionDigits: 0 })} de $${a.presupuesto.toLocaleString('es-ES', { maximumFractionDigits: 0 })}, 
                    <span class="text-danger">+$${a.exceso.toLocaleString('es-ES', { maximumFractionDigits: 0 })}</span>
                  </div>
                `).join('')}
              </div>
            ` : ''}
          </div>
        ` : `
          <div class="alert alert-success mb-8">
            <div class="flex items-center gap-2">
              <span class="text-xl">✓</span>
              <strong>Excelente: Todo bajo control</strong>
            </div>
          </div>
        `}

        <!-- Charts Section -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <!-- Gasto por Categoría -->
          <div class="card">
            <h3 class="text-lg font-bold text-neutral-900 dark:text-white mb-6">
              📊 Gastos por Categoría
            </h3>
            <div style="position: relative; height: 300px;">
              <canvas id="categoriasChart"></canvas>
            </div>
          </div>

          <!-- Flujo de Dinero -->
          <div class="card">
            <h3 class="text-lg font-bold text-neutral-900 dark:text-white mb-6">
              📈 Proyección 30 Días
            </h3>
            <div style="position: relative; height: 300px;">
              <canvas id="flujoChart"></canvas>
            </div>
          </div>
        </div>

        <!-- Resumen Tarjetas -->
        ${tarjetas.length > 0 ? `
          <div class="mb-8">
            <h3 class="text-xl font-bold text-neutral-900 dark:text-white mb-4">
              💳 Estado de Tarjetas
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              ${tarjetas.map(tarjeta => {
                const saldo = TarjetasCalculos.calcularSaldoTarjeta(tarjeta);
                const disponible = TarjetasCalculos.calcularLimitDisponible(tarjeta);
                const porcentaje = Math.min((saldo / tarjeta.limiteCrediticio) * 100, 100);
                
                return `
                  <div class="card">
                    <div class="mb-4">
                      <p class="font-bold text-neutral-900 dark:text-white">${tarjeta.nombre}</p>
                      <p class="text-sm text-neutral-600 dark:text-neutral-400">${tarjeta.banco || 'Banco'}</p>
                    </div>
                    <div class="mb-4 space-y-2">
                      <div class="flex justify-between text-sm">
                        <span class="text-neutral-600 dark:text-neutral-400">Saldo:</span>
                        <span class="font-bold text-danger">$${saldo.toLocaleString('es-ES', { maximumFractionDigits: 0 })}</span>
                      </div>
                      <div class="flex justify-between text-sm">
                        <span class="text-neutral-600 dark:text-neutral-400">Disponible:</span>
                        <span class="font-bold text-success">$${disponible.toLocaleString('es-ES', { maximumFractionDigits: 0 })}</span>
                      </div>
                    </div>
                    <div class="h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                      <div class="h-full bg-gradient-to-r from-warning to-danger" style="width: ${porcentaje}%"></div>
                    </div>
                    <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-2">${Math.round(porcentaje)}% utilizado</p>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        ` : ''}

        <!-- Resumen Metas -->
        ${metas.length > 0 ? `
          <div>
            <h3 class="text-xl font-bold text-neutral-900 dark:text-white mb-4">
              🎯 Metas de Ahorro
            </h3>
            <div class="space-y-3">
              ${metas.slice(0, 3).map(meta => {
                const porcentaje = MetasCalculos.calcularPorcentajeAlcanzado(meta);
                const restante = MetasCalculos.calcularMontoRestante(meta);
                
                return `
                  <div class="card">
                    <div class="flex justify-between items-start mb-2">
                      <div>
                        <p class="font-semibold text-neutral-900 dark:text-white">${meta.nombre}</p>
                        <p class="text-xs text-neutral-600 dark:text-neutral-400">
                          $${meta.montoActual.toLocaleString('es-ES', { maximumFractionDigits: 0 })} / $${meta.montoObjetivo.toLocaleString('es-ES', { maximumFractionDigits: 0 })}
                        </p>
                      </div>
                      <span class="text-sm font-bold text-primary">${porcentaje}%</span>
                    </div>
                    <div class="h-2.5 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                      <div class="h-full bg-gradient-to-r from-primary to-blue-500" style="width: ${porcentaje}%"></div>
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

  getCategoriesData(categorias, gastosFijos, gastosVariables) {
    const gastosPorCategoria = {};
    const coloresPorCategoria = {};
    
    gastosFijos.forEach(g => {
      const cat = categorias.find(c => c.id === g.categoria);
      if (cat) {
        gastosPorCategoria[cat.nombre] = (gastosPorCategoria[cat.nombre] || 0) + g.monto;
        coloresPorCategoria[cat.nombre] = cat.color + '80';
      }
    });
    
    gastosVariables.forEach(g => {
      const cat = categorias.find(c => c.id === g.categoria);
      if (cat) {
        gastosPorCategoria[cat.nombre] = (gastosPorCategoria[cat.nombre] || 0) + g.monto;
        coloresPorCategoria[cat.nombre] = cat.color + '80';
      }
    });

    const labels = Object.keys(gastosPorCategoria);
    return {
      labels,
      data: labels.map(l => gastosPorCategoria[l]),
      colors: labels.map(l => coloresPorCategoria[l] || '#5b7cfa')
    };
  }

  getFlujoCajaData(flujoCaja) {
    const fechas = [];
    const saldos = [];
    
    flujoCaja.forEach((dia, idx) => {
      if (idx % 5 === 0) {
        fechas.push(dia.fecha);
        saldos.push(dia.saldoFinal);
      }
    });

    return { fechas, saldos };
  }

  // Inicializar gráficos después de renderizar el HTML
  initializeCharts(categorias, gastosFijos, gastosVariables, flujoCaja) {
    // Esperar un frame para asegurar que el DOM esté listo
    setTimeout(() => {
      // Gráfico de Categorías
      const categoriasData = this.getCategoriesData(categorias, gastosFijos, gastosVariables);
      const categoriasChartEl = document.getElementById('categoriasChart');
      
      if (categoriasChartEl && categoriasData.labels.length > 0) {
        try {
          new Chart(categoriasChartEl, {
            type: 'doughnut',
            data: {
              labels: categoriasData.labels,
              datasets: [{
                data: categoriasData.data,
                backgroundColor: categoriasData.colors,
                borderColor: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
                borderWidth: 2
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'bottom',
                  labels: { 
                    font: { size: 11 }, 
                    padding: 15,
                    color: document.documentElement.classList.contains('dark') ? '#d1d5db' : '#374151'
                  }
                }
              }
            }
          });
        } catch (e) {
          console.error('Error al crear gráfico de categorías:', e);
        }
      }

      // Gráfico de Flujo
      const flujoData = this.getFlujoCajaData(flujoCaja);
      const flujoChartEl = document.getElementById('flujoChart');
      
      if (flujoChartEl && flujoData.fechas.length > 0) {
        try {
          new Chart(flujoChartEl, {
            type: 'line',
            data: {
              labels: flujoData.fechas,
              datasets: [{
                label: 'Saldo Proyectado',
                data: flujoData.saldos,
                borderColor: '#5b7cfa',
                backgroundColor: 'rgba(91, 124, 250, 0.05)',
                borderWidth: 2,
                tension: 0.4,
                fill: true,
                pointRadius: 0,
                pointHoverRadius: 6,
                pointBackgroundColor: '#5b7cfa'
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: false }
              },
              scales: {
                y: {
                  beginAtZero: false,
                  grid: { drawBorder: false }
                },
                x: {
                  grid: { display: false }
                }
              }
            }
          });
        } catch (e) {
          console.error('Error al crear gráfico de flujo:', e);
        }
      }
    }, 100);
  }

  // Método público para inicializar gráficos y listeners
  initChartsAndListeners(routerCallback) {
    this.initializeCharts(this.categorias, this.gastosFijos, this.gastosVariables, this.flujoCaja);
    
    // Listeners para botones de acceso rápido
    const btnAddGasto = document.getElementById('dashboard-btn-add-gasto');
    const btnAddIngreso = document.getElementById('dashboard-btn-add-ingreso');
    const btnAddTarjeta = document.getElementById('dashboard-btn-add-tarjeta');
    const btnAddMeta = document.getElementById('dashboard-btn-add-meta');

    if (btnAddGasto) {
      btnAddGasto.addEventListener('click', () => routerCallback('gastos'));
    }
    if (btnAddIngreso) {
      btnAddIngreso.addEventListener('click', () => routerCallback('ingresos'));
    }
    if (btnAddTarjeta) {
      btnAddTarjeta.addEventListener('click', () => routerCallback('tarjetas'));
    }
    if (btnAddMeta) {
      btnAddMeta.addEventListener('click', () => routerCallback('metas'));
    }
  }
}
