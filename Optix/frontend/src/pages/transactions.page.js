// frontend/src/pages/transactions.page.js
import transactionsService from '../services/transactions.service.js';
import DataTable from '../components/table.component.js';
import Modal from '../components/modal.component.js';
import Toast from '../components/toast.component.js';
import renderBadge from '../components/badge.component.js';
import renderAuthenticatedLayout from '../layouts/authenticated.layout.js';

function formatCurrency(amount) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(amount || 0);
}

const CATEGORY_LABELS = {
  CONSULTATION: 'Consulta',
  PROCEDURE: 'Procedimiento',
  EXAM: 'Examen',
  RENT: 'Arriendo',
  SALARY: 'Nómina',
  SUPPLIES: 'Insumos',
  EQUIPMENT: 'Equipos',
  OTHER: 'Otro',
};

const columns = [
  {
    header: 'Fecha',
    key: 'createdAt',
    render: (row) => new Date(row.createdAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }),
  },
  { header: 'Tipo', key: 'type', render: (row) => renderBadge(row.type) },
  {
    header: 'Categoría',
    key: 'category',
    render: (row) => `<span class="text-sm">${CATEGORY_LABELS[row.category] || row.category}</span>`,
  },
  {
    header: 'Monto',
    key: 'amount',
    render: (row) => `<span class="fw-700 ${row.type === 'INCOME' ? 'text-success' : 'text-danger'}">${formatCurrency(row.amount)}</span>`,
  },
  {
    header: 'Método',
    key: 'paymentMethod',
    render: (row) => {
      const labels = { CASH: 'Efectivo', TRANSFER: 'Transferencia', CARD: 'Tarjeta', OTHER: 'Otro' };
      return labels[row.paymentMethod] || row.paymentMethod;
    },
  },
  {
    header: 'Paciente',
    key: 'patient',
    render: (row) => row.patient ? `${row.patient.firstName} ${row.patient.lastName}` : '—',
  },
  {
    header: 'Descripción',
    key: 'description',
    render: (row) => `<span class="text-muted text-sm">${row.description || '—'}</span>`,
  },
];

let currentPage = 1;
let currentSearch = '';
let tableInstance = null;
let summaryData = null;

async function loadTransactions(page = 1, filters = {}) {
  try {
    tableInstance?.showLoading();
    const result = await transactionsService.list({ page, limit: 20, ...filters });
    tableInstance?.render({
      data: result.data,
      total: result.total,
      page: result.page,
      pages: result.pages,
    });
    currentPage = result.page;
  } catch (err) {
    Toast.error('Error al cargar transacciones');
  }
}

async function loadSummary() {
  try {
    summaryData = await transactionsService.getSummary();
    renderSummaryCards(summaryData);
  } catch (err) {
    console.error('Error al cargar resumen:', err);
  }
}

function renderSummaryCards(summary) {
  const container = document.getElementById('transactions-summary');
  if (!container || !summary) return;

  container.innerHTML = `
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-icon text-success">↑</div>
        <div class="kpi-info">
          <div class="kpi-value text-success">${formatCurrency(summary.income)}</div>
          <div class="kpi-label">Ingresos totales</div>
          <div class="kpi-sub">${summary.incomeCount} registros</div>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon text-danger">↓</div>
        <div class="kpi-info">
          <div class="kpi-value text-danger">${formatCurrency(summary.expense)}</div>
          <div class="kpi-label">Egresos totales</div>
          <div class="kpi-sub">${summary.expenseCount} registros</div>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon ${summary.balance >= 0 ? 'text-success' : 'text-danger'}">≡</div>
        <div class="kpi-info">
          <div class="kpi-value ${summary.balance >= 0 ? 'text-success' : 'text-danger'}">${formatCurrency(summary.balance)}</div>
          <div class="kpi-label">Balance</div>
          <div class="kpi-sub">${summary.balance >= 0 ? 'Positivo' : 'Negativo'}</div>
        </div>
      </div>
    </div>
  `;
}

function renderCreateModal() {
  const modal = new Modal({ title: 'Nueva Transacción', size: 'md' });

  const formHTML = `
    <form id="transaction-form" class="form-grid-2">
      <div class="form-group">
        <label class="form-label">Tipo *</label>
        <select name="type" class="form-control" required>
          <option value="">Seleccionar...</option>
          <option value="INCOME">Ingreso</option>
          <option value="EXPENSE">Egreso</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Categoría *</label>
        <select name="category" class="form-control" required>
          <option value="">Seleccionar...</option>
          <option value="CONSULTATION">Consulta</option>
          <option value="PROCEDURE">Procedimiento</option>
          <option value="EXAM">Examen</option>
          <option value="RENT">Arriendo</option>
          <option value="SALARY">Nómina</option>
          <option value="SUPPLIES">Insumos</option>
          <option value="EQUIPMENT">Equipos</option>
          <option value="OTHER">Otro</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Monto (COP) *</label>
        <input type="number" name="amount" class="form-control" required placeholder="Ej: 80000" min="0" step="1000" />
      </div>
      <div class="form-group">
        <label class="form-label">Método de pago *</label>
        <select name="paymentMethod" class="form-control" required>
          <option value="">Seleccionar...</option>
          <option value="CASH">Efectivo</option>
          <option value="TRANSFER">Transferencia</option>
          <option value="CARD">Tarjeta</option>
          <option value="OTHER">Otro</option>
        </select>
      </div>
      <div class="form-group form-group-full">
        <label class="form-label">Descripción</label>
        <textarea name="description" class="form-control" rows="3" placeholder="Descripción opcional de la transacción..."></textarea>
      </div>
    </form>
  `;

  const footerHTML = `
    <button type="button" class="btn btn-secondary" id="cancel-transaction">Cancelar</button>
    <button type="submit" form="transaction-form" class="btn btn-primary" id="save-transaction">Registrar transacción</button>
  `;

  modal.render(formHTML, footerHTML);

  document.getElementById('cancel-transaction')?.addEventListener('click', () => modal.close());

  document.getElementById('transaction-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const saveBtn = document.getElementById('save-transaction');
    const fd = new FormData(e.target);
    const data = Object.fromEntries(fd.entries());
    data.amount = Number(data.amount);
    if (!data.description) delete data.description;

    try {
      saveBtn.disabled = true;
      saveBtn.textContent = 'Guardando...';
      await transactionsService.create(data);
      Toast.success('Transacción registrada exitosamente');
      modal.close();
      loadTransactions(currentPage);
      loadSummary();
    } catch (err) {
      Toast.error(err.message || 'Error al registrar la transacción');
      saveBtn.disabled = false;
      saveBtn.textContent = 'Registrar transacción';
    }
  });
}

export function render(container) {
  renderAuthenticatedLayout(container, `
    <div class="page-header">
      <h1 class="page-title">Caja y Transacciones</h1>
      <p class="page-subtitle">Registro de ingresos y egresos del consultorio</p>
    </div>
    <div id="transactions-summary" style="margin-bottom: 1.5rem;"></div>
    <div class="card">
      <div id="transactions-table-container"></div>
    </div>
  `);

  const tableContainer = document.getElementById('transactions-table-container');

  tableInstance = new DataTable({
    container: tableContainer,
    columns,
    searchPlaceholder: 'Buscar transacciones...',
    onPageChange: (page) => loadTransactions(page),
    actions: `
      <button class="btn btn-primary" id="btn-new-transaction">+ Nueva transacción</button>
    `,
    exportable: true,
    exportFilename: 'transacciones',
  });

  tableInstance.render({ loading: true });
  loadTransactions();
  loadSummary();

  tableContainer.addEventListener('click', (e) => {
    if (e.target.id === 'btn-new-transaction') renderCreateModal();
  });
}

export default { render };
