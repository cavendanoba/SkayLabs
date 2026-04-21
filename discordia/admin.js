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
    { label: 'Ingresos',    value: `$${totalRevenue.toLocaleString('es-CO')}`, note: `· Admin: ${user}` },
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
      <td class="p-3 font-bold text-[#a0346e] text-sm">$${Number(item.price||0).toLocaleString('es-CO')}</td>
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
          class="flex-1 min-w-[200px] px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#ecd9ff]">
        <label class="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
          <input id="catalog-low-stock" type="checkbox" ${catalogUiState.lowStockOnly?'checked':''} class="w-3.5 h-3.5 accent-[#ecd9ff]">
          Solo stock bajo (≤ 5)
        </label>
        <span class="self-center text-xs text-gray-400">Mostrando ${filtered.length} de ${state.catalog.length}</span>
      </div>

      <div class="overflow-x-auto">
        <table class="min-w-full text-sm">
          <thead class="bg-[#fdf2f7]">
            <tr>
              <th class="p-3 text-left text-xs uppercase tracking-widest text-[#6d165a] font-semibold">ID</th>
              <th class="p-3 text-left text-xs uppercase tracking-widest text-[#6d165a] font-semibold">Producto</th>
              <th class="p-3 text-left text-xs uppercase tracking-widest text-[#6d165a] font-semibold">Precio</th>
              <th class="p-3 text-left text-xs uppercase tracking-widest text-[#6d165a] font-semibold">Stock</th>
              <th class="p-3 text-left text-xs uppercase tracking-widest text-[#6d165a] font-semibold">Categoría</th>
              <th class="p-3 text-left text-xs uppercase tracking-widest text-[#6d165a] font-semibold">Estado</th>
              <th class="p-3 text-left text-xs uppercase tracking-widest text-[#6d165a] font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody>
            ${rows || `<tr><td colspan="7" class="p-6 text-center text-gray-400">No hay productos que coincidan.</td></tr>`}
          </tbody>
        </table>
      </div>
    </article>`;

  panel.querySelector('#catalog-search').addEventListener('input', e => {
    catalogUiState.query = e.target.value;
    renderCatalogTab();
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
  const editing = productId != null;
  const product = editing ? state.catalog.find(p => Number(p.id) === productId) : null;

  const { value, isConfirmed } = await Swal.fire({
    title: editing ? 'Editar producto' : 'Agregar producto',
    html: `
      <input id="sw-name"     class="swal2-input" placeholder="Nombre *"      value="${product?.name||''}">
      <input id="sw-price"    class="swal2-input" placeholder="Precio *"      type="number" min="0" value="${product?.price??''}">
      <input id="sw-stock"    class="swal2-input" placeholder="Stock *"       type="number" min="0" value="${product?.stock??0}">
      <input id="sw-category" class="swal2-input" placeholder="Categoría *"   value="${product?.category||''}">
      <input id="sw-image"    class="swal2-input" placeholder="Ruta imagen (assets/xx.jpg)" value="${product?.image||'assets/default.png'}">
      <textarea id="sw-desc"  class="swal2-textarea" placeholder="Descripción">${product?.description||''}</textarea>`,
    showCancelButton: true,
    confirmButtonText: editing ? 'Guardar' : 'Agregar',
    confirmButtonColor: '#ecd9ff',
    preConfirm: () => {
      const name  = document.getElementById('sw-name').value.trim();
      const price = Number(document.getElementById('sw-price').value);
      const stock = Number(document.getElementById('sw-stock').value);
      const cat   = document.getElementById('sw-category').value.trim();
      if (!name || !cat || isNaN(price) || price < 0 || isNaN(stock) || stock < 0) {
        Swal.showValidationMessage('Nombre, precio, stock y categoría son obligatorios.');
        return false;
      }
      return {
        id:          productId,
        name, price, stock,
        category:    cat,
        image:       document.getElementById('sw-image').value.trim() || 'assets/default.png',
        description: document.getElementById('sw-desc').value.trim(),
        active:      true
      };
    }
  });

  if (!isConfirmed || !value) return;

  try {
    const method = editing ? 'PUT' : 'POST';
    const res    = await fetch('/api/discordia/products', {
      method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(value)
    });
    const json = await res.json();
    if (!json.ok) throw new Error(json.message);

    // Actualizar state local
    if (editing) {
      const idx = state.catalog.findIndex(p => Number(p.id) === productId);
      if (idx >= 0) state.catalog[idx] = json.data;
    } else {
      state.catalog.push(json.data);
    }
    saveToStorage(STORAGE_KEYS.catalog, state.catalog);
    renderSummary();
    renderCatalogTab();
    Swal.fire('Guardado', 'Catálogo actualizado.', 'success');
  } catch (err) {
    Swal.fire('Error', err.message || 'No se pudo guardar.', 'error');
  }
}

async function deactivateProduct(productId) {
  const product = state.catalog.find(p => Number(p.id) === productId);
  if (!product) return;

  const { isConfirmed } = await Swal.fire({
    title: '¿Desactivar producto?',
    text: product.name,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Desactivar',
    confirmButtonColor: '#ecd9ff'
  });
  if (!isConfirmed) return;

  try {
    await fetch('/api/discordia/products', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: productId })
    });
    state.catalog = state.catalog.filter(p => Number(p.id) !== productId);
    saveToStorage(STORAGE_KEYS.catalog, state.catalog);
    renderSummary();
    renderCatalogTab();
  } catch {
    Swal.fire('Error', 'No se pudo desactivar.', 'error');
  }
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
      <td class="p-3 font-bold text-[#a0346e] text-sm whitespace-nowrap">$${Number(c.total_spent||0).toLocaleString('es-CO')}</td>
      <td class="p-3">
        ${Number(c.total_debt||0) > 0
          ? `<span class="text-xs bg-amber-100 text-amber-700 font-semibold px-2 py-0.5 rounded-full">$${Number(c.total_debt).toLocaleString('es-CO')}</span>`
          : `<span class="text-xs text-gray-400">—</span>`}
      </td>
      <td class="p-3 text-xs text-gray-400">${c.last_purchase_at ? new Date(c.last_purchase_at).toLocaleDateString('es-CO') : '—'}</td>
    </tr>`).join('');

  panel.innerHTML = `
    <article class="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
      <div class="bg-gradient-to-r from-[#a0346e] to-[#ecd9ff] px-5 py-4">
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
    const res  = await fetch('/api/discordia-data');
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
