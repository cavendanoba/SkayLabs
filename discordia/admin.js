// discordia/admin.js
// ─────────────────────────────────────────────────────────────
// Panel de administración de Discordia, con estilo de tablero.
// Secciones: Resumen · Catálogo · Ventas · Deudas · Clientes
//
// - admin.js arma la estructura (barra lateral, encabezado, tema)
//   y las vistas de Catálogo y Clientes.
// - Resumen, Ventas y Deudas viven en /discordia/modules/.
// ─────────────────────────────────────────────────────────────

import { requireAuth, getAdminUser, logout } from '/discordia/auth.js?v=2';
import { renderDashboard }                   from '/discordia/modules/dashboard.js?v=5';
import { renderVentas }                      from '/discordia/modules/ventas.js?v=9';
import { renderDeudas }                      from '/discordia/modules/deudas.js?v=5';
import { CONFIG }                            from '/discordia/config.js';
import { formatCurrency }                    from '/discordia/utils.js';
import { esc, foto, toast, NOMBRES_CATEGORIA, COLOR_CATEGORIA, esProductoReal, sinFoto, ICONOS, enOferta, pctOferta } from '/discordia/modules/ui.js?v=4';

const nombreCategoria = c => NOMBRES_CATEGORIA[c] || c || 'Sin categoría';

// ── ESTADO ────────────────────────────────────────────────────
let activeTab = 'dashboard';
let panel = null;

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

// ── NAVEGACIÓN ────────────────────────────────────────────────
const TABS = [
  { id: 'dashboard', label: 'Resumen',  title: 'Resumen',  sub: 'Cómo va Discordia' },
  { id: 'catalog',   label: 'Catálogo', title: 'Catálogo', sub: 'Productos, precios e inventario' },
  { id: 'offers',    label: 'Ofertas',  title: 'Ofertas',  sub: 'Descuentos que se ven en el catálogo' },
  { id: 'sales',     label: 'Ventas',   title: 'Ventas',   sub: 'Historial y registro de ventas' },
  { id: 'debts',     label: 'Deudas',   title: 'Deudas',   sub: 'Saldos pendientes y abonos' },
  { id: 'customers', label: 'Clientes', title: 'Clientes', sub: 'Quién compra y cuánto' },
];

function counts() {
  const productos = state.catalog.filter(esProductoReal);
  const agotados = productos.filter(p => p.active !== false && Number(p.stock) <= 0).length;
  const pendientes = state.sales.filter(s => s.payment_status === 'pending').length;
  return {
    catalog:   { n: agotados, warn: agotados > 0, title: `${agotados} agotados` },
    debts:     { n: pendientes, warn: pendientes > 0, title: `${pendientes} ventas por cobrar` },
    customers: { n: state.customers.length, title: `${state.customers.length} clientes` },
    offers:    { n: productos.filter(enOferta).length, title: 'productos en oferta' },
  };
}

function buildTabs() {
  const nav = document.getElementById('admin-tabs-nav');
  const c = counts();
  nav.innerHTML = TABS.map(t => {
    const k = c[t.id];
    const badge = k && k.n ? `<span class="count${k.warn ? ' warn' : ''}" title="${k.title}">${k.n}</span>` : '';
    return `<button type="button" class="nav-btn${t.id === activeTab ? ' is-active' : ''}" data-admin-tab="${t.id}"
      ${t.id === activeTab ? 'aria-current="page"' : ''}>${ICONOS[t.id]}${t.label}${badge}</button>`;
  }).join('');
  nav.querySelectorAll('[data-admin-tab]').forEach(btn =>
    btn.addEventListener('click', () => switchTab(btn.dataset.adminTab)));
}

export function refreshCounts() {
  buildTabs();
  pintarHoy();
}

export async function switchTab(tabId, opciones = {}) {
  activeTab = tabId;
  const tab = TABS.find(t => t.id === tabId) || TABS[0];
  document.getElementById('page-title').textContent = tab.title;
  document.getElementById('page-sub').textContent = tab.sub;
  document.title = `${tab.title} — DISCORDIA Admin`;
  document.body.classList.remove('nav-open');
  buildTabs();
  panel.innerHTML = `<div class="skeleton" style="height:140px"></div><div class="skeleton" style="height:320px"></div>`;
  window.scrollTo({ top: 0 });

  switch (tabId) {
    case 'dashboard': await renderDashboard(panel, { state, goTo: switchTab, user: getAdminUser() }); break;
    case 'catalog':   Object.assign(catalogUiState, opciones); renderCatalogTab(); break;
    case 'sales':     await renderVentas(panel); break;
    case 'debts':     await renderDeudas(panel); break;
    case 'customers': renderCustomersTab(); break;
    case 'offers':    renderOffersTab(); break;
  }
}

// Mini resumen de hoy en la barra lateral
function pintarHoy() {
  const box = document.getElementById('side-today');
  if (!box) return;
  const hoy = new Date().toDateString();
  const ventasHoy = state.sales.filter(s => new Date(s.created_at).toDateString() === hoy);
  const total = ventasHoy.reduce((s, v) => s + Number(v.total || 0), 0);
  const productos = state.catalog.filter(p => esProductoReal(p) && p.active !== false);
  const conFoto = productos.filter(p => !sinFoto(p)).length;
  const pct = productos.length ? Math.round(conFoto / productos.length * 100) : 0;
  const C = 2 * Math.PI * 19;
  box.hidden = false;
  box.innerHTML = `
    <div class="gring" title="${conFoto} de ${productos.length} productos activos con foto">
      <svg viewBox="0 0 46 46"><circle class="track" cx="23" cy="23" r="19" stroke-width="5"/>
        <circle class="val" cx="23" cy="23" r="19" stroke-width="5" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - pct / 100)}"/></svg>
      <em>${pct}%</em>
    </div>
    <div><span>Hoy</span><b class="num">${formatCurrency(total)}</b><span>${ventasHoy.length} venta${ventasHoy.length !== 1 ? 's' : ''} · ${pct}% con foto</span></div>`;
}

// ── CATÁLOGO ──────────────────────────────────────────────────
const catalogUiState = { query: '', categoria: 'all', filtro: 'all', showInactive: false, orden: 'name', dir: 1 };
let catalogDebounceTimer = null;

function debounceCatalogRender() {
  clearTimeout(catalogDebounceTimer);
  catalogDebounceTimer = setTimeout(() => renderCatalogTab(true), 250);
}

const FILTROS = {
  all:     { label: 'Todos',      fn: () => true },
  low:     { label: 'Última unidad', fn: p => Number(p.stock) === 1 },
  out:     { label: 'Agotados',   fn: p => Number(p.stock) <= 0 },
  nophoto: { label: 'Sin foto',   fn: sinFoto },
  noprice: { label: 'Sin precio', fn: p => !Number(p.price) },
  sale:    { label: 'En oferta',  fn: enOferta },
};

function renderCatalogTab(soloTabla = false) {
  const ui = catalogUiState;
  const q = ui.query.trim().toLowerCase();
  const productos = state.catalog.filter(esProductoReal);
  const categorias = [...new Set(productos.map(p => p.category).filter(Boolean))]
    .sort((a, b) => nombreCategoria(a).localeCompare(nombreCategoria(b)));

  const filtered = productos.filter(item => {
    const matchQ = !q || `${item.name} ${item.code || ''} ${item.brand || ''} ${nombreCategoria(item.category)} ${item.description || ''}`.toLowerCase().includes(q);
    const matchC = ui.categoria === 'all' || item.category === ui.categoria;
    const matchF = (FILTROS[ui.filtro] || FILTROS.all).fn(item);
    const matchA = ui.showInactive || ui.filtro === 'noprice' || item.active !== false;
    return matchQ && matchC && matchF && matchA;
  }).sort((a, b) => {
    const k = ui.orden;
    const va = k === 'name' ? String(a.name || '') : Number(a[k] || 0);
    const vb = k === 'name' ? String(b.name || '') : Number(b[k] || 0);
    return (k === 'name' ? va.localeCompare(vb) : va - vb) * ui.dir;
  });

  const maxStock = Math.max(5, ...productos.map(p => Number(p.stock) || 0));
  const rows = filtered.map(item => {
    const stock = Number(item.stock) || 0;
    const nivel = stock <= 0 ? 'out' : stock === 1 ? 'low' : '';
    const activo = item.active !== false;
    return `
    <tr class="${activo ? '' : 'off'}">
      <td class="full">
        <div class="prod">
          <img class="thumb" src="${esc(foto(item.image))}" alt="" loading="lazy" onerror="this.src='./assets/default.png';this.onerror=null;">
          <div><b>${esc(item.name)}</b><span>${esc(item.brand || '')}${item.brand && item.description ? ' · ' : ''}${esc(item.description || (item.brand ? '' : 'Sin descripción'))}</span></div>
        </div>
      </td>
      <td class="code" data-label="Código">${esc(item.code || '—')}</td>
      <td data-label="Categoría"><span class="pill cat" style="--dot:${COLOR_CATEGORIA[item.category] || 'var(--c-other)'}">${esc(nombreCategoria(item.category))}</span></td>
      <td class="r money" data-label="Precio">${!Number(item.price) ? '<span class="pill warn">Sin precio</span>'
        : enOferta(item) ? `<span class="pill sale">-${pctOferta(item)}%</span> ${formatCurrency(Number(item.price))}<div class="antes">${formatCurrency(Number(item.reference_price))}</div>`
        : formatCurrency(Number(item.price))}</td>
      <td data-label="Stock"><div class="stock ${nivel}"><span class="num">${stock}</span><div class="hbar"><i style="width:${Math.min(100, stock / maxStock * 100)}%"></i></div></div></td>
      <td data-label="Estado">${activo ? '<span class="pill good">Activo</span>' : '<span class="pill mute">Inactivo</span>'}</td>
      <td>
        <div class="actions">
          <button class="btn sm edit-product" type="button" data-id="${item.id}">${ICONOS.edit}Editar</button>
          <button class="btn sm icon ${activo ? 'danger' : 'ok'} delete-product" type="button" data-id="${item.id}"
            title="${activo ? 'Desactivar' : 'Reactivar'}" aria-label="${activo ? 'Desactivar' : 'Reactivar'} ${esc(item.name)}">${activo ? ICONOS.off : ICONOS.on}</button>
        </div>
      </td>
    </tr>`;
  }).join('');

  const flecha = k => ui.orden === k ? (ui.dir > 0 ? ' ↑' : ' ↓') : '';
  const tabla = `
    <table class="tbl stack">
      <thead><tr>
        <th class="th-sort" data-orden="name">Producto${flecha('name')}</th>
        <th>Código</th>
        <th>Categoría</th>
        <th class="r th-sort" data-orden="price">Precio${flecha('price')}</th>
        <th class="th-sort" data-orden="stock">Stock${flecha('stock')}</th>
        <th>Estado</th>
        <th class="r">Acciones</th>
      </tr></thead>
      <tbody>${rows || `<tr><td colspan="7" class="full"><div class="empty"><b>No hay productos que coincidan</b>Prueba con otra búsqueda o quita los filtros.</div></td></tr>`}</tbody>
    </table>`;

  if (soloTabla && panel.querySelector('#catalog-table')) {
    panel.querySelector('#catalog-table').innerHTML = tabla;
    panel.querySelector('#catalog-meta').textContent = `${filtered.length} de ${productos.length}`;
    wireCatalogTable();
    return;
  }

  const activos = productos.filter(p => p.active !== false);
  const unidades = activos.reduce((s, p) => s + (Number(p.stock) || 0), 0);
  const valor = activos.reduce((s, p) => s + (Number(p.stock) || 0) * (Number(p.price) || 0), 0);

  panel.innerHTML = `
    <section class="dgrid kpis">
      <article class="card span-3 kpi"><div class="kpi-label">Productos activos</div><div class="kpi-value num">${activos.length}</div><div class="kpi-foot">${productos.length - activos.length} inactivos</div></article>
      <article class="card span-3 kpi"><div class="kpi-label">Unidades en inventario</div><div class="kpi-value num">${unidades}</div><div class="kpi-foot">en productos activos</div></article>
      <article class="card span-3 kpi"><div class="kpi-label">Valor a precio de venta</div><div class="kpi-value num">${formatCurrency(valor)}</div><div class="kpi-foot">stock × precio</div></article>
      <article class="card span-3 kpi"><div class="kpi-label">Sin foto</div><div class="kpi-value num">${activos.filter(sinFoto).length}</div><div class="kpi-foot">productos activos</div></article>
    </section>
    <article class="card flush">
      <div class="toolbar">
        <label class="search">${ICONOS.search}
          <input id="catalog-search" class="input" type="search" value="${esc(ui.query)}" placeholder="Buscar por nombre, código, marca o categoría" aria-label="Buscar productos">
        </label>
        <select id="catalog-cat" class="input" aria-label="Categoría">
          <option value="all">Todas las categorías</option>
          ${categorias.map(c => `<option value="${esc(c)}" ${ui.categoria === c ? 'selected' : ''}>${esc(nombreCategoria(c))}</option>`).join('')}
        </select>
        <button id="add-product" class="btn primary" type="button">${ICONOS.plus}Agregar producto</button>
      </div>
      <div class="toolbar">
        <div class="seg" role="group" aria-label="Filtro rápido">
          ${Object.entries(FILTROS).map(([k, f]) => `<button type="button" data-filtro="${k}" class="${ui.filtro === k ? 'is-on' : ''}" aria-pressed="${ui.filtro === k}">${f.label}</button>`).join('')}
        </div>
        <label class="check"><input id="catalog-show-inactive" type="checkbox" ${ui.showInactive ? 'checked' : ''}> Mostrar desactivados</label>
        <span class="meta" id="catalog-meta">${filtered.length} de ${productos.length}</span>
      </div>
      <div class="table-wrap" id="catalog-table">${tabla}</div>
    </article>`;

  panel.querySelector('#catalog-search').addEventListener('input', e => { ui.query = e.target.value; debounceCatalogRender(); });
  panel.querySelector('#catalog-cat').addEventListener('change', e => { ui.categoria = e.target.value; renderCatalogTab(true); });
  panel.querySelector('#catalog-show-inactive').addEventListener('change', e => { ui.showInactive = e.target.checked; renderCatalogTab(true); });
  panel.querySelectorAll('[data-filtro]').forEach(b => b.addEventListener('click', () => {
    ui.filtro = b.dataset.filtro;
    panel.querySelectorAll('[data-filtro]').forEach(x => { x.classList.toggle('is-on', x === b); x.setAttribute('aria-pressed', x === b); });
    renderCatalogTab(true);
  }));
  panel.querySelector('#add-product').addEventListener('click', () => showProductModal(null));
  wireCatalogTable();
}

function wireCatalogTable() {
  panel.querySelectorAll('.th-sort').forEach(th => th.addEventListener('click', () => {
    const k = th.dataset.orden;
    catalogUiState.dir = catalogUiState.orden === k ? -catalogUiState.dir : 1;
    catalogUiState.orden = k;
    renderCatalogTab(true);
  }));
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
        <h2 class="text-xl font-bold text-white" >
          ${editing ? '✏️ Editar Producto' : '➕ Nuevo Producto'}
        </h2>
        <button class="close-modal text-white hover:bg-white/20 p-2 rounded-lg transition">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>

      <!-- Content -->
      <div class="p-6 space-y-5" onclick="event.stopPropagation()">
        <!-- Nombre -->
        <div>
          <label class="block text-sm font-semibold text-[#6d165a] mb-2">Nombre del Producto *</label>
          <input type="text" id="modal-name" placeholder="Ej: Labial Rojo Pasión" 
            value="${product?.name||''}" 
            onclick="event.stopPropagation()"
            class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-[#9d5fa5] focus:ring-2 focus:ring-[#9d5fa5]/20 transition">
          <div class="error-msg" id="error-name"></div>
        </div>

        <!-- Código y Categoría -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-semibold text-[#6d165a] mb-2">Código</label>
            <input type="text" id="modal-code" placeholder="Ej: PROD001" 
              value="${product?.code||''}" 
              onclick="event.stopPropagation()"
              class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-[#9d5fa5] focus:ring-2 focus:ring-[#9d5fa5]/20 transition">
          </div>
          <div>
            <label class="block text-sm font-semibold text-[#6d165a] mb-2">Categoría *</label>
            <input type="text" id="modal-category" placeholder="Ej: Maquillaje" 
              value="${product?.category||''}" 
              onclick="event.stopPropagation()"
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
              onclick="event.stopPropagation()"
              class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-[#9d5fa5] focus:ring-2 focus:ring-[#9d5fa5]/20 transition">
            <div class="error-msg" id="error-price"></div>
          </div>
          <div>
            <label class="block text-sm font-semibold text-[#6d165a] mb-2">Stock *</label>
            <input type="number" id="modal-stock" placeholder="0" min="0" 
              value="${product?.stock??0}" 
              onclick="event.stopPropagation()"
              class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-[#9d5fa5] focus:ring-2 focus:ring-[#9d5fa5]/20 transition">
            <div class="error-msg" id="error-stock"></div>
          </div>
        </div>

        <!-- Costo -->
        <div>
          <label class="block text-sm font-semibold text-[#6d165a] mb-2">Costo unitario (COP)</label>
          <input type="number" id="modal-cost" placeholder="Opcional" min="0" 
            value="${product?.cost_price??''}" 
            onclick="event.stopPropagation()"
            class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-[#9d5fa5] focus:ring-2 focus:ring-[#9d5fa5]/20 transition">
        </div>

        <!-- Imagen -->
        <div>
          <label class="block text-sm font-semibold text-[#6d165a] mb-2">Ruta de Imagen</label>
          <input type="text" id="modal-image" placeholder="assets/producto.jpg" 
            value="${product?.image||'assets/default.png'}" 
            onclick="event.stopPropagation()"
            class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-[#9d5fa5] focus:ring-2 focus:ring-[#9d5fa5]/20 transition">
          <p class="text-xs text-gray-500 mt-1.5">Ej: assets/labial-rojo.jpg o URL externa</p>
          <div class="flex items-center gap-3 mt-3">
            <img id="modal-image-preview" src="${product?.image||'./assets/default.png'}" alt="Vista previa de la foto"
              class="w-14 h-14 rounded-lg object-cover border border-gray-200"
              onerror="this.src='./assets/default.png';this.onerror=null;">
            <button type="button" id="modal-image-upload" onclick="event.stopPropagation()"
              class="px-4 py-2.5 rounded-lg bg-[#6d165a] text-white text-sm font-semibold">Subir foto</button>
            <input type="file" id="modal-image-file" accept="image/jpeg,image/png,image/webp" class="hidden" onclick="event.stopPropagation()">
          </div>
          <p id="modal-image-status" class="text-xs text-gray-500 mt-1.5">JPG, PNG o WebP de máximo 3 MB.</p>
        </div>

        <!-- Descripción -->
        <div>
          <label class="block text-sm font-semibold text-[#6d165a] mb-2">Descripción</label>
          <textarea id="modal-description" placeholder="Describe el producto, ingredientes, beneficios..." 
            rows="4"
            onclick="event.stopPropagation()"
            class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-[#9d5fa5] focus:ring-2 focus:ring-[#9d5fa5]/20 transition resize-none">${product?.description||''}</textarea>
        </div>

        <!-- Mensaje de error general -->
        <div class="error-msg bg-red-50 px-4 py-3 rounded-lg border border-red-200" id="error-general"></div>
      </div>

      <!-- Footer -->
      <div class="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t border-gray-100">
        <button class="close-modal px-5 py-2.5 text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition" onclick="event.stopPropagation()">
          Cancelar
        </button>
        <button class="save-product px-5 py-2.5 bg-gradient-to-r from-[#6d165a] to-[#9d5fa5] text-white font-semibold rounded-lg hover:shadow-lg transition flex items-center gap-2" onclick="event.stopPropagation()">
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
    const costInput = modal.querySelector('#modal-cost');
    const imageInput = modal.querySelector('#modal-image');
    const imageFile = modal.querySelector('#modal-image-file');
    const imageUpload = modal.querySelector('#modal-image-upload');
    const imagePreview = modal.querySelector('#modal-image-preview');
    const imageStatus = modal.querySelector('#modal-image-status');

    imageUpload.addEventListener('click', () => imageFile.click());
    imageFile.addEventListener('change', async () => {
      const file = imageFile.files[0];
      if (!file) return;
      imageUpload.disabled = true;
      imageUpload.textContent = 'Subiendo...';
      imageStatus.textContent = '';
      try {
        const fd = new FormData();
        fd.append('file', file);
        const res = await fetch('/api/discordia/upload-image', { method: 'POST', body: fd });
        const json = await res.json();
        if (!json.ok) throw new Error(json.message);
        imageInput.value = json.url;
        imagePreview.src = json.url;
        imageStatus.textContent = 'Foto lista. Guarda el producto para aplicarla.';
      } catch (err) {
        imageStatus.textContent = err.message || 'No se pudo subir la foto.';
      } finally {
        imageUpload.disabled = false;
        imageUpload.textContent = 'Subir foto';
        imageFile.value = '';
      }
    });
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
        cost_price: costInput.value === '' ? null : Number(costInput.value),
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
        refreshCounts();
        renderCatalogTab();

        toast(editing ? '✓ Producto actualizado correctamente' : '✓ Producto agregado correctamente');

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

    const isActive = product.active !== false;
    const action = isActive ? 'Desactivar' : 'Reactivar';
    const actionColor = isActive ? 'from-orange-500 to-red-500' : 'from-emerald-500 to-green-500';

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

      <!-- Header -->
      <div class="bg-gradient-to-r ${actionColor} px-6 py-5 flex items-center justify-between">
        <h3 class="text-lg font-bold text-white flex items-center gap-2">
          ${isActive ? '⚠️ Desactivar Producto' : '✅ Reactivar Producto'}
        </h3>
      </div>

      <!-- Content -->
      <div class="p-6 space-y-4">
        <p class="text-gray-600">¿Estás seguro de que deseas ${isActive ? 'desactivar' : 'reactivar'} este producto?</p>
        
        <div class="${isActive ? 'bg-amber-50 border border-amber-200' : 'bg-emerald-50 border border-emerald-200'} rounded-lg p-4">
          <p class="text-sm font-semibold ${isActive ? 'text-amber-900' : 'text-emerald-900'}">${product.name}</p>
          <p class="text-xs ${isActive ? 'text-amber-700' : 'text-emerald-700'} mt-1">SKU: ${product.code || 'Sin código'}</p>
          <p class="text-xs ${isActive ? 'text-amber-700' : 'text-emerald-700'}">Precio: ${formatCurrency(Number(product.price||0))}</p>
        </div>

        <p class="text-sm text-gray-500 italic">
          ${isActive ? 'El producto será ocultado del catálogo público, pero los datos se mantendrán en el sistema.' : 'El producto volverá a ser visible en el catálogo público.'}
        </p>
      </div>

      <!-- Footer -->
      <div class="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t border-gray-100">
        <button class="cancel-btn px-5 py-2.5 text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition">
          Cancelar
        </button>
        <button class="confirm-delete px-5 py-2.5 bg-gradient-to-r ${actionColor} text-white font-semibold rounded-lg hover:shadow-lg transition flex items-center gap-2">
          <span class="delete-text">${isActive ? '🗑️ Desactivar' : '♻️ Reactivar'}</span>
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
      deleteText.textContent = isActive ? 'Desactivando...' : 'Reactivando...';

      try {
        // Actualizar el estado del producto
        const updatedProduct = { 
          ...product, 
          active: !isActive // Cambiar estado: activo -> inactivo o viceversa
        };

        // Enviar PUT al API para actualizar
        const res = await fetch('/api/discordia/products', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedProduct)
        });
        
        const json = await res.json();
        if (!json.ok) throw new Error(json.message);

        // Actualizar state.catalog
        const idx = state.catalog.findIndex(p => Number(p.id) === productId);
        if (idx >= 0) {
          state.catalog[idx] = updatedProduct;
        }
        
        saveToStorage(STORAGE_KEYS.catalog, state.catalog);
        refreshCounts();
        renderCatalogTab();

        toast(isActive ? '✓ Producto desactivado correctamente' : '✓ Producto reactivado correctamente');

        closeModal();
      } catch (err) {
        toast('No se pudo: ' + (err.message || 'intenta de nuevo'), true);
        deleteBtn.disabled = false;
        deleteLoader.classList.add('hidden');
        deleteText.textContent = isActive ? '🗑️ Desactivar' : '♻️ Reactivar';
      }
    });
  });
}

// ── OFERTAS ───────────────────────────────────────────────────
const ofertasUi = { query: '', categoria: 'all', pct: 20, seleccion: new Set() };

// Precio con descuento: el mismo cálculo que hace el servidor (redondeado a la centena).
const precioBase = p => (enOferta(p) ? Number(p.reference_price) : Number(p.price));
const conDescuento = (p, pct) => Math.max(100, Math.round(precioBase(p) * (100 - pct) / 10000) * 100);

async function guardarDescuento(ids, pct) {
  const res = await fetch('/api/discordia/discounts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids, pct })
  });
  const json = await res.json();
  if (!json.ok) throw new Error(json.message);
  // La base puede tardar un minuto en reflejar el cambio: se usa lo que devolvió el servidor.
  json.data.forEach(row => {
    const i = state.catalog.findIndex(p => Number(p.id) === Number(row.id));
    if (i >= 0) state.catalog[i] = { ...state.catalog[i], ...row };
  });
  saveToStorage(STORAGE_KEYS.catalog, state.catalog);
  refreshCounts();
  return json.data.length;
}

function renderOffersTab() {
  const ui = ofertasUi;
  const productos = state.catalog.filter(p => esProductoReal(p) && p.active !== false);
  const ofertas = productos.filter(enOferta).sort((a, b) => pctOferta(b) - pctOferta(a));
  const promedio = ofertas.length ? Math.round(ofertas.reduce((s, p) => s + pctOferta(p), 0) / ofertas.length) : 0;
  const ahorro = ofertas.reduce((s, p) => s + (Number(p.reference_price) - Number(p.price)), 0);
  const categorias = [...new Set(productos.map(p => p.category).filter(Boolean))]
    .sort((a, b) => nombreCategoria(a).localeCompare(nombreCategoria(b)));

  panel.innerHTML = `
    <section class="dgrid kpis">
      <article class="card hero kpi span-4 wide"><div class="kpi-label">Productos en oferta</div><div class="kpi-value num">${ofertas.length}</div><div class="kpi-foot">con listón de descuento en el catálogo</div></article>
      <article class="card kpi span-4"><div class="kpi-label">Descuento promedio</div><div class="kpi-value num">${promedio}%</div><div class="kpi-foot">${ofertas.length ? 'entre los productos en oferta' : 'sin ofertas activas'}</div></article>
      <article class="card kpi span-4"><div class="kpi-label">Ahorro por unidad</div><div class="kpi-value num">${formatCurrency(ahorro)}</div><div class="kpi-foot">suma de una unidad de cada oferta</div></article>
    </section>

    <article class="card flush">
      <div class="card-head"><div><h3>En oferta ahora</h3><p>Así se ven en la página principal</p></div>
        ${ofertas.length ? '<div class="right"><button class="btn sm danger" type="button" id="quitar-todas">Quitar todas</button></div>' : ''}</div>
      ${ofertas.length ? `<div class="table-wrap" style="margin-top:6px"><table class="tbl stack">
        <thead><tr><th>Producto</th><th class="r">Antes</th><th class="r">Ahora</th><th>Descuento</th><th class="r">Acciones</th></tr></thead>
        <tbody>${ofertas.map(p => `
          <tr>
            <td class="full"><div class="prod"><img class="thumb" src="${esc(foto(p.image))}" alt="" loading="lazy" onerror="this.src='./assets/default.png';this.onerror=null;"><div><b>${esc(p.name)}</b><span>${esc(p.code || '')} · ${esc(nombreCategoria(p.category))}</span></div></div></td>
            <td class="r money" data-label="Antes"><s style="color:var(--faint)">${formatCurrency(Number(p.reference_price))}</s></td>
            <td class="r money" data-label="Ahora"><b>${formatCurrency(Number(p.price))}</b></td>
            <td data-label="Descuento"><span class="pill sale">-${pctOferta(p)}%</span></td>
            <td><div class="actions"><button class="btn sm danger quitar-oferta" type="button" data-id="${p.id}">Quitar</button></div></td>
          </tr>`).join('')}</tbody></table></div>`
      : `<div style="padding:0 18px 18px"><div class="empty"><b>No hay productos en oferta</b>Selecciónalos abajo y elige el porcentaje.</div></div>`}
    </article>

    <article class="card flush">
      <div class="card-head"><div><h3>Aplicar descuento</h3><p>Marca los productos, elige el % y aplica</p></div></div>
      <div class="toolbar">
        <label class="search">${ICONOS.search}<input id="of-search" class="input" type="search" value="${esc(ui.query)}" placeholder="Buscar por nombre, código o marca" aria-label="Buscar productos"></label>
        <select id="of-cat" class="input" aria-label="Categoría">
          <option value="all">Todas las categorías</option>
          ${categorias.map(c => `<option value="${esc(c)}" ${ui.categoria === c ? 'selected' : ''}>${esc(nombreCategoria(c))}</option>`).join('')}
        </select>
      </div>
      <div class="toolbar sale-bar">
        <span class="meta" id="of-count" style="margin-left:0"></span>
        <div class="seg" role="group" aria-label="Porcentaje">
          ${[10, 15, 20, 30, 50].map(n => `<button type="button" data-pct="${n}">${n}%</button>`).join('')}
        </div>
        <label class="pct-input"><input id="of-pct" class="input num" type="number" min="1" max="90" step="1" value="${ui.pct}" aria-label="Porcentaje de descuento"><span>%</span></label>
        <button class="btn primary" type="button" id="of-aplicar">${ICONOS.offers}Aplicar</button>
      </div>
      <div class="table-wrap" id="of-table"></div>
    </article>`;

  const pintarLista = () => {
    const q = ui.query.trim().toLowerCase();
    const lista = productos.filter(p =>
      (ui.categoria === 'all' || p.category === ui.categoria) &&
      (!q || `${p.name} ${p.code || ''} ${p.brand || ''}`.toLowerCase().includes(q))
    ).sort((a, b) => String(a.name).localeCompare(String(b.name)));
    const elegibles = lista.filter(p => Number(p.price) > 0);
    const todos = elegibles.length > 0 && elegibles.every(p => ui.seleccion.has(Number(p.id)));
    panel.querySelector('#of-table').innerHTML = `
      <table class="tbl stack">
        <thead><tr>
          <th style="width:44px"><input type="checkbox" id="of-all" ${todos ? 'checked' : ''} aria-label="Seleccionar todos los visibles"></th>
          <th>Producto</th><th class="r">Precio actual</th><th class="r">Con ${ui.pct}%</th><th>Stock</th>
        </tr></thead>
        <tbody>${lista.map(p => {
          const sinPrecio = !Number(p.price);
          const marcado = ui.seleccion.has(Number(p.id));
          return `<tr class="${marcado ? 'is-sel' : ''}">
            <td><input type="checkbox" class="of-check" data-id="${p.id}" ${marcado ? 'checked' : ''} ${sinPrecio ? 'disabled' : ''} aria-label="Seleccionar ${esc(p.name)}"></td>
            <td class="full"><div class="prod"><img class="thumb" src="${esc(foto(p.image))}" alt="" loading="lazy" onerror="this.src='./assets/default.png';this.onerror=null;"><div><b>${esc(p.name)}</b><span>${esc(p.code || '')} · ${esc(nombreCategoria(p.category))}</span></div></div></td>
            <td class="r money" data-label="Precio actual">${sinPrecio ? '<span class="pill warn">Sin precio</span>' : enOferta(p) ? `<span class="pill sale">-${pctOferta(p)}%</span> ${formatCurrency(Number(p.price))}` : formatCurrency(Number(p.price))}</td>
            <td class="r money" data-label="Con ${ui.pct}%">${sinPrecio ? '—' : `<b style="color:var(--accent)">${formatCurrency(conDescuento(p, ui.pct))}</b>${enOferta(p) ? `<div class="antes" style="text-decoration:none">sobre ${formatCurrency(Number(p.reference_price))}</div>` : ''}`}</td>
            <td class="num of-stock" data-label="Stock">${Number(p.stock) || 0}</td>
          </tr>`;
        }).join('') || `<tr><td colspan="5" class="full"><div class="empty"><b>Sin resultados</b>Prueba con otra búsqueda.</div></td></tr>`}</tbody>
      </table>`;

    panel.querySelectorAll('.of-check').forEach(c => c.addEventListener('change', () => {
      const id = Number(c.dataset.id);
      c.checked ? ui.seleccion.add(id) : ui.seleccion.delete(id);
      c.closest('tr').classList.toggle('is-sel', c.checked);
      const allBox = panel.querySelector('#of-all');
      if (allBox) allBox.checked = elegibles.every(p => ui.seleccion.has(Number(p.id)));
      pintarConteo();
    }));
    panel.querySelector('#of-all')?.addEventListener('change', e => {
      elegibles.forEach(p => e.target.checked ? ui.seleccion.add(Number(p.id)) : ui.seleccion.delete(Number(p.id)));
      pintarLista();
    });
    pintarConteo();
  };

  const pintarConteo = () => {
    const n = ui.seleccion.size;
    panel.querySelector('#of-count').textContent = n ? `${n} seleccionado${n !== 1 ? 's' : ''}` : 'Ningún producto seleccionado';
    const btn = panel.querySelector('#of-aplicar');
    btn.disabled = !n;
    btn.lastChild.textContent = n ? `Aplicar ${ui.pct}% a ${n}` : 'Aplicar';
    panel.querySelectorAll('[data-pct]').forEach(b => {
      b.classList.toggle('is-on', Number(b.dataset.pct) === ui.pct);
      b.setAttribute('aria-pressed', String(Number(b.dataset.pct) === ui.pct));
    });
  };

  const fijarPct = v => {
    ui.pct = Math.min(90, Math.max(1, Math.round(Number(v) || 0)));
    panel.querySelector('#of-pct').value = ui.pct;
    pintarLista();
  };

  let t = null;
  panel.querySelector('#of-search').addEventListener('input', e => { ui.query = e.target.value; clearTimeout(t); t = setTimeout(pintarLista, 200); });
  panel.querySelector('#of-cat').addEventListener('change', e => { ui.categoria = e.target.value; pintarLista(); });
  panel.querySelectorAll('[data-pct]').forEach(b => b.addEventListener('click', () => fijarPct(b.dataset.pct)));
  panel.querySelector('#of-pct').addEventListener('change', e => fijarPct(e.target.value));

  panel.querySelector('#of-aplicar').addEventListener('click', async e => {
    const btn = e.currentTarget;
    const ids = [...ui.seleccion];
    if (!ids.length) return;
    btn.disabled = true;
    try {
      const n = await guardarDescuento(ids, ui.pct);
      ui.seleccion.clear();
      toast(`Descuento de ${ui.pct}% aplicado a ${n} producto${n !== 1 ? 's' : ''}`);
      renderOffersTab();
    } catch (err) {
      toast(err.message || 'No se pudo aplicar el descuento', true);
      btn.disabled = false;
    }
  });

  const quitar = async ids => {
    try {
      const n = await guardarDescuento(ids, 0);
      toast(`Descuento quitado de ${n} producto${n !== 1 ? 's' : ''}`);
      renderOffersTab();
    } catch (err) {
      toast(err.message || 'No se pudo quitar el descuento', true);
    }
  };
  panel.querySelectorAll('.quitar-oferta').forEach(b => b.addEventListener('click', () => quitar([Number(b.dataset.id)])));
  panel.querySelector('#quitar-todas')?.addEventListener('click', async () => {
    const { isConfirmed } = await Swal.fire({
      title: '¿Quitar todas las ofertas?',
      html: `${ofertas.length} productos vuelven a su precio original.`,
      showCancelButton: true, confirmButtonText: 'Sí, quitar todas', cancelButtonText: 'Cancelar'
    });
    if (isConfirmed) quitar(ofertas.map(p => Number(p.id)));
  });

  pintarLista();
}

// ── CLIENTES ──────────────────────────────────────────────────
function renderCustomersTab() {
  // Clientes registrados + lo que se ve en las ventas (por id o por nombre).
  const mapa = new Map();
  const clave = n => String(n || 'Sin nombre').trim().toLowerCase();
  state.customers.forEach(c => mapa.set(clave(c.name), {
    name: c.name || 'Sin nombre', phone: c.phone || '', id: c.id,
    pedidos: 0, comprado: 0, deuda: 0, ultima: null
  }));
  state.sales.forEach(s => {
    const k = clave(s.customer_name);
    if (!mapa.has(k)) mapa.set(k, { name: s.customer_name || 'Sin nombre', phone: s.customer_phone || '', pedidos: 0, comprado: 0, deuda: 0, ultima: null });
    const c = mapa.get(k);
    c.pedidos += 1;
    c.comprado += Number(s.total || 0);
    if (s.payment_status === 'pending') c.deuda += Number(s.total || 0) - Number(s.amount_paid || 0);
    if (!c.phone && s.customer_phone) c.phone = s.customer_phone;
    if (!c.ultima || new Date(s.created_at) > new Date(c.ultima)) c.ultima = s.created_at;
  });
  const clientes = [...mapa.values()].sort((a, b) => b.comprado - a.comprado || a.name.localeCompare(b.name));
  const conCompras = clientes.filter(c => c.pedidos > 0).length;
  const deudaTotal = clientes.reduce((s, c) => s + c.deuda, 0);
  const iniciales = n => String(n).trim().split(/\s+/).slice(0, 2).map(w => w[0] || '').join('').toUpperCase() || '?';
  const tel = p => String(p || '').replace(/\D/g, '');

  const rows = clientes.map(c => `
    <tr>
      <td class="full"><div class="prod" style="min-width:200px"><span class="avatar">${esc(iniciales(c.name))}</span><div><b>${esc(c.name)}</b><span>${c.pedidos ? `${c.pedidos} compra${c.pedidos !== 1 ? 's' : ''}` : 'Sin compras registradas'}</span></div></div></td>
      <td data-label="WhatsApp">${c.phone ? `<a class="link mono" href="https://wa.me/${tel(c.phone).length === 10 ? '57' + tel(c.phone) : tel(c.phone)}" target="_blank" rel="noopener">${esc(c.phone)}</a>` : '<span class="pill mute">Sin teléfono</span>'}</td>
      <td class="r money" data-label="Total comprado">${formatCurrency(c.comprado)}</td>
      <td data-label="Estado">${c.deuda > 0 ? `<span class="pill warn">Debe ${formatCurrency(c.deuda)}</span>` : c.pedidos ? '<span class="pill good">Al día</span>' : '<span class="pill mute">—</span>'}</td>
      <td class="code" data-label="Última compra">${c.ultima ? new Date(c.ultima).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</td>
    </tr>`).join('');

  panel.innerHTML = `
    <section class="dgrid kpis">
      <article class="card span-4 kpi"><div class="kpi-label">Clientes</div><div class="kpi-value num">${clientes.length}</div><div class="kpi-foot">${conCompras} con compras registradas</div></article>
      <article class="card span-4 kpi"><div class="kpi-label">Por cobrar</div><div class="kpi-value num">${formatCurrency(deudaTotal)}</div><div class="kpi-foot">${clientes.filter(c => c.deuda > 0).length} clientes con saldo</div></article>
      <article class="card span-4 kpi wide"><div class="kpi-label">Mejor cliente</div><div class="kpi-value" style="font-size:22px">${conCompras ? esc(clientes[0].name) : '—'}</div><div class="kpi-foot">${conCompras ? formatCurrency(clientes[0].comprado) + ' comprados' : 'Aún no hay ventas'}</div></article>
    </section>
    <article class="card flush">
      <div class="toolbar">
        <label class="search">${ICONOS.search}<input id="cli-search" class="input" type="search" placeholder="Buscar por nombre o teléfono" aria-label="Buscar clientes"></label>
        <span class="meta" id="cli-meta">${clientes.length} clientes</span>
      </div>
      <div class="table-wrap">
        <table class="tbl stack">
          <thead><tr><th>Cliente</th><th>WhatsApp</th><th class="r">Total comprado</th><th>Estado</th><th>Última compra</th></tr></thead>
          <tbody id="cli-body">${rows || `<tr><td colspan="5" class="full"><div class="empty"><b>Sin clientes todavía</b>Aparecen aquí cuando registras una venta.</div></td></tr>`}</tbody>
        </table>
      </div>
    </article>`;

  const body = panel.querySelector('#cli-body');
  panel.querySelector('#cli-search').addEventListener('input', e => {
    const q = e.target.value.trim().toLowerCase();
    let n = 0;
    body.querySelectorAll('tr').forEach(tr => {
      const ok = !q || tr.textContent.toLowerCase().includes(q);
      tr.hidden = !ok; if (ok) n++;
    });
    panel.querySelector('#cli-meta').textContent = `${n} de ${clientes.length} clientes`;
  });
}

// ── ESTRUCTURA: tema, reloj, menú, atajos ─────────────────────
function setupShell() {
  document.getElementById('logout-btn').addEventListener('click', logout);

  const user = getAdminUser();
  document.getElementById('user-name').textContent = user;
  document.getElementById('user-initials').textContent = String(user).slice(0, 2).toUpperCase();

  document.getElementById('theme-btn').addEventListener('click', () => {
    const claro = document.documentElement.dataset.theme !== 'light';
    if (claro) document.documentElement.dataset.theme = 'light';
    else delete document.documentElement.dataset.theme;
    try { localStorage.setItem('discordia-admin-tema', claro ? 'light' : 'dark'); } catch {}
    if (activeTab === 'dashboard') switchTab('dashboard');
  });

  document.getElementById('refresh-btn').addEventListener('click', async () => {
    await cargarDatos();
    refreshCounts();
    await switchTab(activeTab);
    toast('Datos actualizados');
  });

  document.getElementById('menu-btn').addEventListener('click', () => document.body.classList.toggle('nav-open'));
  document.getElementById('scrim').addEventListener('click', () => document.body.classList.remove('nav-open'));

  const nuevaVenta = async () => {
    if (activeTab !== 'sales') await switchTab('sales');
    panel.querySelector('#btn-nueva-venta')?.click();
  };
  document.getElementById('nueva-venta').addEventListener('click', nuevaVenta);
  document.addEventListener('keydown', e => {
    const escribiendo = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.isContentEditable;
    if (escribiendo || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === 'n' || e.key === 'N') { if (!document.querySelector('.swal2-container, .fixed.inset-0')) { e.preventDefault(); nuevaVenta(); } }
    if (e.key === '/') { const s = panel.querySelector('input[type="search"]'); if (s) { e.preventDefault(); s.focus(); } }
  });

  const reloj = document.getElementById('clock');
  const tic = () => {
    reloj.textContent = new Date().toLocaleString('es-CO', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };
  tic(); setInterval(tic, 20000);
}

async function cargarDatos() {
  try {
    const res = await fetch(CONFIG.ADMIN_API_PATH, { cache: 'no-store' });
    if (!res.ok) throw new Error(`API returned ${res.status}`);
    const json = await res.json();
    if (json.ok) {
      state.catalog   = json.data.catalog   || state.catalog;
      state.sales     = json.data.sales     || state.sales;
      state.customers = json.data.customers || state.customers;
      saveToStorage(STORAGE_KEYS.catalog,   state.catalog);
      saveToStorage(STORAGE_KEYS.sales,     state.sales);
      saveToStorage(STORAGE_KEYS.customers, state.customers);
    }
  } catch (err) {
    console.warn('API load failed, using local data:', err.message);
  }
}

// ── INIT ──────────────────────────────────────────────────────
async function init() {
  try {
    requireAuth(); // sin token redirige a login
  } catch (err) {
    console.error('Auth check failed:', err.message);
    return;
  }

  panel = document.getElementById('admin-panel');
  if (!panel) return;

  setupShell();
  buildTabs();
  await cargarDatos();
  refreshCounts();
  await switchTab('dashboard');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
