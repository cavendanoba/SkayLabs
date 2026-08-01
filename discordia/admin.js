// discordia/admin.js
// ─────────────────────────────────────────────────────────────
// Panel de administración de Discordia.
// 5 módulos: Dashboard · Catálogo · Ventas · Deudas · Clientes
//
// Arquitectura:
// - admin.js es el coordinador. Solo maneja tabs y nav.
// - Cada módulo vive en su propio archivo (dashboard.js, etc.)
//   y exporta una función renderXxx(container).
// - admin.js llama a esa función cuando el usuario activa el tab.
// ─────────────────────────────────────────────────────────────

import { requireAuth, getAdminUser, logout } from './auth.js';
import { renderDashboard }                   from './modules/dashboard.js';
import { renderVentas }                      from './modules/ventas.js';
import { renderDeudas }                      from './modules/deudas.js';
import { fetchProducts }                     from './products.js';
import { CONFIG }                            from './config.js';
import { formatCurrency }                    from './utils.js';

// ── GUARD ─────────────────────────────────────────────────────
requireAuth();

// ── ESTADO ────────────────────────────────────────────────────
let activeTab = 'dashboard';

const panel            = document.getElementById('admin-panel');
const summaryContainer = document.getElementById('admin-summary');
const tabButtons       = Array.from(document.querySelectorAll('.admin-tab-btn'));

// ── STORAGE (para compatibilidad con funciones heredadas) ─────
const STORAGE_KEYS = {
  catalog:   CONFIG.CATALOG_STORAGE_KEY   || 'skcCatalog',
  sales:     CONFIG.SALES_STORAGE_KEY     || 'skcSales',
  customers: CONFIG.CUSTOMERS_STORAGE_KEY || 'skcCustomers'
};

const state = {
  catalog:   loadFromStorage(STORAGE_KEYS.catalog,   []),
  sales:     loadFromStorage(STORAGE_KEYS.sales,     []),
  customers: loadFromStorage(STORAGE_KEYS.customers, [])
};

function loadFromStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

function saveToStorage(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

// ── TABS ──────────────────────────────────────────────────────
const TABS = [
  { id: 'dashboard', label: '📊 Dashboard',  icon: '📊' },
  { id: 'catalog',   label: '📦 Catálogo',   icon: '📦' },
  { id: 'sales',     label: '🛍️ Ventas',     icon: '🛍️' },
  { id: 'debts',     label: '⚠️ Deudas',     icon: '⚠️' },
  { id: 'customers', label: '👥 Clientes',   icon: '👥' },
];

function buildTabs() {
  const nav = document.getElementById('admin-tabs-nav');
  if (!nav) return;
  nav.innerHTML = TABS.map(t => `
    <button data-admin-tab="${t.id}"
      class="admin-tab-btn flex-none px-3 md:px-4 py-2.5 rounded-xl font-semibold text-sm transition whitespace-nowrap
             ${t.id === activeTab ? 'bg-[#6d165a] text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}">
      ${t.label}
    </button>`).join('');

  nav.querySelectorAll('.admin-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.adminTab));
  });
}

function updateTabStyles() {
  document.querySelectorAll('.admin-tab-btn').forEach(btn => {
    const isActive = btn.dataset.adminTab === activeTab;
    btn.className = `admin-tab-btn flex-none px-3 md:px-4 py-2.5 rounded-xl font-semibold text-sm transition whitespace-nowrap ${
      isActive ? 'bg-[#6d165a] text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
    }`;
  });
}

async function switchTab(tabId) {
  activeTab = tabId;
  updateTabStyles();
  panel.innerHTML = `<div class="animate-pulse bg-gray-100 rounded-2xl h-64"></div>`;

  switch (tabId) {
    case 'dashboard': await renderDashboard(panel);             break;
    case 'catalog':   renderCatalogTab();                       break;
    case 'sales':     await renderVentas(panel);                break;
    case 'debts':     await renderDeudas(panel);                break;
    case 'customers': renderCustomersTab();                     break;
  }
}

// ── RESUMEN (header KPIs) ─────────────────────────────────────
function renderSummary() {
  const totalStock   = state.catalog.reduce((s, p) => s + Number(p.stock || 0), 0);
  const totalSales   = state.sales.length;
  const totalRevenue = state.sales.reduce((s, v) => s + Number(v.total || 0), 0);
  const user         = getAdminUser();

  const cards = [
    { label: 'Productos',   value: state.catalog.length, note: 'en catálogo' },
    { label: 'Stock total', value: totalStock,            note: 'unidades disponibles' },
    { label: 'Ventas',      value: totalSales,            note: 'registradas' },
    { label: 'Ingresos',    value: formatCurrency(totalRevenue), note: `· Admin: ${user}` },
  ];

  if (summaryContainer) {
    summaryContainer.innerHTML = cards.map(c => `
      <article class="bg-white border border-gray-100 rounded-2xl p-4 md:p-5 shadow-sm">
        <p class="text-xs uppercase tracking-[0.15em] text-gray-500">${c.label}</p>
        <p class="text-2xl md:text-3xl font-bold text-[#6d165a] mt-2">${c.value}</p>
        <p class="text-sm text-gray-500 mt-1">${c.note}</p>
      </article>`).join('');
  }
}

// ── CATÁLOGO ──────────────────────────────────────────────────
const catalogUiState = { query: '', lowStockOnly: false };
let catalogDebounceTimer = null;

// Debounce helper para evitar re-renders frecuentes
function debounceCatalogRender() {
  clearTimeout(catalogDebounceTimer);
  catalogDebounceTimer = setTimeout(() => renderCatalogTab(), 300);
}

function renderCatalogTab() {
  const q        = catalogUiState.query.trim().toLowerCase();
  const filtered = state.catalog.filter(item => {
    const matchQ = !q || `${item.name} ${item.category||''} ${item.description||''}`.toLowerCase().includes(q);
    const matchS = !catalogUiState.lowStockOnly || Number(item.stock||0) <= 5;
    return matchQ && matchS;
  });

  const rows = filtered.map(item => `
    <tr class="border-b border-gray-100 hover:bg-[#fdf7fa]">
      <td class="p-3 text-center font-medium text-sm text-gray-500">${item.id}</td>
      <td class="p-3 text-center font-medium text-xs text-gray-500">${item.code||'—'}</td>
      <td class="p-3">
        <div class="flex items-center gap-3">
          <img src="${item.image||'./assets/default.png'}" alt="${item.name}"
            class="w-11 h-11 rounded-lg object-cover border border-gray-200"
            onerror="this.src='./assets/default.png';this.onerror=null;">
          <div>
            <p class="font-semibold text-gray-900 text-sm leading-tight">${item.name}</p>
            <p class="text-xs text-gray-400 mt-0.5 truncate max-w-[200px]">${item.description||'Sin descripción'}</p>
          </div>
        </div>
      </td>
      <td class="p-3 font-bold text-[#a0346e] text-sm">${formatCurrency(Number(item.price||0))}</td>
      <td class="p-3">
        <span class="text-sm font-semibold ${Number(item.stock)<=3?'text-rose-600':Number(item.stock)<=5?'text-amber-600':'text-gray-800'}">${item.stock}</span>
      </td>
      <td class="p-3 text-sm text-gray-600">${item.category||'—'}</td>
      <td class="p-3">
        <span class="text-xs px-2 py-0.5 rounded-full font-semibold ${item.active!==false?'bg-emerald-100 text-emerald-700':'bg-gray-100 text-gray-500'}">
          ${item.active!==false?'Activo':'Inactivo'}
        </span>
      </td>
      <td class="p-3">
        <div class="flex gap-2">
          <button class="edit-product px-3 py-1.5 rounded-lg bg-amber-100 text-amber-800 font-semibold text-xs hover:bg-amber-200 transition" data-id="${item.id}">Editar</button>
          <button class="delete-product px-3 py-1.5 rounded-lg bg-rose-100 text-rose-700 font-semibold text-xs hover:bg-rose-200 transition" data-id="${item.id}">Desactivar</button>
        </div>
      </td>
    </tr>`).join('');

  panel.innerHTML = `
    <article class="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
      <div class="bg-gradient-to-r from-[#6d165a] to-[#a0346e] px-5 py-4 flex flex-wrap items-center justify-between gap-3">
        <h3 class="font-bold text-white text-lg" style="font-family:'Playfair Display',serif">📦 Catálogo de productos</h3>
        <button id="add-product"
          class="px-4 py-2 bg-white/20 hover:bg-white/30 text-white text-sm font-semibold rounded-xl transition flex items-center gap-2">
          + Agregar producto
        </button>
      </div>

      <div class="p-4 border-b border-gray-100 flex flex-wrap gap-3">
        <input id="catalog-search" value="${catalogUiState.query}"
          placeholder="Buscar por nombre, categoría o descripción..."
          class="flex-1 min-w-[200px] px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#9d5fa5]">
        <label class="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
          <input id="catalog-low-stock" type="checkbox" ${catalogUiState.lowStockOnly?'checked':''} class="w-3.5 h-3.5 accent-[#9d5fa5]">
          Solo stock bajo (≤ 5)
        </label>
        <span class="self-center text-xs text-gray-400">Mostrando ${filtered.length} de ${state.catalog.length}</span>
      </div>

      <div class="overflow-x-auto">
        <table class="min-w-full text-sm">
          <thead class="bg-[#fdf2f7]">
            <tr>
              <th class="p-3 text-left text-xs uppercase tracking-widest text-[#6d165a] font-semibold">ID</th>
              <th class="p-3 text-left text-xs uppercase tracking-widest text-[#6d165a] font-semibold">Código</th>
              <th class="p-3 text-left text-xs uppercase tracking-widest text-[#6d165a] font-semibold">Producto</th>
              <th class="p-3 text-left text-xs uppercase tracking-widest text-[#6d165a] font-semibold">Precio</th>
              <th class="p-3 text-left text-xs uppercase tracking-widest text-[#6d165a] font-semibold">Stock</th>
              <th class="p-3 text-left text-xs uppercase tracking-widest text-[#6d165a] font-semibold">Categoría</th>
              <th class="p-3 text-left text-xs uppercase tracking-widest text-[#6d165a] font-semibold">Estado</th>
              <th class="p-3 text-left text-xs uppercase tracking-widest text-[#6d165a] font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody>
            ${rows || `<tr><td colspan="8" class="p-6 text-center text-gray-400">No hay productos que coincidan.</td></tr>`}
          </tbody>
        </table>
      </div>
    </article>`;

  panel.querySelector('#catalog-search').addEventListener('input', e => {
    catalogUiState.query = e.target.value;
    debounceCatalogRender();
  });
  panel.querySelector('#catalog-low-stock').addEventListener('change', e => {
    catalogUiState.lowStockOnly = e.target.checked;
    renderCatalogTab();
  });
  panel.querySelector('#add-product').addEventListener('click', () => showProductModal(null));
  panel.querySelectorAll('.edit-product').forEach(btn => btn.addEventListener('click', () => showProductModal(Number(btn.dataset.id))));
  panel.querySelectorAll('.delete-product').forEach(btn => btn.addEventListener('click', () => deactivateProduct(Number(btn.dataset.id))));
}

// ── MODAL PRODUCTO ────────────────────────────────────────────
async function showProductModal(productId) {
  return new Promise((resolve) => {
    const editing = productId != null;
    const product = editing ? state.catalog.find(p => Number(p.id) === productId) : null;

    // Crear overlay y modal
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4';
    overlay.style.animation = 'fadeIn 0.2s ease-out';

    const modal = document.createElement('div');
    modal.className = 'bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto';
    modal.style.animation = 'slideUp 0.3s ease-out';

    modal.innerHTML = `
      <style>
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .error-msg { color: #dc2626; font-size: 0.875rem; margin-top: 4px; display: none; }
        .input-error { border-color: #dc2626 !important; }
        .success-toast { 
          position: fixed; top: 20px; right: 20px; 
          background: #10b981; color: white; 
          padding: 12px 20px; border-radius: 8px; 
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
          animation: slideInRight 0.3s ease-out;
          z-index: 60;
        }
        @keyframes slideInRight { 
          from { transform: translateX(400px); } 
          to { transform: translateX(0); } 
        }
      </style>

      <!-- Header -->
      <div class="bg-gradient-to-r from-[#6d165a] to-[#9d5fa5] px-6 py-5 flex items-center justify-between">
        <h2 class="text-xl font-bold text-white" style="font-family: 'Playfair Display', serif;">
          ${editing ? '✏️ Editar Producto' : '➕ Nuevo Producto'}
        </h2>
        <button class="close-modal text-white hover:bg-white/20 p-2 rounded-lg transition">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>

      <!-- Content -->
      <div class="p-6 space-y-5">
        <!-- Nombre -->
        <div>
          <label class="block text-sm font-semibold text-[#6d165a] mb-2">Nombre del Producto *</label>
          <input type="text" id="modal-name" placeholder="Ej: Labial Rojo Pasión" 
            value="${product?.name||''}" 
            class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-[#9d5fa5] focus:ring-2 focus:ring-[#9d5fa5]/20 transition">
          <div class="error-msg" id="error-name"></div>
        </div>

        <!-- Código y Categoría -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-semibold text-[#6d165a] mb-2">Código</label>
            <input type="text" id="modal-code" placeholder="Ej: PROD001" 
              value="${product?.code||''}" 
              class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-[#9d5fa5] focus:ring-2 focus:ring-[#9d5fa5]/20 transition">
          </div>
          <div>
            <label class="block text-sm font-semibold text-[#6d165a] mb-2">Categoría *</label>
            <input type="text" id="modal-category" placeholder="Ej: Maquillaje" 
              value="${product?.category||''}" 
              class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-[#9d5fa5] focus:ring-2 focus:ring-[#9d5fa5]/20 transition">
            <div class="error-msg" id="error-category"></div>
          </div>
        </div>

        <!-- Precio y Stock -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-semibold text-[#6d165a] mb-2">Precio (COP) *</label>
            <input type="number" id="modal-price" placeholder="0" min="0" 
              value="${product?.price??''}" 
              class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-[#9d5fa5] focus:ring-2 focus:ring-[#9d5fa5]/20 transition">
            <div class="error-msg" id="error-price"></div>
          </div>
          <div>
            <label class="block text-sm font-semibold text-[#6d165a] mb-2">Stock *</label>
            <input type="number" id="modal-stock" placeholder="0" min="0" 
              value="${product?.stock??0}" 
              class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-[#9d5fa5] focus:ring-2 focus:ring-[#9d5fa5]/20 transition">
            <div class="error-msg" id="error-stock"></div>
          </div>
        </div>

        <!-- Imagen -->
        <div>
          <label class="block text-sm font-semibold text-[#6d165a] mb-2">Ruta de Imagen</label>
          <input type="text" id="modal-image" placeholder="assets/producto.jpg" 
            value="${product?.image||'assets/default.png'}" 
            class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-[#9d5fa5] focus:ring-2 focus:ring-[#9d5fa5]/20 transition">
          <p class="text-xs text-gray-500 mt-1.5">Ej: assets/labial-rojo.jpg o URL externa</p>
        </div>

        <!-- Descripción -->
        <div>
          <label class="block text-sm font-semibold text-[#6d165a] mb-2">Descripción</label>
          <textarea id="modal-description" placeholder="Describe el producto, ingredientes, beneficios..." 
            rows="4"
            class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-[#9d5fa5] focus:ring-2 focus:ring-[#9d5fa5]/20 transition resize-none">${product?.description||''}</textarea>
        </div>

        <!-- Mensaje de error general -->
        <div class="error-msg bg-red-50 px-4 py-3 rounded-lg border border-red-200" id="error-general"></div>
      </div>

      <!-- Footer -->
      <div class="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t border-gray-100">
        <button class="close-modal px-5 py-2.5 text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition">
          Cancelar
        </button>
        <button class="save-product px-5 py-2.5 bg-gradient-to-r from-[#6d165a] to-[#9d5fa5] text-white font-semibold rounded-lg hover:shadow-lg transition flex items-center gap-2">
          <span class="save-text">${editing ? '💾 Guardar Cambios' : '➕ Agregar Producto'}</span>
          <span class="save-loader hidden">
            <svg class="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle class="opacity-25" cx="12" cy="12" r="10"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </span>
        </button>
      </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Elementos del modal
    const nameInput = modal.querySelector('#modal-name');
    const codeInput = modal.querySelector('#modal-code');
    const categoryInput = modal.querySelector('#modal-category');
    const priceInput = modal.querySelector('#modal-price');
    const stockInput = modal.querySelector('#modal-stock');
    const imageInput = modal.querySelector('#modal-image');
    const descInput = modal.querySelector('#modal-description');
    const saveBtn = modal.querySelector('.save-product');
    const closeBtn = modal.querySelectorAll('.close-modal');
    const saveLoader = modal.querySelector('.save-loader');
    const saveText = modal.querySelector('.save-text');

    // Cerrar modal
    const closeModal = () => {
      overlay.style.animation = 'fadeOut 0.2s ease-out';
      modal.style.animation = 'slideDown 0.3s ease-out';
      setTimeout(() => {
        overlay.remove();
        resolve();
      }, 300);
    };

    closeBtn.forEach(btn => btn.addEventListener('click', closeModal));
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal();
    });

    // Validación
    const clearError = (fieldId) => {
      const errorEl = modal.querySelector(`#error-${fieldId}`);
      if (errorEl) errorEl.style.display = 'none';
      const input = modal.querySelector(`#modal-${fieldId}`);
      if (input) input.classList.remove('input-error');
    };

    const showError = (fieldId, message) => {
      const errorEl = modal.querySelector(`#error-${fieldId}`);
      if (errorEl) {
        errorEl.textContent = message;
        errorEl.style.display = 'block';
      }
      const input = modal.querySelector(`#modal-${fieldId}`);
      if (input) input.classList.add('input-error');
    };

    // Guardar
    saveBtn.addEventListener('click', async () => {
      // Limpiar errores previos
      ['name', 'category', 'price', 'stock'].forEach(f => clearError(f));
      modal.querySelector('#error-general').style.display = 'none';

      // Validar
      const name = nameInput.value.trim();
      const category = categoryInput.value.trim();
      const price = Number(priceInput.value);
      const stock = Number(stockInput.value);

      let hasError = false;
      if (!name) { showError('name', 'El nombre es obligatorio'); hasError = true; }
      if (!category) { showError('category', 'La categoría es obligatoria'); hasError = true; }
      if (isNaN(price) || price < 0) { showError('price', 'Ingresa un precio válido'); hasError = true; }
      if (isNaN(stock) || stock < 0) { showError('stock', 'Ingresa un stock válido'); hasError = true; }

      if (hasError) return;

      // Preparar datos
      const payload = {
        id: productId,
        name,
        code: codeInput.value.trim() || null,
        price,
        stock,
        category,
        image: imageInput.value.trim() || 'assets/default.png',
        description: descInput.value.trim(),
        active: true
      };

      // Enviar
      saveBtn.disabled = true;
      saveLoader.classList.remove('hidden');
      saveText.textContent = editing ? 'Guardando...' : 'Agregando...';

      try {
        const method = editing ? 'PUT' : 'POST';
        const res = await fetch('/api/discordia/products', {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const json = await res.json();
        if (!json.ok) throw new Error(json.message);

        // Actualizar state
        if (editing) {
          const idx = state.catalog.findIndex(p => Number(p.id) === productId);
          if (idx >= 0) state.catalog[idx] = json.data;
        } else {
          state.catalog.push(json.data);
        }
        saveToStorage(STORAGE_KEYS.catalog, state.catalog);
        renderSummary();
        renderCatalogTab();

        // Toast de éxito
        const toast = document.createElement('div');
        toast.className = 'success-toast';
        toast.textContent = editing ? '✓ Producto actualizado correctamente' : '✓ Producto agregado correctamente';
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);

        closeModal();
      } catch (err) {
        const errorEl = modal.querySelector('#error-general');
        errorEl.textContent = err.message || 'No se pudo guardar el producto';
        errorEl.style.display = 'block';
      } finally {
        saveBtn.disabled = false;
        saveLoader.classList.add('hidden');
        saveText.textContent = editing ? '💾 Guardar Cambios' : '➕ Agregar Producto';
      }
    });

    // Focus al nombre
    nameInput.focus();
  });
}

async function deactivateProduct(productId) {
  return new Promise((resolve) => {
    const product = state.catalog.find(p => Number(p.id) === productId);
    if (!product) return resolve();

    // Crear modal de confirmación
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4';
    overlay.style.animation = 'fadeIn 0.2s ease-out';

    const modal = document.createElement('div');
    modal.className = 'bg-white rounded-2xl shadow-2xl w-full max-w-md';
    modal.style.animation = 'slideUp 0.3s ease-out';

    modal.innerHTML = `
      <style>
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      </style>

      <!-- Header de advertencia -->
      <div class="bg-gradient-to-r from-orange-500 to-red-500 px-6 py-5 flex items-center justify-between">
        <h3 class="text-lg font-bold text-white flex items-center gap-2">
          ⚠️ Desactivar Producto
        </h3>
      </div>

      <!-- Content -->
      <div class="p-6 space-y-4">
        <p class="text-gray-600">¿Estás seguro de que deseas desactivar este producto?</p>
        
        <div class="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p class="text-sm font-semibold text-amber-900">${product.name}</p>
          <p class="text-xs text-amber-700 mt-1">SKU: ${product.code || 'Sin código'}</p>
          <p class="text-xs text-amber-700">Precio: $${Number(product.price).toLocaleString('es-CO')}</p>
        </div>

        <p class="text-sm text-gray-500 italic">
          El producto será ocultado del catálogo, pero los datos se mantendrán en el sistema.
        </p>
      </div>

      <!-- Footer -->
      <div class="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t border-gray-100">
        <button class="cancel-btn px-5 py-2.5 text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition">
          Cancelar
        </button>
        <button class="confirm-delete px-5 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-lg hover:shadow-lg transition flex items-center gap-2">
          <span class="delete-text">🗑️ Desactivar</span>
          <span class="delete-loader hidden">
            <svg class="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle class="opacity-25" cx="12" cy="12" r="10"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </span>
        </button>
      </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    const cancelBtn = modal.querySelector('.cancel-btn');
    const deleteBtn = modal.querySelector('.confirm-delete');
    const deleteLoader = modal.querySelector('.delete-loader');
    const deleteText = modal.querySelector('.delete-text');

    const closeModal = () => {
      overlay.style.animation = 'fadeOut 0.2s ease-out';
      modal.style.animation = 'slideDown 0.3s ease-out';
      setTimeout(() => {
        overlay.remove();
        resolve();
      }, 300);
    };

    cancelBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal();
    });

    deleteBtn.addEventListener('click', async () => {
      deleteBtn.disabled = true;
      deleteLoader.classList.remove('hidden');
      deleteText.textContent = 'Desactivando...';

      try {
        await fetch('/api/discordia/products', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: productId })
        });

        state.catalog = state.catalog.filter(p => Number(p.id) !== productId);
        saveToStorage(STORAGE_KEYS.catalog, state.catalog);
        renderSummary();
        renderCatalogTab();

        // Toast de éxito
        const toast = document.createElement('div');
        toast.className = 'fixed top-5 right-5 bg-green-500 text-white px-5 py-3 rounded-lg shadow-lg';
        toast.textContent = '✓ Producto desactivado correctamente';
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);

        closeModal();
      } catch (err) {
        alert('Error al desactivar: ' + (err.message || 'Intenta de nuevo'));
        deleteBtn.disabled = false;
        deleteLoader.classList.add('hidden');
        deleteText.textContent = '🗑️ Desactivar';
      }
    });
  });
}

// ── CLIENTES ──────────────────────────────────────────────────
function renderCustomersTab() {
  const customers = state.customers.slice()
    .sort((a,b) => Number(b.total_spent||0) - Number(a.total_spent||0));

  const rows = customers.map(c => `
    <tr class="border-b border-gray-100 hover:bg-[#fdf7fa]">
      <td class="p-3">
        <p class="font-semibold text-gray-900 text-sm">${c.name||'Sin nombre'}</p>
        <p class="text-xs text-gray-400">${c.city||'—'}</p>
      </td>
      <td class="p-3 text-sm text-gray-600">${c.phone||'—'}</td>
      <td class="p-3 text-sm text-gray-600">${c.email||'—'}</td>
      <td class="p-3 text-center text-sm">${Number(c.order_count||0)}</td>
      <td class="p-3 font-bold text-[#a0346e] text-sm whitespace-nowrap">${formatCurrency(Number(c.total_spent||0))}</td>
      <td class="p-3">
        ${Number(c.total_debt||0) > 0
          ? `<span class="text-xs bg-amber-100 text-amber-700 font-semibold px-2 py-0.5 rounded-full">${formatCurrency(Number(c.total_debt))}</span>`
          : `<span class="text-xs text-gray-400">—</span>`}
      </td>
      <td class="p-3 text-xs text-gray-400">${c.last_purchase_at ? new Date(c.last_purchase_at).toLocaleDateString('es-CO') : '—'}</td>
    </tr>`).join('');

  panel.innerHTML = `
    <article class="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
      <div class="bg-gradient-to-r from-[#a0346e] to-[#9d5fa5] px-5 py-4">
        <h3 class="font-bold text-white text-lg" style="font-family:'Playfair Display',serif">👥 Clientes</h3>
        <p class="text-white/70 text-xs mt-0.5">${customers.length} registrados · Ordenados por total comprado</p>
      </div>
      <div class="overflow-x-auto">
        <table class="min-w-full text-sm">
          <thead class="bg-[#fdf2f7]">
            <tr>
              <th class="p-3 text-left text-xs uppercase tracking-widest text-[#6d165a] font-semibold">Cliente</th>
              <th class="p-3 text-left text-xs uppercase tracking-widest text-[#6d165a] font-semibold">Teléfono</th>
              <th class="p-3 text-left text-xs uppercase tracking-widest text-[#6d165a] font-semibold">Email</th>
              <th class="p-3 text-center text-xs uppercase tracking-widest text-[#6d165a] font-semibold">Órdenes</th>
              <th class="p-3 text-left text-xs uppercase tracking-widest text-[#6d165a] font-semibold">Total comprado</th>
              <th class="p-3 text-left text-xs uppercase tracking-widest text-[#6d165a] font-semibold">Deuda</th>
              <th class="p-3 text-left text-xs uppercase tracking-widest text-[#6d165a] font-semibold">Última compra</th>
            </tr>
          </thead>
          <tbody>
            ${rows || `<tr><td colspan="7" class="p-6 text-center text-gray-400">Sin clientes registrados aún.</td></tr>`}
          </tbody>
        </table>
      </div>
    </article>`;
}

// ── LOGOUT BUTTON ─────────────────────────────────────────────
const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) logoutBtn.addEventListener('click', logout);

// ── INIT ──────────────────────────────────────────────────────
async function init() {
  // Hidratar state desde la API antes de renderizar
  try {
    const res  = await fetch(CONFIG.ADMIN_API_PATH);
    const json = await res.json();
    if (json.ok) {
      state.catalog   = json.data.catalog   || state.catalog;
      state.sales     = json.data.sales     || state.sales;
      state.customers = json.data.customers || state.customers;
      saveToStorage(STORAGE_KEYS.catalog,   state.catalog);
      saveToStorage(STORAGE_KEYS.sales,     state.sales);
      saveToStorage(STORAGE_KEYS.customers, state.customers);
    }
  } catch { /* usar datos locales como fallback */ }

  buildTabs();
  renderSummary();
  await switchTab('dashboard');
}

init();
