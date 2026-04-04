import { requireAuth, logout } from './auth.js';
requireAuth();
import { fetchProducts } from './products.js';
import { CONFIG } from './config.js';

const panel = document.getElementById('admin-panel');
const summaryContainer = document.getElementById('admin-summary');
const tabButtons = Array.from(document.querySelectorAll('.admin-tab-btn'));
const exportBackupBtn = document.getElementById('export-backup');
const importBackupBtn = document.getElementById('import-backup');
const resetAdminDataBtn = document.getElementById('reset-admin-data');
const backupFileInput = document.getElementById('backup-file-input');

const STORAGE_KEYS = {
    catalog: CONFIG.CATALOG_STORAGE_KEY,
    sales: CONFIG.SALES_STORAGE_KEY || 'skcSales',
    customers: CONFIG.CUSTOMERS_STORAGE_KEY || 'skcCustomers'
};

const API_ENDPOINT = CONFIG.ADMIN_API_PATH || '/api/skc-data';

let activeTab = 'dashboard';
let dashboardCache = null;
let deudasCache = null;
let salesCache = null;
let catalogCache = null;
let customersCache = null;
let nvState = null; // nueva venta state
const uiState = {
    catalogQuery: '',
    catalogLowStockOnly: false,
    catalogCategoryFilter: '',
    salesQuery: '',
    salesChannel: '',
    salesStatus: '',
    customersQuery: '',
    customersDebtOnly: false
};

const state = {
    catalog: loadCollection(STORAGE_KEYS.catalog, []),
    sales: loadCollection(STORAGE_KEYS.sales, []),
    customers: loadCollection(STORAGE_KEYS.customers, [])
};

let storageMode = 'local';
let remoteSyncTimer = null;
let pendingRemotePayload = {};

function loadCollection(key, fallback) {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return structuredCloneSafe(fallback);
        return JSON.parse(raw);
    } catch (e) {
        console.warn(`No se pudo leer ${key} desde localStorage`, e);
        return structuredCloneSafe(fallback);
    }
}

function structuredCloneSafe(value) {
    return JSON.parse(JSON.stringify(value));
}

function saveCollection(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
        console.warn(`No se pudo guardar ${key} en localStorage`, e);
    }
}

function saveCatalog() {
    saveCollection(STORAGE_KEYS.catalog, state.catalog);
    queueRemoteSync({ catalog: state.catalog });
}

function saveSales() {
    saveCollection(STORAGE_KEYS.sales, state.sales);
    queueRemoteSync({ sales: state.sales });
}

function saveCustomers() {
    saveCollection(STORAGE_KEYS.customers, state.customers);
    queueRemoteSync({ customers: state.customers });
}

async function requestApi(method, payload) {
    const response = await fetch(API_ENDPOINT, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: payload ? JSON.stringify(payload) : undefined
    });

    if (!response.ok) {
        throw new Error(`API ${method} ${response.status}`);
    }

    return response.json();
}

function applyRemoteData(data) {
    if (!data) return;
    if (Array.isArray(data.catalog)) state.catalog = data.catalog;
    if (Array.isArray(data.sales)) state.sales = data.sales;
    if (Array.isArray(data.customers)) state.customers = data.customers;
}

async function hydrateFromApi() {
    try {
        const response = await requestApi('GET');
        if (response?.ok && response?.data) {
            applyRemoteData(response.data);
            storageMode = response.storage === 'vercel-kv' ? 'remoto' : 'local';
            saveCollection(STORAGE_KEYS.catalog, state.catalog);
            saveCollection(STORAGE_KEYS.sales, state.sales);
            saveCollection(STORAGE_KEYS.customers, state.customers);
            refreshUI();
        }
    } catch (error) {
        storageMode = 'local';
        console.info('API remota no disponible, se mantiene modo local.');
    }
}

function queueRemoteSync(partial) {
    pendingRemotePayload = { ...pendingRemotePayload, ...partial };

    if (remoteSyncTimer) {
        clearTimeout(remoteSyncTimer);
    }

    remoteSyncTimer = setTimeout(async () => {
        const payload = pendingRemotePayload;
        pendingRemotePayload = {};

        try {
            const response = await requestApi('POST', payload);
            storageMode = response?.storage === 'vercel-kv' ? 'remoto' : 'local';
            if (response?.data) {
                applyRemoteData(response.data);
            }
            refreshUI();
        } catch (error) {
            storageMode = 'local';
        }
    }, 250);
}

function bindTabActions() {
    tabButtons.forEach((button) => {
        button.addEventListener('click', () => {
            activeTab = button.dataset.adminTab;
            refreshUI();
        });
    });
}

function bindGlobalActions() {
    if (exportBackupBtn) {
        exportBackupBtn.addEventListener('click', exportBackup);
    }

    if (importBackupBtn && backupFileInput) {
        importBackupBtn.addEventListener('click', () => backupFileInput.click());
        backupFileInput.addEventListener('change', handleImportBackupFile);
    }

    if (resetAdminDataBtn) {
        resetAdminDataBtn.addEventListener('click', resetAdminData);
    }
}

function refreshUI() {
    renderSummary();
    renderTabButtons();
    renderActiveTab();
}

function renderSummary() {
    if (activeTab === 'dashboard' || activeTab === 'debts' || activeTab === 'sales' || activeTab === 'catalog' || activeTab === 'customers') {
        summaryContainer.innerHTML = '';
        return;
    }

    const totalProducts = state.catalog.length;
    const totalStock = state.catalog.reduce((sum, item) => sum + Number(item.stock || 0), 0);
    const totalSales = state.sales.length;
    const totalRevenue = state.sales.reduce((sum, sale) => sum + Number(sale.total || 0), 0);

    const cards = [
        { label: 'Productos', value: totalProducts, note: 'Items activos en catálogo' },
        { label: 'Stock total', value: totalStock, note: 'Unidades disponibles' },
        { label: 'Ventas', value: totalSales, note: 'Registros acumulados' },
        { label: 'Ingresos', value: `$${totalRevenue.toLocaleString()}`, note: `Total ventas registradas · Modo ${storageMode}` }
    ];

    summaryContainer.innerHTML = cards.map((card) => `
        <article class="bg-white border border-gray-100 rounded-2xl p-4 md:p-5 shadow-sm">
            <p class="text-xs uppercase tracking-[0.15em] text-gray-500">${card.label}</p>
            <p class="text-2xl md:text-3xl font-bold text-[#6d165a] mt-2">${card.value}</p>
            <p class="text-sm text-gray-500 mt-1">${card.note}</p>
        </article>
    `).join('');
}

function renderTabButtons() {
    tabButtons.forEach((button) => {
        const isActive = button.dataset.adminTab === activeTab;
        button.className = `admin-tab-btn px-4 py-2.5 rounded-xl font-semibold text-sm whitespace-nowrap transition ${isActive ? 'bg-[#6d165a] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`;
    });
}

function renderActiveTab() {
    if (activeTab === 'dashboard') { renderDashboardTab(); return; }
    if (activeTab === 'debts') { renderDeudasTab(); return; }
    if (activeTab === 'catalog') { renderCatalogTab(); return; }
    if (activeTab === 'sales') { renderSalesTab(); return; }
    renderCustomersTab();
}

// ─────────────────────────────────────────────────────────────
// Dashboard Tab — fetches /api/dashboard and renders metrics
// ─────────────────────────────────────────────────────────────
async function renderDashboardTab() {
    if (dashboardCache) {
        renderDashboardContent(dashboardCache);
        return;
    }

    panel.innerHTML = `
        <div class="flex flex-col items-center justify-center py-24 gap-4">
            <div class="w-12 h-12 border-4 border-[#ec5c8d] border-t-transparent rounded-full animate-spin"></div>
            <p class="text-gray-400 text-sm font-medium">Cargando métricas del negocio...</p>
        </div>
    `;

    try {
        const token = localStorage.getItem('discordia_admin_token');
        const res = await fetch('/api/dashboard', {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!json.ok) throw new Error(json.message || 'Error del servidor');
        dashboardCache = json.data;
        renderDashboardContent(dashboardCache);
    } catch (err) {
        panel.innerHTML = `
            <div class="bg-white border border-gray-100 rounded-2xl p-10 shadow-sm text-center">
                <div class="text-5xl mb-4">⚠️</div>
                <h3 class="text-xl font-bold text-[#6d165a] mb-2">No se pudo cargar el dashboard</h3>
                <p class="text-gray-500 text-sm mb-6">${err.message}</p>
                <button onclick="window.reloadDashboard()" class="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#ec5c8d] to-[#ff8c91] text-white font-semibold text-sm shadow-md">Reintentar</button>
            </div>
        `;
    }
}

window.reloadDashboard = function () {
    dashboardCache = null;
    renderDashboardTab();
};

window.switchTab = function (tab) {
    activeTab = tab;
    refreshUI();
};

function renderDashboardContent(data) {
    const { ingresosMes, topProductos, deudasActivas, stockBajo, ventasRecientes } = data;

    const totalDeuda = deudasActivas.reduce((sum, c) => sum + Number(c.total_debt), 0);

    let variacionBadge = '';
    if (ingresosMes.variacion !== null) {
        const v = ingresosMes.variacion;
        if (v > 0) {
            variacionBadge = `<span class="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full"><i class="fa-solid fa-arrow-trend-up"></i> +${v}% vs mes anterior</span>`;
        } else if (v < 0) {
            variacionBadge = `<span class="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-full"><i class="fa-solid fa-arrow-trend-down"></i> ${v}% vs mes anterior</span>`;
        } else {
            variacionBadge = `<span class="text-xs text-gray-500">Sin cambio vs mes anterior</span>`;
        }
    } else {
        variacionBadge = `<span class="text-xs text-gray-400">Sin datos anteriores</span>`;
    }

    const kpiCards = [
        {
            icon: 'fa-solid fa-sack-dollar',
            iconBg: 'from-[#ec5c8d] to-[#ff8c91]',
            label: 'Ingresos del mes',
            value: `$${Number(ingresosMes.total).toLocaleString('es-CO')}`,
            sub: `${ingresosMes.cantidad} venta${ingresosMes.cantidad !== 1 ? 's' : ''} este mes`,
            badge: variacionBadge
        },
        {
            icon: 'fa-solid fa-file-invoice-dollar',
            iconBg: 'from-[#6d165a] to-[#a0346e]',
            label: 'Deudas activas',
            value: `$${totalDeuda.toLocaleString('es-CO')}`,
            sub: `${deudasActivas.length} cliente${deudasActivas.length !== 1 ? 's' : ''} con saldo pendiente`,
            badge: deudasActivas.length > 0
                ? `<button onclick="window.switchTab('debts')" class="text-xs font-semibold text-[#ec5c8d] hover:underline">Ver deudas →</button>`
                : ''
        },
        {
            icon: 'fa-solid fa-triangle-exclamation',
            iconBg: 'from-[#ffc4a6] to-[#ff8c91]',
            iconColor: 'text-[#6d165a]',
            label: 'Stock bajo',
            value: stockBajo.length,
            sub: `Producto${stockBajo.length !== 1 ? 's' : ''} con ≤ 3 unidades`,
            badge: stockBajo.length > 0
                ? `<button onclick="window.switchTab('catalog')" class="text-xs font-semibold text-[#ec5c8d] hover:underline">Ver catálogo →</button>`
                : ''
        },
        {
            icon: 'fa-solid fa-clock-rotate-left',
            iconBg: 'from-[#a0346e] to-[#ec5c8d]',
            label: 'Ventas recientes',
            value: ventasRecientes.length,
            sub: 'Últimas transacciones registradas',
            badge: `<button onclick="window.switchTab('sales')" class="text-xs font-semibold text-[#ec5c8d] hover:underline">Ver historial →</button>`
        }
    ];

    const kpiHtml = kpiCards.map(card => `
        <article class="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex items-start gap-4">
            <div class="w-12 h-12 rounded-xl bg-gradient-to-br ${card.iconBg} flex items-center justify-center flex-shrink-0 shadow-md">
                <i class="${card.icon} text-lg ${card.iconColor || 'text-white'}"></i>
            </div>
            <div class="flex-1 min-w-0">
                <p class="text-xs uppercase tracking-[0.18em] text-[#a0346e] font-semibold mb-1">${card.label}</p>
                <p class="text-3xl font-bold text-[#6d165a] leading-none">${card.value}</p>
                <p class="text-sm text-gray-500 mt-1">${card.sub}</p>
                ${card.badge ? `<div class="mt-2">${card.badge}</div>` : ''}
            </div>
        </article>
    `).join('');

    const topProductosHtml = topProductos.length > 0
        ? topProductos.map((p, i) => {
            const rankClass = i === 0
                ? 'bg-gradient-to-br from-[#ec5c8d] to-[#ff8c91] text-white shadow-sm'
                : i === 1 ? 'bg-gray-200 text-gray-700' : 'bg-gray-100 text-gray-500';
            return `
                <tr class="border-b border-gray-50 hover:bg-[#fdf7fa] transition">
                    <td class="py-3 px-3 text-center">
                        <span class="w-6 h-6 inline-flex items-center justify-center rounded-full text-xs font-bold ${rankClass}">${i + 1}</span>
                    </td>
                    <td class="py-3 px-3">
                        <p class="font-semibold text-gray-900 text-sm leading-tight">${p.product_name}</p>
                    </td>
                    <td class="py-3 px-3 text-center">
                        <span class="text-sm font-bold text-[#6d165a]">${p.unidades}</span>
                        <span class="text-xs text-gray-400 ml-0.5">un.</span>
                    </td>
                    <td class="py-3 px-3 text-right">
                        <span class="text-sm font-bold text-[#a0346e]">$${Number(p.ingresos).toLocaleString('es-CO')}</span>
                    </td>
                </tr>
            `;
        }).join('')
        : `<tr><td colspan="4" class="py-10 text-center text-gray-400 text-sm">Sin ventas registradas aún</td></tr>`;

    const ventasHtml = ventasRecientes.map(v => {
        const fecha = new Date(v.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: '2-digit' });
        const isPaid = v.payment_status === 'paid';
        return `
            <div class="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0">
                <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-[#ffc4a6] to-[#ff8c91] flex items-center justify-center flex-shrink-0">
                    <i class="fa-solid fa-bag-shopping text-white text-sm"></i>
                </div>
                <div class="flex-1 min-w-0">
                    <p class="text-sm font-semibold text-gray-900 truncate">${v.cliente || 'Cliente'}</p>
                    <p class="text-xs text-gray-400">${fecha} · ${v.channel || 'Manual'}</p>
                </div>
                <div class="text-right flex-shrink-0">
                    <p class="text-sm font-bold text-[#a0346e]">$${Number(v.total).toLocaleString('es-CO')}</p>
                    <span class="text-xs font-semibold px-1.5 py-0.5 rounded-full ${isPaid ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}">${isPaid ? 'Pagado' : 'Pendiente'}</span>
                </div>
            </div>
        `;
    }).join('') || '<p class="text-center text-gray-400 text-sm py-8">Sin ventas recientes</p>';

    const deudasHtml = deudasActivas.length > 0
        ? deudasActivas.map(d => `
            <div class="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
                <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-[#6d165a] to-[#a0346e] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    ${(d.name || '?').charAt(0).toUpperCase()}
                </div>
                <div class="flex-1 min-w-0">
                    <p class="text-sm font-semibold text-gray-900 truncate">${d.name}</p>
                    <p class="text-xs text-gray-400">${d.ventas_pendientes} venta${Number(d.ventas_pendientes) !== 1 ? 's' : ''} pend.</p>
                </div>
                <p class="text-sm font-bold text-rose-600 flex-shrink-0">$${Number(d.total_debt).toLocaleString('es-CO')}</p>
            </div>
        `).join('')
        : '<p class="text-center text-gray-400 text-sm py-6">Sin deudas activas 🎉</p>';

    const stockHtml = (() => {
        const visible = stockBajo.slice(0, 8);
        const resto = stockBajo.length - visible.length;
        return visible.map(p => `
            <div class="flex items-center gap-2 py-1.5">
                <span class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${p.stock <= 1 ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}">${p.stock}</span>
                <p class="text-sm text-gray-700 truncate flex-1">${p.name}</p>
                <span class="text-xs text-gray-400 flex-shrink-0">${p.category}</span>
            </div>
        `).join('') + (resto > 0 ? `<p class="text-xs text-center text-gray-400 pt-2 pb-1">+${resto} productos más con stock bajo</p>` : '');
    })();

    const now = new Date().toLocaleString('es-CO', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    panel.innerHTML = `
        <!-- KPI Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
            ${kpiHtml}
        </div>

        <!-- Content grid -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

            <!-- Left col: Top productos + Ventas recientes -->
            <div class="lg:col-span-2 space-y-6">

                <!-- Top 5 productos -->
                <article class="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                    <div class="flex items-center justify-between mb-5">
                        <div>
                            <p class="text-xs uppercase tracking-[0.18em] text-[#a0346e] font-semibold mb-1">Más vendidos</p>
                            <h3 class="text-xl font-bold text-[#6d165a]">Top 5 Productos</h3>
                        </div>
                        <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ffc4a6] to-[#ff8c91] flex items-center justify-center">
                            <i class="fa-solid fa-trophy text-white"></i>
                        </div>
                    </div>
                    <div class="overflow-x-auto">
                        <table class="min-w-full">
                            <thead>
                                <tr class="border-b border-gray-100">
                                    <th class="pb-3 px-3 text-center text-xs text-gray-400 font-semibold uppercase tracking-wide w-10">#</th>
                                    <th class="pb-3 px-3 text-left text-xs text-gray-400 font-semibold uppercase tracking-wide">Producto</th>
                                    <th class="pb-3 px-3 text-center text-xs text-gray-400 font-semibold uppercase tracking-wide">Unidades</th>
                                    <th class="pb-3 px-3 text-right text-xs text-gray-400 font-semibold uppercase tracking-wide">Ingresos</th>
                                </tr>
                            </thead>
                            <tbody>${topProductosHtml}</tbody>
                        </table>
                    </div>
                </article>

                <!-- Ventas recientes -->
                <article class="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                    <div class="flex items-center justify-between mb-5">
                        <div>
                            <p class="text-xs uppercase tracking-[0.18em] text-[#a0346e] font-semibold mb-1">Historial reciente</p>
                            <h3 class="text-xl font-bold text-[#6d165a]">Últimas Ventas</h3>
                        </div>
                        <button onclick="window.switchTab('sales')" class="text-sm font-semibold text-[#ec5c8d] hover:text-[#a0346e] transition">
                            Ver todas <i class="fa-solid fa-arrow-right ml-1 text-xs"></i>
                        </button>
                    </div>
                    <div>${ventasHtml}</div>
                </article>
            </div>

            <!-- Right col: Deudas + Stock bajo -->
            <div class="space-y-6">

                <!-- Deudas activas -->
                <article class="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                    <div class="flex items-center justify-between mb-5">
                        <div>
                            <p class="text-xs uppercase tracking-[0.18em] text-[#a0346e] font-semibold mb-1">Por cobrar</p>
                            <h3 class="text-xl font-bold text-[#6d165a]">Deudas activas</h3>
                        </div>
                        <button onclick="window.switchTab('debts')" class="text-sm font-semibold text-[#ec5c8d] hover:text-[#a0346e] transition">
                            Ver todas <i class="fa-solid fa-arrow-right ml-1 text-xs"></i>
                        </button>
                    </div>
                    <div>${deudasHtml}</div>
                </article>

                <!-- Stock bajo -->
                <article class="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                    <div class="flex items-center justify-between mb-5">
                        <div>
                            <p class="text-xs uppercase tracking-[0.18em] text-[#a0346e] font-semibold mb-1">Requieren atención</p>
                            <h3 class="text-xl font-bold text-[#6d165a]">Stock bajo</h3>
                        </div>
                        <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6d165a] to-[#a0346e] flex items-center justify-center">
                            <i class="fa-solid fa-boxes-stacked text-white text-sm"></i>
                        </div>
                    </div>
                    <div class="space-y-0.5">${stockHtml}</div>
                </article>
            </div>
        </div>

        <!-- Footer -->
        <div class="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
            <p class="text-xs text-gray-400"><i class="fa-regular fa-clock mr-1"></i>Actualizado: ${now}</p>
            <button onclick="window.reloadDashboard()" class="px-4 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold text-xs transition">
                <i class="fa-solid fa-rotate-right mr-1"></i>Actualizar
            </button>
        </div>
    `;
}

// ─────────────────────────────────────────────────────────────
// Deudas Tab — módulo completo: ver pendientes, abonos, pagar
// ─────────────────────────────────────────────────────────────
async function renderDeudasTab() {
    if (deudasCache) {
        renderDeudasContent(deudasCache);
        return;
    }

    panel.innerHTML = `
        <div class="flex flex-col items-center justify-center py-24 gap-4">
            <div class="w-12 h-12 border-4 border-[#ec5c8d] border-t-transparent rounded-full animate-spin"></div>
            <p class="text-gray-400 text-sm font-medium">Cargando deudas pendientes...</p>
        </div>
    `;

    try {
        const token = localStorage.getItem('discordia_admin_token');
        const res = await fetch('/api/debts', {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!json.ok) throw new Error(json.message || 'Error del servidor');
        deudasCache = json.data;
        renderDeudasContent(deudasCache);
    } catch (err) {
        panel.innerHTML = `
            <div class="bg-white border border-gray-100 rounded-2xl p-10 shadow-sm text-center">
                <div class="text-5xl mb-4">⚠️</div>
                <h3 class="text-xl font-bold text-[#6d165a] mb-2">No se pudieron cargar las deudas</h3>
                <p class="text-gray-500 text-sm mb-6">${err.message}</p>
                <button onclick="window.reloadDeudas()" class="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#ec5c8d] to-[#ff8c91] text-white font-semibold text-sm shadow-md">Reintentar</button>
            </div>
        `;
    }
}

window.reloadDeudas = function () {
    deudasCache = null;
    dashboardCache = null; // forzar refresh del dashboard también
    renderDeudasTab();
};

function renderDeudasContent(data) {
    const { customers, totalDebt, totalPendingSales } = data;

    // ── KPI hero ──────────────────────────────────────────────
    const kpiHtml = `
        <article class="bg-gradient-to-r from-[#6d165a] to-[#a0346e] rounded-2xl p-6 md:p-8 shadow-lg mb-6 text-white">
            <div class="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <p class="text-xs uppercase tracking-[0.18em] text-[#ffc4a6] font-semibold mb-2">Por cobrar en total</p>
                    <p class="text-5xl font-bold">$${Number(totalDebt).toLocaleString('es-CO')}</p>
                    <p class="text-[#ffc4a6] mt-3 text-sm">
                        ${customers.length} cliente${customers.length !== 1 ? 's' : ''} &nbsp;·&nbsp;
                        ${totalPendingSales} venta${totalPendingSales !== 1 ? 's' : ''} pendiente${totalPendingSales !== 1 ? 's' : ''}
                    </p>
                </div>
                <div class="flex flex-col items-end gap-3">
                    <div class="w-16 h-16 rounded-2xl bg-white/15 flex items-center justify-center">
                        <i class="fa-solid fa-file-invoice-dollar text-3xl text-white"></i>
                    </div>
                    <button onclick="window.reloadDeudas()" class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white font-semibold text-sm transition">
                        <i class="fa-solid fa-rotate-right"></i>Actualizar
                    </button>
                </div>
            </div>
        </article>
    `;

    // ── Tarjetas por cliente ──────────────────────────────────
    let customerCardsHtml = '';

    if (customers.length === 0) {
        customerCardsHtml = `
            <article class="bg-white border border-gray-100 rounded-2xl p-12 shadow-sm text-center">
                <div class="text-6xl mb-4">🎉</div>
                <h3 class="text-2xl font-bold text-[#6d165a] mb-2">¡Sin deudas pendientes!</h3>
                <p class="text-gray-500">Todos los pedidos han sido pagados.</p>
            </article>
        `;
    } else {
        customerCardsHtml = customers.map(customer => {
            const phoneDigits = (customer.phone || '').replace(/\D/g, '');
            const waHref = phoneDigits
                ? `https://wa.me/57${phoneDigits}?text=Hola%20${encodeURIComponent(customer.name)}%2C%20te%20escribimos%20de%20DISCORDIA%20por%20tu%20pedido%20pendiente.`
                : null;

            const salesHtml = customer.sales.map(sale => {
                const fecha = new Date(sale.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: '2-digit' });
                const hasPartial = sale.paid_amount > 0;
                const pct = Math.round((sale.paid_amount / sale.total) * 100);

                const itemsStr = sale.items.length > 0
                    ? sale.items.map(i => `${i.product_name} x${i.quantity}`).join(', ')
                    : sale.channel || 'Venta manual';

                return `
                    <div class="border border-gray-100 rounded-xl p-4 bg-gray-50 hover:bg-[#fdf7fa] transition" data-sale-id="${sale.id}">
                        <div class="flex items-start justify-between gap-3 flex-wrap mb-3">
                            <div class="flex-1 min-w-0">
                                <div class="flex items-center gap-2 flex-wrap">
                                    <span class="text-xs font-semibold text-gray-400 uppercase tracking-wide">${fecha}</span>
                                    <span class="text-xs px-2 py-0.5 rounded-full bg-white border border-gray-200 text-gray-600">${sale.channel || 'Manual'}</span>
                                    ${hasPartial ? `<span class="text-xs px-2 py-0.5 rounded-full bg-amber-50 border border-amber-100 text-amber-700 font-semibold">Abonado ${pct}%</span>` : ''}
                                </div>
                                <p class="text-sm text-gray-600 mt-1.5 leading-snug line-clamp-2">${itemsStr}</p>
                            </div>
                            <div class="text-right flex-shrink-0">
                                <p class="text-xl font-bold text-rose-600">$${Number(sale.remaining).toLocaleString('es-CO')}</p>
                                ${hasPartial ? `<p class="text-xs text-gray-400">de $${Number(sale.total).toLocaleString('es-CO')}</p>` : '<p class="text-xs text-gray-400">total</p>'}
                            </div>
                        </div>

                        ${hasPartial ? `
                        <div class="w-full bg-gray-200 rounded-full h-1.5 mb-3">
                            <div class="bg-gradient-to-r from-[#ec5c8d] to-[#ff8c91] h-1.5 rounded-full transition-all" style="width:${pct}%"></div>
                        </div>
                        ` : ''}

                        <div class="flex items-center gap-2 flex-wrap">
                            <button
                                class="btn-abono inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#fdf2f7] border border-[#f1d7e2] text-[#a0346e] font-semibold text-xs hover:bg-[#f1d7e2] transition"
                                data-sale-id="${sale.id}"
                                data-remaining="${sale.remaining}"
                                data-name="${customer.name.replace(/"/g, '&quot;')}">
                                <i class="fa-solid fa-plus"></i>Registrar abono
                            </button>
                            <button
                                class="btn-pagar inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-700 font-semibold text-xs hover:bg-emerald-100 transition"
                                data-sale-id="${sale.id}"
                                data-remaining="${sale.remaining}"
                                data-name="${customer.name.replace(/"/g, '&quot;')}">
                                <i class="fa-solid fa-check"></i>Marcar pagado
                            </button>
                        </div>
                    </div>
                `;
            }).join('');

            return `
                <article class="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden mb-4">
                    <!-- Header del cliente -->
                    <div class="p-5 flex items-center gap-4 flex-wrap border-b border-[#f1d7e2]">
                        <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-[#6d165a] to-[#a0346e] flex items-center justify-center text-white text-xl font-bold flex-shrink-0 shadow-sm">
                            ${(customer.name || '?').charAt(0).toUpperCase()}
                        </div>
                        <div class="flex-1 min-w-0">
                            <h4 class="font-bold text-[#6d165a] text-lg leading-tight">${customer.name}</h4>
                            <p class="text-sm text-gray-500">${customer.phone || 'Sin teléfono'}</p>
                        </div>
                        <div class="flex items-center gap-3 flex-wrap ml-auto">
                            ${waHref ? `
                            <a href="${waHref}" target="_blank" rel="noopener noreferrer"
                               class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 font-semibold text-sm hover:bg-emerald-100 transition border border-emerald-100">
                                <i class="fa-brands fa-whatsapp text-base"></i>WhatsApp
                            </a>
                            ` : ''}
                            <div class="text-right">
                                <p class="text-xs uppercase tracking-wide text-gray-400 font-semibold">Deuda total</p>
                                <p class="text-2xl font-bold text-rose-600">$${Number(customer.total_debt).toLocaleString('es-CO')}</p>
                            </div>
                        </div>
                    </div>
                    <!-- Ventas pendientes -->
                    <div class="p-4 space-y-3">
                        ${salesHtml}
                    </div>
                </article>
            `;
        }).join('');
    }

    panel.innerHTML = kpiHtml + `<div id="deudas-list">${customerCardsHtml}</div>`;

    // ── Event listeners ───────────────────────────────────────
    panel.querySelectorAll('.btn-abono').forEach(btn => {
        btn.addEventListener('click', () => showAbonoModal(btn.dataset.saleId, Number(btn.dataset.remaining), btn.dataset.name));
    });
    panel.querySelectorAll('.btn-pagar').forEach(btn => {
        btn.addEventListener('click', () => confirmarPagar(btn.dataset.saleId, Number(btn.dataset.remaining), btn.dataset.name));
    });
}

async function postDebtAction(payload) {
    const token = localStorage.getItem('discordia_admin_token');
    const res = await fetch('/api/debts', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
    });
    const json = await res.json();
    if (!res.ok || !json.ok) throw new Error(json.message || `HTTP ${res.status}`);
    return json;
}

function showAbonoModal(saleId, remaining, customerName) {
    Swal.fire({
        title: 'Registrar abono',
        html: `
            <p class="text-gray-500 text-sm mb-4">
                Saldo pendiente de <strong>${customerName}</strong>:
                <strong class="text-rose-600">$${Number(remaining).toLocaleString('es-CO')}</strong>
            </p>
            <input
                id="swal-abono-amount"
                type="number"
                min="1"
                max="${remaining}"
                step="1000"
                class="swal2-input"
                placeholder="Monto del abono (COP)">
            <p class="text-xs text-gray-400 mt-2">Si el abono cubre el total, la venta quedará marcada como pagada.</p>
        `,
        showCancelButton: true,
        confirmButtonText: 'Registrar abono',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#ec5c8d',
        focusConfirm: false,
        preConfirm: () => {
            const amount = Number(document.getElementById('swal-abono-amount').value);
            if (!amount || amount <= 0) {
                Swal.showValidationMessage('Ingresa un monto mayor a $0');
                return false;
            }
            return amount;
        }
    }).then(async (result) => {
        if (!result.isConfirmed) return;
        const amount = result.value;

        try {
            const json = await postDebtAction({ action: 'abono', sale_id: Number(saleId), amount });
            const msg = json.fullyPaid
                ? `¡Deuda liquidada! ${customerName} ya no tiene saldo pendiente.`
                : `Abono de $${amount.toLocaleString('es-CO')} registrado. Restante: $${Number(json.remaining).toLocaleString('es-CO')}`;

            await Swal.fire({
                title: 'Abono registrado',
                text: msg,
                icon: 'success',
                confirmButtonColor: '#ec5c8d'
            });

            window.reloadDeudas();
        } catch (err) {
            Swal.fire('Error', err.message, 'error');
        }
    });
}

function confirmarPagar(saleId, remaining, customerName) {
    Swal.fire({
        title: '¿Marcar como pagado?',
        html: `
            <p class="text-gray-600 text-sm">
                Se marcará la venta de <strong>${customerName}</strong> como completamente pagada.
            </p>
            <p class="text-rose-600 font-bold text-lg mt-3">
                $${Number(remaining).toLocaleString('es-CO')}
            </p>
        `,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, marcar pagado',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#10b981'
    }).then(async (result) => {
        if (!result.isConfirmed) return;

        try {
            await postDebtAction({ action: 'marcar_pagado', sale_id: Number(saleId) });

            await Swal.fire({
                title: '¡Pagado!',
                text: `La venta de ${customerName} fue marcada como pagada.`,
                icon: 'success',
                confirmButtonColor: '#ec5c8d'
            });

            window.reloadDeudas();
        } catch (err) {
            Swal.fire('Error', err.message, 'error');
        }
    });
}

// ─────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────
// Catálogo Tab — historial completo + CRUD de productos vía API
// ─────────────────────────────────────────────────────────────
async function renderCatalogTab() {
    if (catalogCache) {
        renderCatalogContent(catalogCache);
        return;
    }

    panel.innerHTML = `
        <div class="flex flex-col items-center justify-center py-24 gap-4">
            <div class="w-12 h-12 border-4 border-[#ec5c8d] border-t-transparent rounded-full animate-spin"></div>
            <p class="text-gray-400 text-sm font-medium">Cargando catálogo...</p>
        </div>
    `;

    try {
        const token = localStorage.getItem('discordia_admin_token');
        const res = await fetch('/api/catalog', {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!json.ok) throw new Error(json.message || 'Error del servidor');
        catalogCache = json.data;
        renderCatalogContent(catalogCache);
    } catch (err) {
        panel.innerHTML = `
            <div class="bg-white border border-gray-100 rounded-2xl p-10 shadow-sm text-center">
                <div class="text-5xl mb-4">⚠️</div>
                <h3 class="text-xl font-bold text-[#6d165a] mb-2">No se pudo cargar el catálogo</h3>
                <p class="text-gray-500 text-sm mb-6">${err.message}</p>
                <button onclick="window.reloadCatalog()" class="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#ec5c8d] to-[#ff8c91] text-white font-semibold text-sm shadow-md">Reintentar</button>
            </div>
        `;
    }
}

window.reloadCatalog = function () {
    catalogCache = null;
    dashboardCache = null;
    renderCatalogTab();
};

function renderCatalogContent(data) {
    const { products, meta } = data;

    // ── KPI cards ──────────────────────────────────────────────
    const kpiHtml = `
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <article class="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex items-start gap-3">
                <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ec5c8d] to-[#ff8c91] flex items-center justify-center flex-shrink-0">
                    <i class="fa-solid fa-box-open text-white text-sm"></i>
                </div>
                <div>
                    <p class="text-xs uppercase tracking-[0.18em] text-[#a0346e] font-semibold">Productos</p>
                    <p class="text-3xl font-bold text-[#6d165a]">${meta.total}</p>
                    <p class="text-xs text-gray-400 mt-0.5">activos en BD</p>
                </div>
            </article>
            <article class="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex items-start gap-3">
                <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6d165a] to-[#a0346e] flex items-center justify-center flex-shrink-0">
                    <i class="fa-solid fa-tag text-white text-sm"></i>
                </div>
                <div>
                    <p class="text-xs uppercase tracking-[0.18em] text-[#a0346e] font-semibold">Categorías</p>
                    <p class="text-3xl font-bold text-[#6d165a]">${meta.categories}</p>
                    <p class="text-xs text-gray-400 mt-0.5">distintas</p>
                </div>
            </article>
            <article class="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex items-start gap-3">
                <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ffc4a6] to-[#ff8c91] flex items-center justify-center flex-shrink-0">
                    <i class="fa-solid fa-triangle-exclamation text-[#6d165a] text-sm"></i>
                </div>
                <div>
                    <p class="text-xs uppercase tracking-[0.18em] text-[#a0346e] font-semibold">Stock bajo</p>
                    <p class="text-3xl font-bold ${meta.lowStock > 0 ? 'text-rose-600' : 'text-emerald-600'}">${meta.lowStock}</p>
                    <p class="text-xs text-gray-400 mt-0.5">≤ 5 unidades</p>
                </div>
            </article>
            <article class="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex items-start gap-3">
                <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-[#a0346e] to-[#ec5c8d] flex items-center justify-center flex-shrink-0">
                    <i class="fa-solid fa-sack-dollar text-white text-sm"></i>
                </div>
                <div>
                    <p class="text-xs uppercase tracking-[0.18em] text-[#a0346e] font-semibold">Valor inventario</p>
                    <p class="text-3xl font-bold text-[#6d165a]">$${Number(meta.totalValue).toLocaleString('es-CO')}</p>
                    <p class="text-xs text-gray-400 mt-0.5">precio × stock</p>
                </div>
            </article>
        </div>
    `;

    // Categorías disponibles para el filtro
    const allCats = [...new Set(products.map(p => p.category).filter(Boolean))].sort();
    const catOpts = ['<option value="">Todas las categorías</option>',
        ...allCats.map(c => `<option value="${c}" ${uiState.catalogCategoryFilter === c ? 'selected' : ''}>${c}</option>`)
    ].join('');

    // ── Filtros ────────────────────────────────────────────────
    const filterHtml = `
        <div class="flex flex-wrap items-center gap-2 mb-4">
            <input id="catalog-search" type="search" placeholder="Buscar por nombre, categoría…"
                class="px-3 py-2 rounded-xl border border-gray-200 text-sm flex-1 min-w-[200px] focus:outline-none focus:border-[#ec5c8d]"
                value="${uiState.catalogQuery}">
            <select id="catalog-category-filter" class="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#ec5c8d] bg-white">
                ${catOpts}
            </select>
            <label class="inline-flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
                <input id="catalog-low-stock" type="checkbox" class="accent-[#ec5c8d]" ${uiState.catalogLowStockOnly ? 'checked' : ''}>
                Solo stock bajo
            </label>
            <span id="catalog-count" class="text-xs text-gray-400 ml-auto"></span>
        </div>
    `;

    // ── Tabla ──────────────────────────────────────────────────
    const tableHtml = `
        <div class="overflow-x-auto">
            <table class="min-w-full text-sm" id="catalog-table">
                <thead class="bg-[#fdf2f7] text-[#6d165a]">
                    <tr>
                        <th class="p-3 text-left w-20 hidden sm:table-cell"></th>
                        <th class="p-3 text-left">Producto</th>
                        <th class="p-3 text-right">Precio</th>
                        <th class="p-3 text-center">Stock</th>
                        <th class="p-3 text-left hidden md:table-cell">Categoría</th>
                        <th class="p-3 text-center">Acciones</th>
                    </tr>
                </thead>
                <tbody id="catalog-tbody"></tbody>
            </table>
        </div>
    `;

    panel.innerHTML = kpiHtml + `
        <article class="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            <div class="flex items-center justify-between gap-3 p-5 border-b border-gray-100">
                <div>
                    <p class="text-xs uppercase tracking-[0.18em] text-[#a0346e] font-semibold mb-1">Inventario</p>
                    <h3 class="text-2xl font-bold text-[#6d165a]">Catálogo</h3>
                </div>
                <div class="flex items-center gap-2">
                    <button onclick="window.reloadCatalog()" class="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 transition" title="Actualizar">
                        <i class="fa-solid fa-rotate-right text-sm"></i>
                    </button>
                    <button id="add-product" class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#ec5c8d] to-[#ff8c91] text-white font-semibold text-sm shadow-md hover:shadow-lg transition">
                        <i class="fa-solid fa-plus"></i>Agregar producto
                    </button>
                </div>
            </div>
            <div class="p-5">
                ${filterHtml}
                ${tableHtml}
            </div>
        </article>
    `;

    applyCatalogFilters(products);

    // Listeners filtros
    document.getElementById('catalog-search').addEventListener('input', e => {
        uiState.catalogQuery = e.target.value;
        applyCatalogFilters(products);
    });
    document.getElementById('catalog-category-filter').addEventListener('change', e => {
        uiState.catalogCategoryFilter = e.target.value;
        applyCatalogFilters(products);
    });
    document.getElementById('catalog-low-stock').addEventListener('change', e => {
        uiState.catalogLowStockOnly = e.target.checked;
        applyCatalogFilters(products);
    });

    document.getElementById('add-product').addEventListener('click', () => showProductModal(null, data));
}

function applyCatalogFilters(products) {
    const query = (uiState.catalogQuery || '').trim().toLowerCase();
    const category = uiState.catalogCategoryFilter || '';
    const lowOnly = !!uiState.catalogLowStockOnly;

    const filtered = products.filter(p => {
        const matchQ = !query || `${p.name} ${p.category || ''} ${p.description || ''}`.toLowerCase().includes(query);
        const matchCat = !category || p.category === category;
        const matchLow = !lowOnly || Number(p.stock) <= 5;
        return matchQ && matchCat && matchLow;
    });

    const countEl = document.getElementById('catalog-count');
    if (countEl) countEl.textContent = `Mostrando ${filtered.length} de ${products.length}`;

    const tbody = document.getElementById('catalog-tbody');
    if (!tbody) return;

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="p-8 text-center text-gray-400">Sin resultados para el filtro actual.</td></tr>`;
        return;
    }

    tbody.innerHTML = filtered.map(p => {
        const isLow = Number(p.stock) <= 5;
        const stockClass = isLow ? 'text-rose-600 font-bold' : 'text-gray-900 font-semibold';
        const imgSrc = p.image || 'assets/default.png';

        return `
            <tr class="border-b border-gray-100 hover:bg-[#fdf7fa] transition">
                <td class="p-3 hidden sm:table-cell">
                    <img src="${imgSrc}" alt="${p.name}"
                        class="w-12 h-12 rounded-xl object-cover border border-gray-100"
                        onerror="this.src='assets/default.png'; this.onerror=null;">
                </td>
                <td class="p-3">
                    <p class="font-semibold text-gray-900 leading-tight">${p.name}</p>
                    <p class="text-xs text-gray-400 mt-0.5 line-clamp-1">${p.description || 'Sin descripción'}</p>
                </td>
                <td class="p-3 text-right">
                    <span class="font-bold text-[#a0346e]">$${Number(p.price).toLocaleString('es-CO')}</span>
                </td>
                <td class="p-3 text-center">
                    <span class="${stockClass}">${p.stock}</span>
                    ${isLow ? '<span class="ml-1 text-xs text-rose-400">⚠</span>' : ''}
                </td>
                <td class="p-3 hidden md:table-cell">
                    ${p.category ? `<span class="text-xs px-2 py-0.5 rounded-full bg-[#fdf2f7] text-[#a0346e] border border-[#f1d7e2]">${p.category}</span>` : '<span class="text-gray-300">—</span>'}
                </td>
                <td class="p-3 text-center">
                    <div class="flex justify-center gap-1.5">
                        <button class="edit-product-btn p-2 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 transition" data-id="${p.id}" title="Editar">
                            <i class="fa-solid fa-pen text-xs pointer-events-none"></i>
                        </button>
                        <button class="delete-product-btn p-2 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition" data-id="${p.id}" title="Eliminar">
                            <i class="fa-solid fa-trash-can text-xs pointer-events-none"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    // Delegación de eventos en tbody
    tbody.addEventListener('click', e => {
        const editBtn = e.target.closest('.edit-product-btn');
        const deleteBtn = e.target.closest('.delete-product-btn');
        if (editBtn) {
            const prod = catalogCache?.products.find(p => Number(p.id) === Number(editBtn.dataset.id));
            if (prod) showProductModal(prod, catalogCache);
        }
        if (deleteBtn) {
            deleteProduct(Number(deleteBtn.dataset.id));
        }
    });
}

function showProductModal(product, data) {
    const editing = product != null;
    const categories = data ? [...new Set(data.products.map(p => p.category).filter(Boolean))].sort() : [];
    const catOpts = categories.map(c => `<option ${product?.category === c ? 'selected' : ''}>${c}</option>`).join('');

    Swal.fire({
        title: editing ? 'Editar producto' : 'Nuevo producto',
        width: 560,
        html: `
            <style>#swal2-html-container { text-align: left; }</style>
            <div class="space-y-3 pt-1">
                <div>
                    <label class="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Nombre *</label>
                    <input id="sp-name" class="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#ec5c8d]"
                        placeholder="Ej: Labial Mate Rosa" value="${product?.name || ''}">
                </div>
                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label class="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Precio *</label>
                        <input id="sp-price" type="number" min="0" class="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#ec5c8d]"
                            placeholder="Ej: 25000" value="${product?.price ?? ''}">
                    </div>
                    <div>
                        <label class="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Stock</label>
                        <input id="sp-stock" type="number" min="0" class="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#ec5c8d]"
                            placeholder="0" value="${product?.stock ?? 0}">
                    </div>
                </div>
                <div>
                    <label class="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Categoría</label>
                    <input id="sp-category" list="sp-cat-list" class="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#ec5c8d]"
                        placeholder="Ej: Labiales" value="${product?.category || ''}">
                    <datalist id="sp-cat-list">${catOpts}</datalist>
                </div>
                <div>
                    <label class="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Imagen (ruta o URL)</label>
                    <input id="sp-image" class="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#ec5c8d]"
                        placeholder="assets/producto.jpg" value="${product?.image || 'assets/default.png'}">
                </div>
                <div>
                    <label class="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Descripción</label>
                    <textarea id="sp-description" class="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#ec5c8d] resize-none h-20"
                        placeholder="Descripción breve del producto (opcional)">${product?.description || ''}</textarea>
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: editing ? '<i class="fa-solid fa-floppy-disk mr-1"></i>Guardar' : '<i class="fa-solid fa-plus mr-1"></i>Agregar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#ec5c8d',
        showLoaderOnConfirm: true,
        preConfirm: async () => {
            const name = document.getElementById('sp-name').value.trim();
            const price = Number(document.getElementById('sp-price').value);
            const stock = Number(document.getElementById('sp-stock').value);
            const category = document.getElementById('sp-category').value.trim();
            const image = document.getElementById('sp-image').value.trim() || 'assets/default.png';
            const description = document.getElementById('sp-description').value.trim();

            if (!name) { Swal.showValidationMessage('El nombre es requerido.'); return false; }
            if (isNaN(price) || price < 0) { Swal.showValidationMessage('El precio debe ser un número >= 0.'); return false; }
            if (isNaN(stock) || stock < 0) { Swal.showValidationMessage('El stock debe ser un número >= 0.'); return false; }

            const token = localStorage.getItem('discordia_admin_token');
            const method = editing ? 'PUT' : 'POST';
            const body = editing
                ? { id: product.id, name, price, stock, category, image, description }
                : { name, price, stock, category, image, description };

            const res = await fetch('/api/catalog', {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify(body)
            });
            const json = await res.json();
            if (!res.ok || !json.ok) { Swal.showValidationMessage(json.message || `HTTP ${res.status}`); return false; }
            return json.data;
        },
        allowOutsideClick: () => !Swal.isLoading()
    }).then(result => {
        if (!result.isConfirmed || !result.value) return;
        Swal.fire({
            title: editing ? 'Producto actualizado' : 'Producto agregado',
            text: result.value.name,
            icon: 'success',
            timer: 1800,
            showConfirmButton: false
        });
        window.reloadCatalog();
    });
}

async function deleteProduct(productId) {
    const product = catalogCache?.products.find(p => Number(p.id) === Number(productId));
    const name = product?.name || `#${productId}`;

    const confirm = await Swal.fire({
        title: '¿Eliminar producto?',
        text: name,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Eliminar',
        confirmButtonColor: '#ec5c8d',
        cancelButtonText: 'Cancelar'
    });
    if (!confirm.isConfirmed) return;

    try {
        const token = localStorage.getItem('discordia_admin_token');
        const res = await fetch('/api/catalog', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: JSON.stringify({ id: productId })
        });
        const json = await res.json();
        if (!res.ok || !json.ok) throw new Error(json.message || `HTTP ${res.status}`);
        Swal.fire({ title: 'Eliminado', text: name, icon: 'success', timer: 1500, showConfirmButton: false });
        window.reloadCatalog();
    } catch (err) {
        Swal.fire('Error', err.message, 'error');
    }
}

function restoreCatalog() {
    window.reloadCatalog();
}

// ─────────────────────────────────────────────────────────────
// Ventas Tab — historial completo + nueva venta multi-producto
// ─────────────────────────────────────────────────────────────
async function renderSalesTab() {
    if (salesCache) {
        renderSalesContent(salesCache);
        return;
    }

    panel.innerHTML = `
        <div class="flex flex-col items-center justify-center py-24 gap-4">
            <div class="w-12 h-12 border-4 border-[#ec5c8d] border-t-transparent rounded-full animate-spin"></div>
            <p class="text-gray-400 text-sm font-medium">Cargando historial de ventas...</p>
        </div>
    `;

    try {
        const token = localStorage.getItem('discordia_admin_token');
        const res = await fetch('/api/sales', {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!json.ok) throw new Error(json.message || 'Error del servidor');
        salesCache = json.data;
        nvState = null;
        renderSalesContent(salesCache);
    } catch (err) {
        panel.innerHTML = `
            <div class="bg-white border border-gray-100 rounded-2xl p-10 shadow-sm text-center">
                <div class="text-5xl mb-4">⚠️</div>
                <h3 class="text-xl font-bold text-[#6d165a] mb-2">No se pudo cargar el historial</h3>
                <p class="text-gray-500 text-sm mb-6">${err.message}</p>
                <button onclick="window.reloadSales()" class="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#ec5c8d] to-[#ff8c91] text-white font-semibold text-sm shadow-md">Reintentar</button>
            </div>
        `;
    }
}

window.reloadSales = function () {
    salesCache = null;
    deudasCache = null;
    dashboardCache = null;
    nvState = null;
    renderSalesTab();
};

function resetNvState(products, customers) {
    nvState = {
        open: false,
        products,
        customers,
        items: [{ product_id: '', product_name: '', price: 0, quantity: 1 }],
        customer_name: '',
        customer_phone: '',
        customer_email: '',
        channel: 'Nequi',
        payment_status: 'paid',
        notes: '',
        date: new Date().toISOString().slice(0, 10)
    };
}

function renderSalesContent(data) {
    const { sales, meta, products, customers } = data;

    if (!nvState) resetNvState(products, customers);

    // ── KPI cards ─────────────────────────────────────────────
    const kpiHtml = `
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <article class="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex items-start gap-3">
                <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ec5c8d] to-[#ff8c91] flex items-center justify-center flex-shrink-0">
                    <i class="fa-solid fa-cart-shopping text-white text-sm"></i>
                </div>
                <div>
                    <p class="text-xs uppercase tracking-[0.18em] text-[#a0346e] font-semibold">Total ventas</p>
                    <p class="text-3xl font-bold text-[#6d165a]">${meta.total}</p>
                    <p class="text-xs text-gray-400 mt-0.5">registros en BD</p>
                </div>
            </article>
            <article class="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex items-start gap-3">
                <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6d165a] to-[#a0346e] flex items-center justify-center flex-shrink-0">
                    <i class="fa-solid fa-sack-dollar text-white text-sm"></i>
                </div>
                <div>
                    <p class="text-xs uppercase tracking-[0.18em] text-[#a0346e] font-semibold">Ingresos totales</p>
                    <p class="text-3xl font-bold text-[#6d165a]">$${Number(meta.totalRevenue).toLocaleString('es-CO')}</p>
                    <p class="text-xs text-gray-400 mt-0.5">todas las ventas</p>
                </div>
            </article>
            <article class="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex items-start gap-3">
                <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-[#a0346e] to-[#ec5c8d] flex items-center justify-center flex-shrink-0">
                    <i class="fa-solid fa-circle-check text-white text-sm"></i>
                </div>
                <div>
                    <p class="text-xs uppercase tracking-[0.18em] text-[#a0346e] font-semibold">Pagado</p>
                    <p class="text-3xl font-bold text-emerald-600">$${Number(meta.totalPaid).toLocaleString('es-CO')}</p>
                    <p class="text-xs text-gray-400 mt-0.5">${sales.filter(s => s.payment_status === 'paid').length} ventas</p>
                </div>
            </article>
            <article class="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex items-start gap-3">
                <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ffc4a6] to-[#ff8c91] flex items-center justify-center flex-shrink-0">
                    <i class="fa-solid fa-clock text-[#6d165a] text-sm"></i>
                </div>
                <div>
                    <p class="text-xs uppercase tracking-[0.18em] text-[#a0346e] font-semibold">Pendiente</p>
                    <p class="text-3xl font-bold text-rose-600">$${Number(meta.totalPending).toLocaleString('es-CO')}</p>
                    <p class="text-xs text-gray-400 mt-0.5">${sales.filter(s => s.payment_status === 'pending').length} ventas</p>
                </div>
            </article>
        </div>
    `;

    // ── Nueva venta form ──────────────────────────────────────
    const formHtml = renderNuevaVentaForm(products, customers);

    // ── Filtros ───────────────────────────────────────────────
    const channels = [...new Set(sales.map(s => s.channel).filter(Boolean))];
    const channelOpts = ['<option value="">Todos los canales</option>', ...channels.map(c => `<option value="${c}" ${uiState.salesChannel === c ? 'selected' : ''}>${c}</option>`)].join('');

    const filterHtml = `
        <div class="flex flex-wrap items-center gap-2 mb-4">
            <input id="sales-search" type="search" placeholder="Buscar por cliente, canal…"
                class="px-3 py-2 rounded-xl border border-gray-200 text-sm flex-1 min-w-[200px] focus:outline-none focus:border-[#ec5c8d]"
                value="${uiState.salesQuery}">
            <select id="sales-channel-filter" class="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#ec5c8d]">
                ${channelOpts}
            </select>
            <select id="sales-status-filter" class="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#ec5c8d]">
                <option value="">Todos los estados</option>
                <option value="paid" ${uiState.salesStatus === 'paid' ? 'selected' : ''}>Pagadas</option>
                <option value="pending" ${uiState.salesStatus === 'pending' ? 'selected' : ''}>Pendientes</option>
            </select>
            <span id="sales-count" class="text-xs text-gray-400 ml-auto"></span>
        </div>
    `;

    // ── History table ─────────────────────────────────────────
    const tableHtml = `
        <div class="overflow-x-auto">
            <table class="min-w-full text-sm" id="sales-table">
                <thead class="bg-[#fdf2f7] text-[#6d165a]">
                    <tr>
                        <th class="p-3 text-left w-8"></th>
                        <th class="p-3 text-left">Fecha</th>
                        <th class="p-3 text-left">Cliente</th>
                        <th class="p-3 text-left hidden md:table-cell">Canal</th>
                        <th class="p-3 text-center hidden sm:table-cell">Items</th>
                        <th class="p-3 text-right">Total</th>
                        <th class="p-3 text-center">Estado</th>
                    </tr>
                </thead>
                <tbody id="sales-tbody"></tbody>
            </table>
        </div>
    `;

    panel.innerHTML = kpiHtml + `
        <article class="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            <!-- Header con toggle nueva venta -->
            <div class="flex items-center justify-between gap-3 p-5 border-b border-gray-100">
                <div>
                    <p class="text-xs uppercase tracking-[0.18em] text-[#a0346e] font-semibold mb-1">Historial completo</p>
                    <h3 class="text-2xl font-bold text-[#6d165a]">Ventas</h3>
                </div>
                <div class="flex items-center gap-2">
                    <button onclick="window.reloadSales()" class="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 transition" title="Actualizar">
                        <i class="fa-solid fa-rotate-right text-sm"></i>
                    </button>
                    <button id="toggle-nueva-venta"
                        class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#ec5c8d] to-[#ff8c91] text-white font-semibold text-sm shadow-md hover:shadow-lg transition">
                        <i class="fa-solid fa-plus"></i>Nueva venta
                    </button>
                </div>
            </div>

            <!-- Formulario nueva venta (oculto por defecto) -->
            <div id="nueva-venta-container" class="${nvState.open ? '' : 'hidden'}">
                ${formHtml}
            </div>

            <!-- Filtros + tabla -->
            <div class="p-5">
                ${filterHtml}
                ${tableHtml}
            </div>
        </article>
    `;

    // Poblar tabla con todos los datos inicialmente
    applySalesFilters(sales);

    // Listeners filtros
    document.getElementById('sales-search').addEventListener('input', e => {
        uiState.salesQuery = e.target.value;
        applySalesFilters(sales);
    });
    document.getElementById('sales-channel-filter').addEventListener('change', e => {
        uiState.salesChannel = e.target.value;
        applySalesFilters(sales);
    });
    document.getElementById('sales-status-filter').addEventListener('change', e => {
        uiState.salesStatus = e.target.value;
        applySalesFilters(sales);
    });

    // Toggle formulario
    document.getElementById('toggle-nueva-venta').addEventListener('click', () => {
        nvState.open = !nvState.open;
        const container = document.getElementById('nueva-venta-container');
        const btn = document.getElementById('toggle-nueva-venta');
        if (nvState.open) {
            container.classList.remove('hidden');
            btn.innerHTML = '<i class="fa-solid fa-xmark"></i>Cerrar';
            container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } else {
            container.classList.add('hidden');
            btn.innerHTML = '<i class="fa-solid fa-plus"></i>Nueva venta';
        }
    });

    // Listeners del formulario
    bindNuevaVentaListeners(products, customers, sales);
}

function applySalesFilters(sales) {
    const query = (uiState.salesQuery || '').trim().toLowerCase();
    const channel = uiState.salesChannel || '';
    const status = uiState.salesStatus || '';

    const filtered = sales.filter(s => {
        const matchQuery = !query || `${s.customer_name || ''} ${s.channel || ''} ${s.notes || ''}`.toLowerCase().includes(query);
        const matchChannel = !channel || s.channel === channel;
        const matchStatus = !status || s.payment_status === status;
        return matchQuery && matchChannel && matchStatus;
    });

    const countEl = document.getElementById('sales-count');
    if (countEl) countEl.textContent = `Mostrando ${filtered.length} de ${sales.length}`;

    const tbody = document.getElementById('sales-tbody');
    if (!tbody) return;

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="p-8 text-center text-gray-400">Sin resultados para el filtro actual.</td></tr>`;
        return;
    }

    tbody.innerHTML = filtered.map(sale => {
        const fecha = new Date(sale.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: '2-digit' });
        const hora = new Date(sale.created_at).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
        const isPaid = sale.payment_status === 'paid';
        const itemCount = sale.items.reduce((sum, i) => sum + Number(i.quantity), 0);
        const itemsDetail = sale.items.map(i => `<span class="text-gray-700">${i.product_name}</span> <span class="text-gray-400">×${i.quantity} · $${Number(i.price).toLocaleString('es-CO')}</span>`).join('<br>');
        const saleId = `sale-detail-${sale.id}`;

        return `
            <tr class="border-b border-gray-100 hover:bg-[#fdf7fa] transition cursor-pointer" onclick="document.getElementById('${saleId}').classList.toggle('hidden')">
                <td class="p-3 text-center text-gray-400">
                    <i class="fa-solid fa-chevron-down text-xs transition-transform"></i>
                </td>
                <td class="p-3">
                    <p class="font-medium text-gray-900">${fecha}</p>
                    <p class="text-xs text-gray-400">${hora}</p>
                </td>
                <td class="p-3">
                    <p class="font-semibold text-gray-900">${sale.customer_name || 'Sin nombre'}</p>
                    ${sale.customer_phone ? `<p class="text-xs text-gray-400">${sale.customer_phone}</p>` : ''}
                </td>
                <td class="p-3 hidden md:table-cell">
                    <span class="text-sm text-gray-600">${sale.channel || '—'}</span>
                </td>
                <td class="p-3 text-center hidden sm:table-cell">
                    <span class="text-sm font-semibold text-[#6d165a]">${itemCount}</span>
                </td>
                <td class="p-3 text-right">
                    <span class="text-base font-bold text-[#a0346e]">$${Number(sale.total).toLocaleString('es-CO')}</span>
                </td>
                <td class="p-3 text-center">
                    <span class="text-xs font-semibold px-2.5 py-1 rounded-full ${isPaid ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-amber-50 text-amber-700 border border-amber-100'}">
                        ${isPaid ? 'Pagado' : 'Pendiente'}
                    </span>
                </td>
            </tr>
            <tr id="${saleId}" class="hidden">
                <td colspan="7" class="px-8 py-3 bg-[#fdf7fa] border-b border-gray-100">
                    <div class="flex flex-wrap gap-6">
                        <div>
                            <p class="text-xs uppercase tracking-wide text-gray-400 font-semibold mb-2">Productos</p>
                            <div class="text-sm leading-relaxed">${itemsDetail || '<span class="text-gray-400">Sin detalle</span>'}</div>
                        </div>
                        ${sale.notes ? `<div><p class="text-xs uppercase tracking-wide text-gray-400 font-semibold mb-2">Notas</p><p class="text-sm text-gray-600">${sale.notes}</p></div>` : ''}
                        <div><p class="text-xs uppercase tracking-wide text-gray-400 font-semibold mb-2">ID venta</p><p class="text-sm text-gray-600 font-mono">#${sale.id}</p></div>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function renderNuevaVentaForm(products, customers) {
    const productOpts = products.map(p =>
        `<option value="${p.id}" data-price="${p.price}" data-name="${p.name.replace(/"/g, '&quot;')}" data-stock="${p.stock}">${p.name} (stock: ${p.stock})</option>`
    ).join('');

    const customerOpts = ['<option value="">— Cliente nuevo —</option>',
        ...customers.map(c => `<option value="${c.id}" data-name="${c.name.replace(/"/g, '&quot;')}" data-phone="${c.phone || ''}">${c.name}${c.phone ? ' · ' + c.phone : ''}</option>`)
    ].join('');

    const itemRows = nvState.items.map((item, idx) => renderItemRow(idx, productOpts, item)).join('');

    const subtotal = nvState.items.reduce((sum, i) => sum + (Number(i.price) * Number(i.quantity)), 0);

    return `
        <div class="border-b border-[#f1d7e2] bg-[#fdf7fa] p-5">
            <p class="text-xs uppercase tracking-[0.18em] text-[#a0346e] font-semibold mb-4">Nueva venta</p>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">

                <!-- Col izquierda: Cliente -->
                <div class="space-y-3">
                    <div>
                        <label class="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Cliente existente</label>
                        <select id="nv-customer-select" class="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#ec5c8d] bg-white">
                            ${customerOpts}
                        </select>
                    </div>
                    <div>
                        <label class="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Nombre <span class="text-rose-500">*</span></label>
                        <input id="nv-customer-name" type="text" placeholder="Nombre del cliente"
                            class="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#ec5c8d]"
                            value="${nvState.customer_name}">
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Teléfono</label>
                            <input id="nv-customer-phone" type="text" placeholder="Ej: 3001234567"
                                class="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#ec5c8d]"
                                value="${nvState.customer_phone}">
                        </div>
                        <div>
                            <label class="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Canal</label>
                            <select id="nv-channel" class="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#ec5c8d] bg-white">
                                ${['Nequi','Daviplata','Efectivo','WhatsApp','Instagram','Davivienda','regalo','Manual'].map(c => `<option ${nvState.channel === c ? 'selected' : ''}>${c}</option>`).join('')}
                            </select>
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Estado de pago</label>
                            <select id="nv-payment-status" class="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#ec5c8d] bg-white">
                                <option value="paid" ${nvState.payment_status === 'paid' ? 'selected' : ''}>Pagado ✓</option>
                                <option value="pending" ${nvState.payment_status === 'pending' ? 'selected' : ''}>Pendiente (deuda)</option>
                            </select>
                        </div>
                        <div>
                            <label class="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Fecha</label>
                            <input id="nv-date" type="date" value="${nvState.date}"
                                class="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#ec5c8d]">
                        </div>
                    </div>
                    <div>
                        <label class="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Notas</label>
                        <textarea id="nv-notes" placeholder="Observaciones de la venta (opcional)"
                            class="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#ec5c8d] resize-none h-20">${nvState.notes}</textarea>
                    </div>
                </div>

                <!-- Col derecha: Productos -->
                <div>
                    <label class="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">Productos <span class="text-rose-500">*</span></label>
                    <div id="nv-items-container" class="space-y-2 mb-3">
                        ${itemRows}
                    </div>
                    <button id="nv-add-item" class="inline-flex items-center gap-1.5 text-sm font-semibold text-[#a0346e] hover:text-[#ec5c8d] transition mb-4">
                        <i class="fa-solid fa-plus-circle"></i>Agregar producto
                    </button>

                    <!-- Subtotal -->
                    <div class="border-t border-[#f1d7e2] pt-4 flex items-center justify-between">
                        <span class="text-sm font-semibold text-gray-500">Total estimado</span>
                        <span id="nv-subtotal" class="text-2xl font-bold text-[#a0346e]">
                            $${subtotal.toLocaleString('es-CO')}
                        </span>
                    </div>

                    <button id="nv-submit"
                        class="mt-4 w-full py-3 rounded-xl bg-gradient-to-r from-[#ec5c8d] to-[#ff8c91] text-white font-bold text-base shadow-md hover:shadow-lg transition">
                        <i class="fa-solid fa-floppy-disk mr-2"></i>Guardar venta
                    </button>
                </div>
            </div>
        </div>
    `;
}

function renderItemRow(idx, productOpts, item) {
    return `
        <div class="nv-item-row flex items-center gap-2 flex-wrap" data-idx="${idx}">
            <select class="nv-product flex-1 min-w-[180px] px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#ec5c8d] bg-white">
                <option value="">— Seleccionar producto —</option>
                ${productOpts.replace(`value="${item.product_id}"`, `value="${item.product_id}" selected`)}
            </select>
            <input type="number" min="1" value="${item.quantity}"
                class="nv-qty w-16 px-2 py-2 rounded-xl border border-gray-200 text-sm text-center focus:outline-none focus:border-[#ec5c8d]"
                placeholder="Cant.">
            <input type="number" min="0" value="${item.price}"
                class="nv-price w-24 px-2 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#ec5c8d]"
                placeholder="Precio">
            <span class="nv-row-total text-sm font-bold text-[#a0346e] w-20 text-right">
                $${(Number(item.price) * Number(item.quantity)).toLocaleString('es-CO')}
            </span>
            ${nvState.items.length > 1 ? `
            <button class="nv-remove-item p-1.5 rounded-lg text-gray-400 hover:text-rose-500 hover:bg-rose-50 transition" data-idx="${idx}">
                <i class="fa-solid fa-trash-can text-xs"></i>
            </button>` : '<div class="w-7"></div>'}
        </div>
    `;
}

function recalcNvSubtotal() {
    const rows = document.querySelectorAll('.nv-item-row');
    let total = 0;
    rows.forEach(row => {
        const qty = Number(row.querySelector('.nv-qty').value) || 0;
        const price = Number(row.querySelector('.nv-price').value) || 0;
        const sub = qty * price;
        total += sub;
        row.querySelector('.nv-row-total').textContent = `$${sub.toLocaleString('es-CO')}`;
    });
    const el = document.getElementById('nv-subtotal');
    if (el) el.textContent = `$${total.toLocaleString('es-CO')}`;
}

function readNvStateFromDOM() {
    nvState.customer_name = (document.getElementById('nv-customer-name')?.value || '').trim();
    nvState.customer_phone = (document.getElementById('nv-customer-phone')?.value || '').trim();
    nvState.channel = document.getElementById('nv-channel')?.value || 'Manual';
    nvState.payment_status = document.getElementById('nv-payment-status')?.value || 'paid';
    nvState.notes = (document.getElementById('nv-notes')?.value || '').trim();
    nvState.date = document.getElementById('nv-date')?.value || new Date().toISOString().slice(0, 10);

    const rows = document.querySelectorAll('.nv-item-row');
    nvState.items = [];
    rows.forEach(row => {
        const sel = row.querySelector('.nv-product');
        const pid = sel?.value || '';
        const opt = sel?.selectedOptions[0];
        nvState.items.push({
            product_id: pid || null,
            product_name: opt?.dataset.name || row.querySelector('.nv-product').getAttribute('data-fallback-name') || '',
            price: Number(row.querySelector('.nv-price').value) || 0,
            quantity: Number(row.querySelector('.nv-qty').value) || 1
        });
    });
}

function bindNuevaVentaListeners(products, customers, sales) {
    const container = document.getElementById('nueva-venta-container');
    if (!container) return;

    const productOpts = products.map(p =>
        `<option value="${p.id}" data-price="${p.price}" data-name="${p.name.replace(/"/g, '&quot;')}" data-stock="${p.stock}">${p.name} (stock: ${p.stock})</option>`
    ).join('');

    // Autocomplete cliente existente
    document.getElementById('nv-customer-select')?.addEventListener('change', e => {
        const opt = e.target.selectedOptions[0];
        if (opt?.dataset.name) {
            document.getElementById('nv-customer-name').value = opt.dataset.name;
            document.getElementById('nv-customer-phone').value = opt.dataset.phone || '';
        }
    });

    // Delegación para selección de producto (auto-precio)
    container.addEventListener('change', e => {
        if (e.target.classList.contains('nv-product')) {
            const opt = e.target.selectedOptions[0];
            const row = e.target.closest('.nv-item-row');
            if (opt?.dataset.price && row) {
                row.querySelector('.nv-price').value = opt.dataset.price;
            }
            recalcNvSubtotal();
        }
        if (e.target.classList.contains('nv-qty') || e.target.classList.contains('nv-price')) {
            recalcNvSubtotal();
        }
    });

    // Agregar item
    document.getElementById('nv-add-item')?.addEventListener('click', () => {
        readNvStateFromDOM();
        nvState.items.push({ product_id: '', product_name: '', price: 0, quantity: 1 });
        const itemsContainer = document.getElementById('nv-items-container');
        itemsContainer.innerHTML = nvState.items.map((item, idx) => renderItemRow(idx, productOpts, item)).join('');
        recalcNvSubtotal();
        rebindRemoveItemBtns(productOpts);
    });

    rebindRemoveItemBtns(productOpts);

    // Submit
    document.getElementById('nv-submit')?.addEventListener('click', () => submitNuevaVenta(sales, products, customers));
}

function rebindRemoveItemBtns(productOpts) {
    document.querySelectorAll('.nv-remove-item').forEach(btn => {
        btn.addEventListener('click', () => {
            readNvStateFromDOM();
            const idx = Number(btn.dataset.idx);
            nvState.items.splice(idx, 1);
            if (nvState.items.length === 0) nvState.items.push({ product_id: '', product_name: '', price: 0, quantity: 1 });
            const itemsContainer = document.getElementById('nv-items-container');
            itemsContainer.innerHTML = nvState.items.map((item, i) => renderItemRow(i, productOpts, item)).join('');
            recalcNvSubtotal();
            rebindRemoveItemBtns(productOpts);
        });
    });
}

async function submitNuevaVenta(sales, products, customers) {
    readNvStateFromDOM();

    if (!nvState.customer_name) {
        Swal.fire({ title: 'Falta el cliente', text: 'Ingresa el nombre del cliente.', icon: 'warning', confirmButtonColor: '#ec5c8d' });
        return;
    }

    const itemsValidos = nvState.items.filter(i => i.product_name && i.quantity >= 1 && i.price >= 0);
    if (itemsValidos.length === 0) {
        Swal.fire({ title: 'Sin productos', text: 'Selecciona al menos un producto válido.', icon: 'warning', confirmButtonColor: '#ec5c8d' });
        return;
    }

    // Verificar stock
    for (const item of itemsValidos) {
        if (!item.product_id) continue;
        const prod = products.find(p => Number(p.id) === Number(item.product_id));
        if (prod && Number(prod.stock) < Number(item.quantity)) {
            Swal.fire({ title: 'Stock insuficiente', text: `"${prod.name}" tiene solo ${prod.stock} unidad(es) disponible(s).`, icon: 'warning', confirmButtonColor: '#ec5c8d' });
            return;
        }
    }

    const total = itemsValidos.reduce((sum, i) => sum + (Number(i.price) * Number(i.quantity)), 0);

    const btn = document.getElementById('nv-submit');
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i>Guardando...'; }

    try {
        const token = localStorage.getItem('discordia_admin_token');
        const res = await fetch('/api/sales', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: JSON.stringify({
                customer_name: nvState.customer_name,
                customer_phone: nvState.customer_phone,
                channel: nvState.channel,
                payment_status: nvState.payment_status,
                notes: nvState.notes,
                date: nvState.date,
                items: itemsValidos
            })
        });
        const json = await res.json();
        if (!res.ok || !json.ok) throw new Error(json.message || `HTTP ${res.status}`);

        await Swal.fire({
            title: '¡Venta registrada!',
            html: `Total: <strong>$${total.toLocaleString('es-CO')}</strong><br>${nvState.customer_name} · ${nvState.channel}`,
            icon: 'success',
            confirmButtonColor: '#ec5c8d'
        });

        window.reloadSales();
    } catch (err) {
        if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-floppy-disk mr-2"></i>Guardar venta'; }
        Swal.fire('Error al guardar', err.message, 'error');
    }
}

function showRegisterSale() {
    // Delegado a la nueva UI inline — abre el formulario
    const toggleBtn = document.getElementById('toggle-nueva-venta');
    if (toggleBtn) toggleBtn.click();
}

function upsertCustomerFromSale() {
    // No-op: lógica movida a api/sales.js
}

function clearSales() {
    // Ya no se usa la capa localStorage para ventas
    Swal.fire({ title: 'Acción no disponible', text: 'Las ventas ahora están en la base de datos. No se pueden borrar masivamente desde aquí.', icon: 'info', confirmButtonColor: '#ec5c8d' });
}

// ─────────────────────────────────────────────────────────────
// Clientes Tab — historial de clientes + CRUD vía API
// ─────────────────────────────────────────────────────────────
async function renderCustomersTab() {
    if (customersCache) {
        renderCustomersContent(customersCache);
        return;
    }

    panel.innerHTML = `
        <div class="flex flex-col items-center justify-center py-24 gap-4">
            <div class="w-12 h-12 border-4 border-[#ec5c8d] border-t-transparent rounded-full animate-spin"></div>
            <p class="text-gray-400 text-sm font-medium">Cargando clientes...</p>
        </div>
    `;

    try {
        const token = localStorage.getItem('discordia_admin_token');
        const res = await fetch('/api/customers', {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!json.ok) throw new Error(json.message || 'Error del servidor');
        customersCache = json.data;
        renderCustomersContent(customersCache);
    } catch (err) {
        panel.innerHTML = `
            <div class="bg-white border border-gray-100 rounded-2xl p-10 shadow-sm text-center">
                <div class="text-5xl mb-4">⚠️</div>
                <h3 class="text-xl font-bold text-[#6d165a] mb-2">No se pudo cargar los clientes</h3>
                <p class="text-gray-500 text-sm mb-6">${err.message}</p>
                <button onclick="window.reloadCustomers()" class="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#ec5c8d] to-[#ff8c91] text-white font-semibold text-sm shadow-md">Reintentar</button>
            </div>
        `;
    }
}

window.reloadCustomers = function () {
    customersCache = null;
    dashboardCache = null;
    renderCustomersTab();
};

function renderCustomersContent(data) {
    const { customers, meta } = data;

    // ── KPI cards ──────────────────────────────────────────────
    const kpiHtml = `
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <article class="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex items-start gap-3">
                <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ec5c8d] to-[#ff8c91] flex items-center justify-center flex-shrink-0">
                    <i class="fa-solid fa-users text-white text-sm"></i>
                </div>
                <div>
                    <p class="text-xs uppercase tracking-[0.18em] text-[#a0346e] font-semibold">Clientes</p>
                    <p class="text-3xl font-bold text-[#6d165a]">${meta.total}</p>
                    <p class="text-xs text-gray-400 mt-0.5">registrados en BD</p>
                </div>
            </article>
            <article class="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex items-start gap-3">
                <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6d165a] to-[#a0346e] flex items-center justify-center flex-shrink-0">
                    <i class="fa-solid fa-sack-dollar text-white text-sm"></i>
                </div>
                <div>
                    <p class="text-xs uppercase tracking-[0.18em] text-[#a0346e] font-semibold">Total comprado</p>
                    <p class="text-3xl font-bold text-[#6d165a]">$${Number(meta.totalSpent).toLocaleString('es-CO')}</p>
                    <p class="text-xs text-gray-400 mt-0.5">acumulado histórico</p>
                </div>
            </article>
            <article class="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex items-start gap-3">
                <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ffc4a6] to-[#ff8c91] flex items-center justify-center flex-shrink-0">
                    <i class="fa-solid fa-hand-holding-dollar text-[#6d165a] text-sm"></i>
                </div>
                <div>
                    <p class="text-xs uppercase tracking-[0.18em] text-[#a0346e] font-semibold">Con deuda</p>
                    <p class="text-3xl font-bold ${meta.withDebt > 0 ? 'text-rose-600' : 'text-emerald-600'}">${meta.withDebt}</p>
                    <p class="text-xs text-gray-400 mt-0.5">$${Number(meta.totalDebt).toLocaleString('es-CO')} pendiente</p>
                </div>
            </article>
            <article class="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex items-start gap-3">
                <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-[#a0346e] to-[#ec5c8d] flex items-center justify-center flex-shrink-0">
                    <i class="fa-solid fa-location-dot text-white text-sm"></i>
                </div>
                <div>
                    <p class="text-xs uppercase tracking-[0.18em] text-[#a0346e] font-semibold">Ciudades</p>
                    <p class="text-3xl font-bold text-[#6d165a]">${meta.cities}</p>
                    <p class="text-xs text-gray-400 mt-0.5">distintas</p>
                </div>
            </article>
        </div>
    `;

    // ── Filtros ────────────────────────────────────────────────
    const filterHtml = `
        <div class="flex flex-wrap items-center gap-2 mb-4">
            <input id="customers-search" type="search" placeholder="Buscar por nombre, teléfono, email, ciudad…"
                class="px-3 py-2 rounded-xl border border-gray-200 text-sm flex-1 min-w-[200px] focus:outline-none focus:border-[#ec5c8d]"
                value="${uiState.customersQuery}">
            <label class="inline-flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
                <input id="customers-with-debt" type="checkbox" class="accent-[#ec5c8d]" ${uiState.customersDebtOnly ? 'checked' : ''}>
                Solo con deuda
            </label>
            <span id="customers-count" class="text-xs text-gray-400 ml-auto"></span>
        </div>
    `;

    // ── Tabla ──────────────────────────────────────────────────
    const tableHtml = `
        <div class="overflow-x-auto">
            <table class="min-w-full text-sm">
                <thead class="bg-[#fdf2f7] text-[#6d165a]">
                    <tr>
                        <th class="p-3 text-left w-8"></th>
                        <th class="p-3 text-left">Cliente</th>
                        <th class="p-3 text-left hidden sm:table-cell">Teléfono</th>
                        <th class="p-3 text-center hidden md:table-cell">Órdenes</th>
                        <th class="p-3 text-right">Comprado</th>
                        <th class="p-3 text-right hidden sm:table-cell">Deuda</th>
                        <th class="p-3 text-center">Acciones</th>
                    </tr>
                </thead>
                <tbody id="customers-tbody"></tbody>
            </table>
        </div>
    `;

    panel.innerHTML = kpiHtml + `
        <article class="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            <div class="flex items-center justify-between gap-3 p-5 border-b border-gray-100">
                <div>
                    <p class="text-xs uppercase tracking-[0.18em] text-[#a0346e] font-semibold mb-1">Base</p>
                    <h3 class="text-2xl font-bold text-[#6d165a]">Clientes</h3>
                </div>
                <div class="flex items-center gap-2">
                    <button onclick="window.reloadCustomers()" class="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 transition" title="Actualizar">
                        <i class="fa-solid fa-rotate-right text-sm"></i>
                    </button>
                    <button id="add-customer" class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#ec5c8d] to-[#ff8c91] text-white font-semibold text-sm shadow-md hover:shadow-lg transition">
                        <i class="fa-solid fa-user-plus"></i>Agregar cliente
                    </button>
                </div>
            </div>
            <div class="p-5">
                ${filterHtml}
                ${tableHtml}
            </div>
        </article>
    `;

    applyCustomersFilters(customers);

    document.getElementById('customers-search').addEventListener('input', e => {
        uiState.customersQuery = e.target.value;
        applyCustomersFilters(customers);
    });
    document.getElementById('customers-with-debt').addEventListener('change', e => {
        uiState.customersDebtOnly = e.target.checked;
        applyCustomersFilters(customers);
    });
    document.getElementById('add-customer').addEventListener('click', () => showCustomerModal(null));
}

function applyCustomersFilters(customers) {
    const query = (uiState.customersQuery || '').trim().toLowerCase();
    const debtOnly = !!uiState.customersDebtOnly;

    const filtered = customers.filter(c => {
        const matchQ = !query || `${c.name || ''} ${c.phone || ''} ${c.email || ''} ${c.city || ''}`.toLowerCase().includes(query);
        const matchDebt = !debtOnly || Number(c.total_debt || 0) > 0;
        return matchQ && matchDebt;
    });

    const countEl = document.getElementById('customers-count');
    if (countEl) countEl.textContent = `Mostrando ${filtered.length} de ${customers.length}`;

    const tbody = document.getElementById('customers-tbody');
    if (!tbody) return;

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="p-8 text-center text-gray-400">Sin resultados para el filtro actual.</td></tr>`;
        return;
    }

    tbody.innerHTML = filtered.map(c => {
        const hasDebt = Number(c.total_debt || 0) > 0;
        const lastDate = c.last_purchase_at
            ? new Date(c.last_purchase_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: '2-digit' })
            : '—';
        const detailId = `cdetail-${c.id}`;

        return `
            <tr class="border-b border-gray-100 hover:bg-[#fdf7fa] transition cursor-pointer" onclick="document.getElementById('${detailId}').classList.toggle('hidden')">
                <td class="p-3 text-center text-gray-400">
                    <i class="fa-solid fa-chevron-down text-xs"></i>
                </td>
                <td class="p-3">
                    <p class="font-semibold text-gray-900">${c.name}</p>
                    <p class="text-xs text-gray-400">${c.city || '—'}</p>
                </td>
                <td class="p-3 hidden sm:table-cell">
                    ${c.phone ? `<a href="https://wa.me/${c.phone.replace(/\D/g,'')}" target="_blank" class="text-sm text-emerald-600 hover:underline" onclick="event.stopPropagation()">${c.phone}</a>` : '<span class="text-gray-300">—</span>'}
                </td>
                <td class="p-3 text-center hidden md:table-cell">
                    <span class="font-semibold text-[#6d165a]">${c.order_count || 0}</span>
                </td>
                <td class="p-3 text-right">
                    <span class="font-bold text-[#a0346e]">$${Number(c.total_spent || 0).toLocaleString('es-CO')}</span>
                </td>
                <td class="p-3 text-right hidden sm:table-cell">
                    ${hasDebt
                        ? `<span class="text-sm font-semibold text-rose-600">$${Number(c.total_debt).toLocaleString('es-CO')}</span>`
                        : '<span class="text-xs text-emerald-500 font-semibold">Al día</span>'}
                </td>
                <td class="p-3 text-center">
                    <div class="flex justify-center gap-1.5" onclick="event.stopPropagation()">
                        <button class="p-2 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 transition edit-customer-btn" data-id="${c.id}" title="Editar">
                            <i class="fa-solid fa-pen text-xs pointer-events-none"></i>
                        </button>
                        <button class="p-2 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition delete-customer-btn" data-id="${c.id}" title="Eliminar">
                            <i class="fa-solid fa-trash-can text-xs pointer-events-none"></i>
                        </button>
                    </div>
                </td>
            </tr>
            <tr id="${detailId}" class="hidden">
                <td colspan="7" class="px-8 py-3 bg-[#fdf7fa] border-b border-gray-100">
                    <div class="flex flex-wrap gap-6 text-sm">
                        ${c.email ? `<div><p class="text-xs uppercase tracking-wide text-gray-400 font-semibold mb-1">Email</p><a href="mailto:${c.email}" class="text-[#a0346e] hover:underline">${c.email}</a></div>` : ''}
                        <div><p class="text-xs uppercase tracking-wide text-gray-400 font-semibold mb-1">Última compra</p><p class="text-gray-700">${lastDate}</p></div>
                        ${c.notes ? `<div><p class="text-xs uppercase tracking-wide text-gray-400 font-semibold mb-1">Notas</p><p class="text-gray-600">${c.notes}</p></div>` : ''}
                        <div><p class="text-xs uppercase tracking-wide text-gray-400 font-semibold mb-1">ID</p><p class="text-gray-400 font-mono">#${c.id}</p></div>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    // Event delegation
    tbody.addEventListener('click', e => {
        const editBtn = e.target.closest('.edit-customer-btn');
        const delBtn = e.target.closest('.delete-customer-btn');
        if (editBtn) {
            const cust = customersCache?.customers.find(c => Number(c.id) === Number(editBtn.dataset.id));
            if (cust) showCustomerModal(cust);
        }
        if (delBtn) {
            deleteCustomer(Number(delBtn.dataset.id));
        }
    });
}

function showCustomerModal(customer) {
    const editing = customer != null;
    Swal.fire({
        title: editing ? 'Editar cliente' : 'Nuevo cliente',
        width: 500,
        html: `
            <style>#swal2-html-container { text-align: left; }</style>
            <div class="space-y-3 pt-1">
                <div>
                    <label class="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Nombre *</label>
                    <input id="sc-name" class="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#ec5c8d]"
                        placeholder="Nombre completo" value="${customer?.name || ''}">
                </div>
                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label class="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Teléfono</label>
                        <input id="sc-phone" type="tel" class="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#ec5c8d]"
                            placeholder="Ej: 3001234567" value="${customer?.phone || ''}">
                    </div>
                    <div>
                        <label class="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Ciudad</label>
                        <input id="sc-city" class="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#ec5c8d]"
                            placeholder="Ej: Bogotá" value="${customer?.city || ''}">
                    </div>
                </div>
                <div>
                    <label class="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Email</label>
                    <input id="sc-email" type="email" class="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#ec5c8d]"
                        placeholder="correo@ejemplo.com" value="${customer?.email || ''}">
                </div>
                <div>
                    <label class="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Notas</label>
                    <textarea id="sc-notes" class="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#ec5c8d] resize-none h-16"
                        placeholder="Observaciones sobre el cliente (opcional)">${customer?.notes || ''}</textarea>
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: editing ? '<i class="fa-solid fa-floppy-disk mr-1"></i>Guardar' : '<i class="fa-solid fa-user-plus mr-1"></i>Agregar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#ec5c8d',
        showLoaderOnConfirm: true,
        preConfirm: async () => {
            const name  = document.getElementById('sc-name').value.trim();
            const phone = document.getElementById('sc-phone').value.trim();
            const email = document.getElementById('sc-email').value.trim();
            const city  = document.getElementById('sc-city').value.trim();
            const notes = document.getElementById('sc-notes').value.trim();

            if (!name) { Swal.showValidationMessage('El nombre es obligatorio.'); return false; }

            const token = localStorage.getItem('discordia_admin_token');
            const method = editing ? 'PUT' : 'POST';
            const body = editing
                ? { id: customer.id, name, phone, email, city, notes }
                : { name, phone, email, city, notes };

            const res = await fetch('/api/customers', {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify(body)
            });
            const json = await res.json();
            if (!res.ok || !json.ok) { Swal.showValidationMessage(json.message || `HTTP ${res.status}`); return false; }
            return json.data;
        },
        allowOutsideClick: () => !Swal.isLoading()
    }).then(result => {
        if (!result.isConfirmed || !result.value) return;
        Swal.fire({
            title: editing ? 'Cliente actualizado' : 'Cliente agregado',
            text: result.value.name,
            icon: 'success',
            timer: 1800,
            showConfirmButton: false
        });
        window.reloadCustomers();
    });
}

async function deleteCustomer(customerId) {
    const customer = customersCache?.customers.find(c => Number(c.id) === Number(customerId));
    const name = customer?.name || `#${customerId}`;

    const confirm = await Swal.fire({
        title: '¿Eliminar cliente?',
        text: name,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Eliminar',
        confirmButtonColor: '#ec5c8d',
        cancelButtonText: 'Cancelar'
    });
    if (!confirm.isConfirmed) return;

    try {
        const token = localStorage.getItem('discordia_admin_token');
        const res = await fetch('/api/customers', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: JSON.stringify({ id: customerId })
        });
        const json = await res.json();
        if (!res.ok || !json.ok) throw new Error(json.message || `HTTP ${res.status}`);
        Swal.fire({ title: 'Eliminado', text: name, icon: 'success', timer: 1500, showConfirmButton: false });
        window.reloadCustomers();
    } catch (err) {
        Swal.fire('No se puede eliminar', err.message, 'error');
    }
}

function getNextId(items) {
    if (!items.length) return 1;
    return Math.max(...items.map((item) => Number(item.id) || 0)) + 1;
}

function showAddCustomer() {
    showCustomerModal(null);
}

function exportBackup() {
    const backup = {
        version: 1,
        exportedAt: new Date().toISOString(),
        data: {
            catalog: state.catalog,
            sales: state.sales,
            customers: state.customers
        }
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `discordia-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    Swal.fire('Respaldo exportado', 'Se descargó el archivo JSON con todos los datos.', 'success');
}

function handleImportBackupFile(event) {
    const [file] = event.target.files || [];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
        try {
            const parsed = JSON.parse(reader.result);
            const payload = parsed?.data || parsed;

            if (!Array.isArray(payload.catalog) || !Array.isArray(payload.sales) || !Array.isArray(payload.customers)) {
                throw new Error('Formato inválido');
            }

            state.catalog = payload.catalog;
            state.sales = payload.sales;
            state.customers = payload.customers;

            saveCatalog();
            saveSales();
            saveCustomers();
            refreshUI();

            Swal.fire('Respaldo importado', 'Datos cargados correctamente.', 'success');
        } catch (error) {
            Swal.fire('Error', 'No se pudo importar el archivo JSON.', 'error');
        } finally {
            event.target.value = '';
        }
    };

    reader.readAsText(file);
}

function resetAdminData() {
    Swal.fire({
        title: '¿Reiniciar datos del panel?',
        text: 'Restaurará catálogo base y borrará ventas/clientes.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, reiniciar',
        confirmButtonColor: '#ec5c8d'
    }).then((result) => {
        if (!result.isConfirmed) return;

        state.catalog = structuredCloneSafe(products);
        state.sales = [];
        state.customers = [];
        uiState.catalogQuery = '';
        uiState.catalogLowStockOnly = false;
        uiState.salesQuery = '';
        uiState.customersQuery = '';

        saveCatalog();
        saveSales();
        saveCustomers();
        refreshUI();

        Swal.fire('Listo', 'El panel fue reiniciado.', 'success');
    });
}

bindTabActions();
bindGlobalActions();
refreshUI();
hydrateFromApi();
