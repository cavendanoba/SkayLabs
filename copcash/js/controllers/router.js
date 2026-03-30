// Controlador Principal - Orquestación de la SPA
import { storage } from '../models/storage.js';
import { DashboardView } from '../views/dashboardView.js';
import { GastosFijosView, GastosVariablesView } from '../views/gastosView.js';
import { IngresosExtraView } from '../views/ingresosView.js';
import { TarjetasView } from '../views/tarjetasView.js';
import { MetasView } from '../views/metasView.js';
import { FlujoView } from '../views/flujoView.js';
import { CategoriasView } from '../views/categoriasView.js';
import { NavbarView, ConfiguracionView } from '../views/navbarView.js';
import { TarjetasCalculos } from '../models/calculos.js';

export class Router {
  constructor() {
    this.currentView = 'dashboard';
    this.container = document.getElementById('app-container');
    this.navbar = document.getElementById('navbar-container');
  }

  navigate(view) {
    this.currentView = view;
    this.render();
    this.setupEventListeners();
    // Cerrar menú móvil
    const mobileMenu = document.getElementById('mobile-menu');
    if (mobileMenu) mobileMenu.classList.add('hidden');
    // Scroll al inicio
    window.scrollTo(0, 0);
  }

  render() {
    switch (this.currentView) {
      case 'dashboard':
        this.container.innerHTML = new DashboardView().render();
        break;
      case 'gastos':
        this.renderGastos();
        break;
      case 'ingresos':
        this.container.innerHTML = new IngresosExtraView().render();
        break;
      case 'tarjetas':
        this.renderTarjetas();
        break;
      case 'metas':
        this.renderMetas();
        break;
      case 'flujo':
        this.container.innerHTML = new FlujoView().render();
        break;
      case 'categorias':
        this.renderCategorias();
        break;
      case 'config':
        this.container.innerHTML = new ConfiguracionView().render();
        break;
    }
  }

  renderGastos() {
    const gastosFijosView = new GastosFijosView();
    const gastosVariablesView = new GastosVariablesView();
    
    this.container.innerHTML = `
      <div class="space-y-12">
        <div>${gastosFijosView.render()}</div>
        <hr class="dark:border-gray-700" />
        <div>${gastosVariablesView.render()}</div>
      </div>
    `;
  }

  renderTarjetas() {
    const tarjetasView = new TarjetasView();
    const html = tarjetasView.render();
    
    this.container.innerHTML = html;
    
    // Agregar formularios de compras al final
    const tarjetas = storage.getTarjetas();
    tarjetas.forEach(tarjeta => {
      const formHTML = tarjetasView.renderFormularioCompra(tarjeta.id);
      this.container.innerHTML += formHTML;
    });
  }

  renderMetas() {
    const metasView = new MetasView();
    const html = metasView.render();
    
    this.container.innerHTML = html;
    
    // Agregar diálogos de aporte
    const metas = storage.getMetas();
    metas.forEach(meta => {
      const dialogoHTML = metasView.renderDialogoAporte(meta);
      this.container.innerHTML += dialogoHTML;
    });
  }

  renderCategorias() {
    const categoriasView = new CategoriasView();
    this.container.innerHTML = categoriasView.render();
  }

  setupEventListeners() {
    this.setupNavbar();
    
    switch (this.currentView) {
      case 'gastos':
        this.setupGastosListeners();
        break;
      case 'ingresos':
        this.setupIngresosListeners();
        break;
      case 'tarjetas':
        this.setupTarjetasListeners();
        break;
      case 'metas':
        this.setupMetasListeners();
        break;
      case 'categorias':
        this.setupCategoriasListeners();
        break;
      case 'config':
        this.setupConfigListeners();
        break;
    }
  }

  setupNavbar() {
    // Navegación desktop
    document.querySelectorAll('.nav-link').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.navigate(e.currentTarget.dataset.view);
      });
    });

    // Navegación móvil
    document.querySelectorAll('.nav-link-mobile').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.navigate(e.currentTarget.dataset.view);
      });
    });

    // Modo oscuro
    const darkModeBtn = document.getElementById('btn-dark-mode');
    if (darkModeBtn) {
      darkModeBtn.addEventListener('click', () => {
        document.documentElement.classList.toggle('dark');
        localStorage.setItem('darkMode', document.documentElement.classList.contains('dark'));
      });
    }

    // Menú móvil
    const menuBtn = document.getElementById('btn-menu-mobile');
    const mobileMenu = document.getElementById('mobile-menu');
    if (menuBtn && mobileMenu) {
      menuBtn.addEventListener('click', () => {
        mobileMenu.classList.toggle('hidden');
      });
    }
  }

  setupGastosListeners() {
    // GASTOS FIJOS
    const btnAddGastoFijo = document.getElementById('btn-add-gastoFijo');
    if (btnAddGastoFijo) {
      btnAddGastoFijo.addEventListener('click', () => {
        const container = document.getElementById('form-gastoFijo-container');
        container?.classList.remove('hidden');
      });
    }

    const formGastoFijo = document.getElementById('form-gastoFijo');
    if (formGastoFijo) {
      formGastoFijo.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('gastoFijo-id')?.value;
        const gasto = {
          nombre: document.getElementById('gastoFijo-nombre').value,
          monto: parseFloat(document.getElementById('gastoFijo-monto').value),
          categoria: parseInt(document.getElementById('gastoFijo-categoria').value),
          diaVencimiento: parseInt(document.getElementById('gastoFijo-dia').value),
          activo: document.getElementById('gastoFijo-activo').value === 'true'
        };

        if (id) {
          storage.updateGastoFijo(parseInt(id), gasto);
        } else {
          storage.addGastoFijo(gasto);
        }

        this.renderGastos();
        this.setupEventListeners();
      });
    }

    const btnCancelGastoFijo = document.getElementById('btn-cancel-gastoFijo');
    if (btnCancelGastoFijo) {
      btnCancelGastoFijo.addEventListener('click', () => {
        this.renderGastos();
        this.setupEventListeners();
      });
    }

    document.querySelectorAll('.btn-edit-gastoFijo').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = parseInt(e.currentTarget.dataset.id);
        const gasto = storage.getGastosFijos().find(g => g.id === id);
        const gastosFijosView = new GastosFijosView();
        const container = document.getElementById('form-gastoFijo-container');
        container.innerHTML = gastosFijosView.renderFormulario(gasto);
        container.classList.remove('hidden');
        this.setupGastosListeners();
      });
    });

    document.querySelectorAll('.btn-delete-gastoFijo').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = parseInt(e.currentTarget.dataset.id);
        if (confirm('¿Eliminar este gasto fijo?')) {
          storage.deleteGastoFijo(id);
          this.renderGastos();
          this.setupEventListeners();
        }
      });
    });

    // GASTOS VARIABLES
    const btnAddGastoVariable = document.getElementById('btn-add-gastoVariable');
    if (btnAddGastoVariable) {
      btnAddGastoVariable.addEventListener('click', () => {
        const container = document.getElementById('form-gastoVariable-container');
        container?.classList.remove('hidden');
      });
    }

    const formGastoVariable = document.getElementById('form-gastoVariable');
    if (formGastoVariable) {
      formGastoVariable.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('gastoVariable-id')?.value;
        const gasto = {
          nombre: document.getElementById('gastoVariable-nombre').value,
          monto: parseFloat(document.getElementById('gastoVariable-monto').value),
          fecha: document.getElementById('gastoVariable-fecha').value,
          categoria: parseInt(document.getElementById('gastoVariable-categoria').value),
          pagado: document.getElementById('gastoVariable-id')?.value ? storage.getGastosVariables().find(g => g.id === parseInt(id))?.pagado || false : false
        };

        if (id) {
          storage.updateGastoVariable(parseInt(id), gasto);
        } else {
          storage.addGastoVariable(gasto);
        }

        this.renderGastos();
        this.setupEventListeners();
      });
    }

    const btnCancelGastoVariable = document.getElementById('btn-cancel-gastoVariable');
    if (btnCancelGastoVariable) {
      btnCancelGastoVariable.addEventListener('click', () => {
        this.renderGastos();
        this.setupEventListeners();
      });
    }

    document.querySelectorAll('.btn-toggle-gastoVariable').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = parseInt(e.currentTarget.dataset.id);
        const gasto = storage.getGastosVariables().find(g => g.id === id);
        storage.updateGastoVariable(id, { ...gasto, pagado: !gasto.pagado });
        this.renderGastos();
        this.setupEventListeners();
      });
    });

    document.querySelectorAll('.btn-edit-gastoVariable').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = parseInt(e.currentTarget.dataset.id);
        const gasto = storage.getGastosVariables().find(g => g.id === id);
        const gastosVariablesView = new GastosVariablesView();
        const container = document.getElementById('form-gastoVariable-container');
        container.innerHTML = gastosVariablesView.renderFormulario(gasto);
        container.classList.remove('hidden');
        this.setupGastosListeners();
      });
    });

    document.querySelectorAll('.btn-delete-gastoVariable').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = parseInt(e.currentTarget.dataset.id);
        if (confirm('¿Eliminar este gasto variable?')) {
          storage.deleteGastoVariable(id);
          this.renderGastos();
          this.setupEventListeners();
        }
      });
    });
  }

  setupIngresosListeners() {
    const btnAddIngresoExtra = document.getElementById('btn-add-ingresoExtra');
    if (btnAddIngresoExtra) {
      btnAddIngresoExtra.addEventListener('click', () => {
        const container = document.getElementById('form-ingresoExtra-container');
        container?.classList.remove('hidden');
      });
    }

    const formIngresoExtra = document.getElementById('form-ingresoExtra');
    if (formIngresoExtra) {
      formIngresoExtra.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('ingresoExtra-id')?.value;
        const ingreso = {
          nombre: document.getElementById('ingresoExtra-nombre').value,
          monto: parseFloat(document.getElementById('ingresoExtra-monto').value),
          fecha: document.getElementById('ingresoExtra-fecha').value,
          categoria: parseInt(document.getElementById('ingresoExtra-categoria').value),
          completado: document.getElementById('ingresoExtra-id')?.value ? storage.getIngresosExtra().find(i => i.id === parseInt(id))?.completado || false : false
        };

        if (id) {
          storage.updateIngresoExtra(parseInt(id), ingreso);
        } else {
          storage.addIngresoExtra(ingreso);
        }

        this.navigate('ingresos');
      });
    }

    const btnCancelIngresoExtra = document.getElementById('btn-cancel-ingresoExtra');
    if (btnCancelIngresoExtra) {
      btnCancelIngresoExtra.addEventListener('click', () => {
        this.navigate('ingresos');
      });
    }

    document.querySelectorAll('.btn-toggle-ingresoExtra').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = parseInt(e.currentTarget.dataset.id);
        const ingreso = storage.getIngresosExtra().find(i => i.id === id);
        storage.updateIngresoExtra(id, { ...ingreso, completado: !ingreso.completado });
        this.navigate('ingresos');
      });
    });

    document.querySelectorAll('.btn-edit-ingresoExtra').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = parseInt(e.currentTarget.dataset.id);
        const ingreso = storage.getIngresosExtra().find(i => i.id === id);
        const ingresosView = new IngresosExtraView();
        const container = document.getElementById('form-ingresoExtra-container');
        container.innerHTML = ingresosView.renderFormulario(ingreso);
        container.classList.remove('hidden');
        this.setupIngresosListeners();
      });
    });

    document.querySelectorAll('.btn-delete-ingresoExtra').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = parseInt(e.currentTarget.dataset.id);
        if (confirm('¿Eliminar este ingreso?')) {
          storage.deleteIngresoExtra(id);
          this.navigate('ingresos');
        }
      });
    });
  }

  setupTarjetasListeners() {
    const btnAddTarjeta = document.getElementById('btn-add-tarjeta');
    if (btnAddTarjeta) {
      btnAddTarjeta.addEventListener('click', () => {
        const container = document.getElementById('form-tarjeta-container');
        container?.classList.remove('hidden');
      });
    }

    const formTarjeta = document.getElementById('form-tarjeta');
    if (formTarjeta) {
      formTarjeta.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('tarjeta-id')?.value;
        const tarjeta = {
          nombre: document.getElementById('tarjeta-nombre').value,
          banco: document.getElementById('tarjeta-banco').value,
          limiteCrediticio: parseFloat(document.getElementById('tarjeta-limite').value),
          saldoDisponible: parseFloat(document.getElementById('tarjeta-saldo').value),
          fechaCierre: parseInt(document.getElementById('tarjeta-cierre').value),
          fechaPago: parseInt(document.getElementById('tarjeta-pago').value)
        };

        if (id) {
          storage.updateTarjeta(parseInt(id), tarjeta);
        } else {
          storage.addTarjeta(tarjeta);
        }

        this.renderTarjetas();
        this.setupEventListeners();
      });
    }

    const btnCancelTarjeta = document.getElementById('btn-cancel-tarjeta');
    if (btnCancelTarjeta) {
      btnCancelTarjeta.addEventListener('click', () => {
        this.renderTarjetas();
        this.setupEventListeners();
      });
    }

    document.querySelectorAll('.btn-edit-tarjeta').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = parseInt(e.currentTarget.dataset.id);
        const tarjeta = storage.getTarjeta(id);
        const tarjetasView = new TarjetasView();
        const container = document.getElementById('form-tarjeta-container');
        container.innerHTML = tarjetasView.renderFormularioTarjeta(tarjeta);
        container.classList.remove('hidden');
        this.setupTarjetasListeners();
      });
    });

    document.querySelectorAll('.btn-delete-tarjeta').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = parseInt(e.currentTarget.dataset.id);
        if (confirm('¿Eliminar esta tarjeta y todas sus compras?')) {
          storage.deleteTarjeta(id);
          this.renderTarjetas();
          this.setupEventListeners();
        }
      });
    });

    // COMPRAS A CUOTAS
    document.querySelectorAll('.btn-add-compra').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tarjetaId = parseInt(e.currentTarget.dataset.tarjetaId);
        const container = document.getElementById(`form-compra-container-${tarjetaId}`);
        if (container) {
          container.classList.remove('hidden');
        }
      });
    });

    document.querySelectorAll('[id^="form-compra-"]').forEach(form => {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const tarjetaId = parseInt(form.id.split('-')[2]);
        const compraId = document.getElementById(`compra-id-${tarjetaId}`)?.value;
        const compra = {
          nombre: document.getElementById(`compra-nombre-${tarjetaId}`).value,
          montoTotal: parseFloat(document.getElementById(`compra-monto-${tarjetaId}`).value),
          cuotasTotal: parseInt(document.getElementById(`compra-cuotas-total-${tarjetaId}`).value),
          cuotasPagadas: parseInt(document.getElementById(`compra-cuotas-pagadas-${tarjetaId}`).value),
          fechaPrimeraCompra: document.getElementById(`compra-fecha-${tarjetaId}`).value || new Date().toISOString().split('T')[0]
        };

        if (compraId) {
          storage.updateCompra(tarjetaId, parseInt(compraId), compra);
        } else {
          storage.addCompra(tarjetaId, compra);
        }

        this.renderTarjetas();
        this.setupEventListeners();
      });
    });

    document.querySelectorAll('.btn-pagar-cuota').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tarjetaId = parseInt(e.currentTarget.dataset.tarjetaId);
        const compraId = parseInt(e.currentTarget.dataset.compraId);
        const tarjeta = storage.getTarjeta(tarjetaId);
        
        if (TarjetasCalculos.marcarCuotaPagada(tarjeta, compraId)) {
          storage.updateTarjeta(tarjetaId, tarjeta);
          this.renderTarjetas();
          this.setupEventListeners();
        }
      });
    });

    document.querySelectorAll('.btn-edit-compra').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tarjetaId = parseInt(e.currentTarget.dataset.tarjetaId);
        const compraId = parseInt(e.currentTarget.dataset.compraId);
        const tarjeta = storage.getTarjeta(tarjetaId);
        const compra = tarjeta.compras.find(c => c.id === compraId);
        const tarjetasView = new TarjetasView();
        const container = document.getElementById(`form-compra-container-${tarjetaId}`);
        container.innerHTML = tarjetasView.renderFormularioCompra(tarjetaId, compra);
        container.classList.remove('hidden');
        this.setupTarjetasListeners();
      });
    });

    document.querySelectorAll('.btn-delete-compra').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tarjetaId = parseInt(e.currentTarget.dataset.tarjetaId);
        const compraId = parseInt(e.currentTarget.dataset.compraId);
        if (confirm('¿Eliminar esta compra?')) {
          storage.deleteCompra(tarjetaId, compraId);
          this.renderTarjetas();
          this.setupEventListeners();
        }
      });
    });

    // Botones de cancelar compra
    document.querySelectorAll('[id^="btn-cancel-compra-"]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.renderTarjetas();
        this.setupEventListeners();
      });
    });
  }

  setupMetasListeners() {
    const btnAddMeta = document.getElementById('btn-add-meta');
    if (btnAddMeta) {
      btnAddMeta.addEventListener('click', () => {
        const container = document.getElementById('form-meta-container');
        container?.classList.remove('hidden');
      });
    }

    const formMeta = document.getElementById('form-meta');
    if (formMeta) {
      formMeta.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('meta-id')?.value;
        const meta = {
          nombre: document.getElementById('meta-nombre').value,
          montoObjetivo: parseFloat(document.getElementById('meta-objetivo').value),
          montoActual: parseFloat(document.getElementById('meta-actual').value),
          fechaObjetivo: document.getElementById('meta-fecha').value || null,
          aporteAutomatico: document.getElementById('meta-aporteAuto').checked,
          aporteAutomaticoMonto: parseFloat(document.getElementById('meta-aporteAutomonto').value)
        };

        if (id) {
          storage.updateMeta(parseInt(id), meta);
        } else {
          storage.addMeta(meta);
        }

        this.renderMetas();
        this.setupEventListeners();
      });
    }

    const btnCancelMeta = document.getElementById('btn-cancel-meta');
    if (btnCancelMeta) {
      btnCancelMeta.addEventListener('click', () => {
        this.renderMetas();
        this.setupEventListeners();
      });
    }

    document.querySelectorAll('.btn-edit-meta').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = parseInt(e.currentTarget.dataset.id);
        const meta = storage.getMeta(id);
        const metasView = new MetasView();
        const container = document.getElementById('form-meta-container');
        container.innerHTML = metasView.renderFormulario(meta);
        container.classList.remove('hidden');
        this.setupMetasListeners();
      });
    });

    document.querySelectorAll('.btn-delete-meta').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = parseInt(e.currentTarget.dataset.id);
        if (confirm('¿Eliminar esta meta?')) {
          storage.deleteMeta(id);
          this.renderMetas();
          this.setupEventListeners();
        }
      });
    });

    // Diálogo de aportes
    document.querySelectorAll('.btn-aporte-meta').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const metaId = parseInt(e.currentTarget.dataset.id);
        const dialog = document.getElementById(`dialog-aporte-${metaId}`);
        if (dialog) {
          dialog.classList.remove('hidden');
        }
      });
    });

    document.querySelectorAll('[id^="btn-aporte-confirm-"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const metaId = parseInt(e.currentTarget.id.split('-')[3]);
        const meta = storage.getMeta(metaId);
        const monto = parseFloat(document.getElementById(`aporte-monto-${metaId}`).value);

        if (monto > 0) {
          storage.updateMeta(metaId, { ...meta, montoActual: meta.montoActual + monto });
          this.renderMetas();
          this.setupEventListeners();
        }
      });
    });

    document.querySelectorAll('[id^="btn-aporte-cancel-"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const metaId = parseInt(e.currentTarget.id.split('-')[3]);
        const dialog = document.getElementById(`dialog-aporte-${metaId}`);
        if (dialog) {
          dialog.classList.add('hidden');
        }
      });
    });
  }

  setupCategoriasListeners() {
    const btnAddCategoria = document.getElementById('btn-add-categoria');
    if (btnAddCategoria) {
      btnAddCategoria.addEventListener('click', () => {
        const container = document.getElementById('form-categoria-container');
        container?.classList.remove('hidden');
      });
    }

    const formCategoria = document.getElementById('form-categoria');
    if (formCategoria) {
      formCategoria.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('categoria-id')?.value;
        const categoria = {
          nombre: document.getElementById('categoria-nombre').value,
          icon: document.getElementById('categoria-icon').value,
          presupuesto: parseFloat(document.getElementById('categoria-presupuesto').value),
          color: document.getElementById('categoria-color').value
        };

        if (id) {
          storage.updateCategoria(parseInt(id), categoria);
        } else {
          storage.addCategoria(categoria);
        }

        this.renderCategorias();
        this.setupEventListeners();
      });
    }

    const btnCancelCategoria = document.getElementById('btn-cancel-categoria');
    if (btnCancelCategoria) {
      btnCancelCategoria.addEventListener('click', () => {
        this.renderCategorias();
        this.setupEventListeners();
      });
    }

    document.querySelectorAll('.color-picker').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const color = e.currentTarget.dataset.color;
        document.getElementById('categoria-color').value = color;
        document.getElementById('categoria-color-input').value = color;
        document.querySelectorAll('.color-picker').forEach(b => {
          b.style.borderWidth = b === e.currentTarget ? '2px' : '';
        });
      });
    });

    document.getElementById('categoria-color-input')?.addEventListener('change', (e) => {
      document.getElementById('categoria-color').value = e.target.value;
    });

    document.querySelectorAll('.btn-edit-categoria').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = parseInt(e.currentTarget.dataset.id);
        const categoria = storage.getCategoria(id);
        const categoriasView = new CategoriasView();
        const container = document.getElementById('form-categoria-container');
        container.innerHTML = categoriasView.renderFormulario(categoria);
        container.classList.remove('hidden');
        this.setupCategoriasListeners();
      });
    });

    document.querySelectorAll('.btn-delete-categoria').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = parseInt(e.currentTarget.dataset.id);
        if (confirm('¿Eliminar esta categoría? (Los gastos asociados no se eliminarán)')) {
          storage.deleteCategoria(id);
          this.renderCategorias();
          this.setupEventListeners();
        }
      });
    });
  }

  setupConfigListeners() {
    const formSalario = document.getElementById('form-salario');
    if (formSalario) {
      formSalario.addEventListener('submit', (e) => {
        e.preventDefault();
        storage.setSalario({
          monto: parseFloat(document.getElementById('salario-monto').value),
          diaCobro: parseInt(document.getElementById('salario-dia').value),
          descripcion: document.getElementById('salario-descripcion').value
        });
        alert('Salario actualizado correctamente');
        this.navigate('config');
      });
    }

    const btnExportar = document.getElementById('btn-exportar-json');
    if (btnExportar) {
      btnExportar.addEventListener('click', () => {
        const json = storage.exportData();
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `copcash-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
      });
    }

    const btnImportar = document.getElementById('btn-importar-json');
    const fileInput = document.getElementById('file-importar');
    if (btnImportar && fileInput) {
      btnImportar.addEventListener('click', () => fileInput.click());
      fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            try {
              if (storage.importData(event.target.result)) {
                alert('Datos importados correctamente');
                this.navigate('dashboard');
              } else {
                alert('Error al importar datos');
              }
            } catch (error) {
              alert('Error al procesar el archivo');
            }
          };
          reader.readAsText(file);
        }
      });
    }

    const btnReset = document.getElementById('btn-reset-datos');
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        if (confirm('¿Restaurar todos los datos a valores de ejemplo? Esta acción no se puede deshacer.')) {
          storage.resetData();
          alert('Datos restaurados');
          this.navigate('dashboard');
        }
      });
    }
  }
}
