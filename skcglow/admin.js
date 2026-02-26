import { products } from './products.js';
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

let activeTab = 'catalog';
const uiState = {
    catalogQuery: '',
    catalogLowStockOnly: false,
    salesQuery: '',
    customersQuery: ''
};

const state = {
    catalog: loadCollection(STORAGE_KEYS.catalog, products),
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
        button.className = `admin-tab-btn px-3 py-2 rounded-xl font-semibold text-sm md:text-base transition ${isActive ? 'bg-[#6d165a] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`;
    });
}

function renderActiveTab() {
    if (activeTab === 'catalog') {
        renderCatalogTab();
        return;
    }
    if (activeTab === 'sales') {
        renderSalesTab();
        return;
    }
    renderCustomersTab();
}

function renderCatalogTab() {
    const normalizedQuery = uiState.catalogQuery.trim().toLowerCase();
    const filteredCatalog = state.catalog.filter((item) => {
        const queryMatch = !normalizedQuery || `${item.name || ''} ${item.category || ''} ${item.description || ''}`.toLowerCase().includes(normalizedQuery);
        const stockMatch = !uiState.catalogLowStockOnly || Number(item.stock || 0) <= 5;
        return queryMatch && stockMatch;
    });

    const rows = filteredCatalog.map((item) => `
        <tr class="border-b border-gray-100 hover:bg-[#fdf7fa]">
            <td class="p-3 text-center font-medium">${item.id}</td>
            <td class="p-3">
                <div class="flex items-center gap-3 min-w-[260px]">
                    <img src="${item.image || './assets/default.png'}" alt="${item.name}" class="w-12 h-12 rounded-lg object-cover border border-gray-200" onerror="this.src='./assets/default.png'; this.onerror=null;">
                    <div>
                        <p class="font-semibold text-gray-900 leading-tight">${item.name}</p>
                        <p class="text-xs text-gray-500 mt-1">${item.description || 'Sin descripción'}</p>
                    </div>
                </div>
            </td>
            <td class="p-3 font-semibold text-[#a0346e]">$${Number(item.price || 0).toLocaleString()}</td>
            <td class="p-3">${item.stock}</td>
            <td class="p-3">${item.category || '-'}</td>
            <td class="p-3">
                <div class="flex gap-2">
                    <button class="edit-product px-3 py-1.5 rounded-lg bg-amber-100 text-amber-800 font-semibold" data-id="${item.id}">Editar</button>
                    <button class="delete-product px-3 py-1.5 rounded-lg bg-rose-100 text-rose-700 font-semibold" data-id="${item.id}">Eliminar</button>
                </div>
            </td>
        </tr>
    `).join('');

    panel.innerHTML = `
        <article class="bg-white border border-gray-100 rounded-2xl p-4 md:p-5 shadow-sm overflow-hidden">
            <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
                <h3 class="text-2xl font-bold text-[#6d165a]">Catálogo</h3>
                <div class="flex flex-wrap gap-2">
                    <button id="add-product" class="px-4 py-2 rounded-xl bg-gradient-to-r from-[#ec5c8d] to-[#ff8c91] text-white font-semibold">Agregar producto</button>
                    <button id="restore-catalog" class="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 font-semibold">Restaurar base</button>
                </div>
            </div>

            <div class="flex flex-wrap items-center gap-3 mb-4">
                <input id="catalog-search" class="px-3 py-2 rounded-xl border border-gray-200 text-sm flex-1 min-w-[220px]" placeholder="Buscar por nombre, categoría o descripción" value="${uiState.catalogQuery}">
                <label class="inline-flex items-center gap-2 text-sm text-gray-700">
                    <input id="catalog-low-stock" type="checkbox" ${uiState.catalogLowStockOnly ? 'checked' : ''}>
                    Solo stock bajo (<= 5)
                </label>
                <span class="text-xs text-gray-500">Mostrando ${filteredCatalog.length} de ${state.catalog.length}</span>
            </div>

            <div class="overflow-x-auto">
                <table class="min-w-full text-sm">
                    <thead class="bg-[#fdf2f7] text-[#6d165a]">
                        <tr>
                            <th class="p-3 text-left">ID</th>
                            <th class="p-3 text-left">Producto</th>
                            <th class="p-3 text-left">Precio</th>
                            <th class="p-3 text-left">Stock</th>
                            <th class="p-3 text-left">Categoría</th>
                            <th class="p-3 text-left">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>${rows || '<tr><td colspan="6" class="p-5 text-center text-gray-500">No hay productos que coincidan con el filtro.</td></tr>'}</tbody>
                </table>
            </div>
        </article>
    `;

    document.getElementById('catalog-search').addEventListener('input', (event) => {
        uiState.catalogQuery = event.target.value;
        renderCatalogTab();
    });
    document.getElementById('catalog-low-stock').addEventListener('change', (event) => {
        uiState.catalogLowStockOnly = event.target.checked;
        renderCatalogTab();
    });

    document.getElementById('add-product').addEventListener('click', showProductModal);
    document.getElementById('restore-catalog').addEventListener('click', restoreCatalog);
    panel.querySelectorAll('.edit-product').forEach((button) => {
        button.addEventListener('click', () => showProductModal(button.dataset.id));
    });
    panel.querySelectorAll('.delete-product').forEach((button) => {
        button.addEventListener('click', () => deleteProduct(button.dataset.id));
    });
}

function renderSalesTab() {
    const normalizedQuery = uiState.salesQuery.trim().toLowerCase();
    const filteredSales = state.sales.slice().reverse().filter((sale) => {
        if (!normalizedQuery) return true;
        const line = `${sale.customerName || ''} ${sale.customerPhone || ''} ${sale.channel || ''} ${sale.notes || ''}`.toLowerCase();
        return line.includes(normalizedQuery);
    });

    const rows = filteredSales.map((sale) => {
        const date = new Date(sale.createdAt).toLocaleString('es-CO');
        const itemCount = (sale.items || []).reduce((sum, item) => sum + Number(item.qty || 0), 0);
        return `
            <tr class="border-b border-gray-100 hover:bg-[#fdf7fa]">
                <td class="p-3 text-xs text-gray-500 min-w-[140px]">${date}</td>
                <td class="p-3 min-w-[180px]">
                    <p class="font-semibold text-gray-900">${sale.customerName || 'Sin nombre'}</p>
                    <p class="text-xs text-gray-500">${sale.customerPhone || 'Sin teléfono'}</p>
                </td>
                <td class="p-3">${itemCount}</td>
                <td class="p-3 font-semibold text-[#a0346e]">$${Number(sale.total || 0).toLocaleString()}</td>
                <td class="p-3">${sale.channel || 'Manual'}</td>
                <td class="p-3 text-xs text-gray-500 max-w-[280px]">${sale.notes || '-'}</td>
            </tr>
        `;
    }).join('');

    panel.innerHTML = `
        <article class="bg-white border border-gray-100 rounded-2xl p-4 md:p-5 shadow-sm overflow-hidden">
            <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
                <h3 class="text-2xl font-bold text-[#6d165a]">Ventas</h3>
                <div class="flex flex-wrap gap-2">
                    <button id="register-sale" class="px-4 py-2 rounded-xl bg-gradient-to-r from-[#ec5c8d] to-[#ff8c91] text-white font-semibold">Registrar venta</button>
                    <button id="clear-sales" class="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 font-semibold">Limpiar historial</button>
                </div>
            </div>
            <div class="flex flex-wrap items-center gap-3 mb-4">
                <input id="sales-search" class="px-3 py-2 rounded-xl border border-gray-200 text-sm flex-1 min-w-[220px]" placeholder="Buscar por cliente, teléfono, canal o nota" value="${uiState.salesQuery}">
                <span class="text-xs text-gray-500">Mostrando ${filteredSales.length} de ${state.sales.length}</span>
            </div>
            <div class="overflow-x-auto">
                <table class="min-w-full text-sm">
                    <thead class="bg-[#fdf2f7] text-[#6d165a]">
                        <tr>
                            <th class="p-3 text-left">Fecha</th>
                            <th class="p-3 text-left">Cliente</th>
                            <th class="p-3 text-left">Items</th>
                            <th class="p-3 text-left">Total</th>
                            <th class="p-3 text-left">Canal</th>
                            <th class="p-3 text-left">Notas</th>
                        </tr>
                    </thead>
                    <tbody>${rows || '<tr><td colspan="6" class="p-5 text-center text-gray-500">No hay ventas que coincidan con el filtro.</td></tr>'}</tbody>
                </table>
            </div>
        </article>
    `;

    document.getElementById('sales-search').addEventListener('input', (event) => {
        uiState.salesQuery = event.target.value;
        renderSalesTab();
    });

    document.getElementById('register-sale').addEventListener('click', showRegisterSale);
    document.getElementById('clear-sales').addEventListener('click', clearSales);
}

function renderCustomersTab() {
    const normalizedQuery = uiState.customersQuery.trim().toLowerCase();
    const filteredCustomers = state.customers
        .slice()
        .sort((a, b) => Number(b.totalSpent || 0) - Number(a.totalSpent || 0))
        .filter((customer) => {
            if (!normalizedQuery) return true;
            const line = `${customer.name || ''} ${customer.phone || ''} ${customer.email || ''} ${customer.city || ''}`.toLowerCase();
            return line.includes(normalizedQuery);
        });

    const rows = filteredCustomers.map((customer) => `
        <tr class="border-b border-gray-100 hover:bg-[#fdf7fa]">
            <td class="p-3 min-w-[220px]">
                <p class="font-semibold text-gray-900">${customer.name || 'Sin nombre'}</p>
                <p class="text-xs text-gray-500">${customer.city || '-'}</p>
            </td>
            <td class="p-3">${customer.phone || '-'}</td>
            <td class="p-3">${customer.email || '-'}</td>
            <td class="p-3">${Number(customer.orderCount || 0)}</td>
            <td class="p-3 font-semibold text-[#a0346e]">$${Number(customer.totalSpent || 0).toLocaleString()}</td>
            <td class="p-3 text-xs text-gray-500">${customer.lastPurchaseAt ? new Date(customer.lastPurchaseAt).toLocaleDateString('es-CO') : '-'}</td>
            <td class="p-3">
                <button class="delete-customer px-3 py-1.5 rounded-lg bg-rose-100 text-rose-700 font-semibold" data-id="${customer.id}">Eliminar</button>
            </td>
        </tr>
    `).join('');

    panel.innerHTML = `
        <article class="bg-white border border-gray-100 rounded-2xl p-4 md:p-5 shadow-sm overflow-hidden">
            <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
                <h3 class="text-2xl font-bold text-[#6d165a]">Clientes</h3>
                <div class="flex flex-wrap gap-2">
                    <button id="add-customer" class="px-4 py-2 rounded-xl bg-gradient-to-r from-[#ec5c8d] to-[#ff8c91] text-white font-semibold">Agregar cliente</button>
                </div>
            </div>
            <div class="flex flex-wrap items-center gap-3 mb-4">
                <input id="customers-search" class="px-3 py-2 rounded-xl border border-gray-200 text-sm flex-1 min-w-[220px]" placeholder="Buscar por nombre, teléfono, email o ciudad" value="${uiState.customersQuery}">
                <span class="text-xs text-gray-500">Mostrando ${filteredCustomers.length} de ${state.customers.length}</span>
            </div>
            <div class="overflow-x-auto">
                <table class="min-w-full text-sm">
                    <thead class="bg-[#fdf2f7] text-[#6d165a]">
                        <tr>
                            <th class="p-3 text-left">Cliente</th>
                            <th class="p-3 text-left">Teléfono</th>
                            <th class="p-3 text-left">Email</th>
                            <th class="p-3 text-left">Órdenes</th>
                            <th class="p-3 text-left">Total compra</th>
                            <th class="p-3 text-left">Última compra</th>
                            <th class="p-3 text-left">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>${rows || '<tr><td colspan="7" class="p-5 text-center text-gray-500">No hay clientes que coincidan con el filtro.</td></tr>'}</tbody>
                </table>
            </div>
        </article>
    `;

    document.getElementById('customers-search').addEventListener('input', (event) => {
        uiState.customersQuery = event.target.value;
        renderCustomersTab();
    });

    document.getElementById('add-customer').addEventListener('click', showAddCustomer);
    panel.querySelectorAll('.delete-customer').forEach((button) => {
        button.addEventListener('click', () => deleteCustomer(button.dataset.id));
    });
}

function getNextId(items) {
    if (!items.length) return 1;
    return Math.max(...items.map((item) => Number(item.id) || 0)) + 1;
}

function showProductModal(productId) {
    const editing = productId != null;
    const product = editing ? state.catalog.find((item) => Number(item.id) === Number(productId)) : null;

    Swal.fire({
        title: editing ? 'Editar producto' : 'Agregar producto',
        html: `
            <input id="swal-name" class="swal2-input" placeholder="Nombre" value="${product?.name || ''}">
            <input id="swal-price" class="swal2-input" type="number" min="0" placeholder="Precio" value="${product?.price ?? ''}">
            <input id="swal-stock" class="swal2-input" type="number" min="0" placeholder="Stock" value="${product?.stock ?? 0}">
            <input id="swal-image" class="swal2-input" placeholder="Ruta imagen (assets/xx.jpg)" value="${product?.image || 'assets/default.png'}">
            <input id="swal-category" class="swal2-input" placeholder="Categoría" value="${product?.category || ''}">
            <textarea id="swal-description" class="swal2-textarea" placeholder="Descripción">${product?.description || ''}</textarea>
        `,
        showCancelButton: true,
        confirmButtonText: editing ? 'Guardar' : 'Agregar',
        confirmButtonColor: '#ec5c8d',
        preConfirm: () => {
            const name = document.getElementById('swal-name').value.trim();
            const price = Number(document.getElementById('swal-price').value);
            const stock = Number(document.getElementById('swal-stock').value);
            const image = document.getElementById('swal-image').value.trim() || 'assets/default.png';
            const category = document.getElementById('swal-category').value.trim();
            const description = document.getElementById('swal-description').value.trim();

            if (!name || Number.isNaN(price) || price <= 0 || Number.isNaN(stock) || stock < 0) {
                Swal.showValidationMessage('Completa nombre, precio válido (> 0) y stock válido (>= 0).');
                return false;
            }
            return { name, price, stock, image, category, description };
        }
    }).then((result) => {
        if (!result.isConfirmed || !result.value) return;

        if (editing && product) {
            Object.assign(product, result.value);
        } else {
            state.catalog.push({ id: getNextId(state.catalog), ...result.value });
        }

        saveCatalog();
        refreshUI();
        Swal.fire('Guardado', 'Catálogo actualizado correctamente.', 'success');
    });
}

function deleteProduct(productId) {
    const product = state.catalog.find((item) => Number(item.id) === Number(productId));
    if (!product) return;

    Swal.fire({
        title: '¿Eliminar producto?',
        text: product.name,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Eliminar',
        confirmButtonColor: '#ec5c8d'
    }).then((result) => {
        if (!result.isConfirmed) return;
        state.catalog = state.catalog.filter((item) => Number(item.id) !== Number(productId));
        saveCatalog();
        refreshUI();
    });
}

function restoreCatalog() {
    Swal.fire({
        title: '¿Restaurar catálogo base?',
        text: 'Se reemplazará el catálogo actual por el listado original.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Restaurar',
        confirmButtonColor: '#ec5c8d'
    }).then((result) => {
        if (!result.isConfirmed) return;
        state.catalog = structuredCloneSafe(products);
        saveCatalog();
        refreshUI();
    });
}

function showRegisterSale() {
    const productOptions = state.catalog.map((item) => `<option value="${item.id}">${item.name} (stock: ${item.stock})</option>`).join('');
    const customerOptions = ['<option value="">Cliente nuevo</option>', ...state.customers.map((customer) => `<option value="${customer.id}">${customer.name} · ${customer.phone || 'sin teléfono'}</option>`)].join('');

    Swal.fire({
        title: 'Registrar venta',
        width: 640,
        html: `
            <select id="swal-customer" class="swal2-input">${customerOptions}</select>
            <input id="swal-customer-name" class="swal2-input" placeholder="Nombre cliente">
            <input id="swal-customer-phone" class="swal2-input" placeholder="Teléfono cliente">
            <input id="swal-customer-email" class="swal2-input" placeholder="Email cliente (opcional)">
            <select id="swal-product" class="swal2-input">${productOptions}</select>
            <input id="swal-qty" class="swal2-input" type="number" min="1" value="1" placeholder="Cantidad">
            <select id="swal-channel" class="swal2-input">
                <option value="WhatsApp">WhatsApp</option>
                <option value="Instagram">Instagram</option>
                <option value="Tienda física">Tienda física</option>
                <option value="Manual">Manual</option>
            </select>
            <textarea id="swal-notes" class="swal2-textarea" placeholder="Notas de venta (opcional)"></textarea>
        `,
        showCancelButton: true,
        confirmButtonText: 'Guardar venta',
        confirmButtonColor: '#ec5c8d',
        didOpen: () => {
            const customerSelect = document.getElementById('swal-customer');
            customerSelect.addEventListener('change', () => {
                const selected = state.customers.find((item) => Number(item.id) === Number(customerSelect.value));
                document.getElementById('swal-customer-name').value = selected?.name || '';
                document.getElementById('swal-customer-phone').value = selected?.phone || '';
                document.getElementById('swal-customer-email').value = selected?.email || '';
            });
        },
        preConfirm: () => {
            const productId = Number(document.getElementById('swal-product').value);
            const qty = Number(document.getElementById('swal-qty').value);
            const customerName = document.getElementById('swal-customer-name').value.trim();
            const customerPhone = document.getElementById('swal-customer-phone').value.trim();
            const customerEmail = document.getElementById('swal-customer-email').value.trim();
            const channel = document.getElementById('swal-channel').value;
            const notes = document.getElementById('swal-notes').value.trim();

            const product = state.catalog.find((item) => Number(item.id) === productId);
            if (!product) {
                Swal.showValidationMessage('Selecciona un producto válido.');
                return false;
            }
            if (Number.isNaN(qty) || qty <= 0) {
                Swal.showValidationMessage('Cantidad inválida.');
                return false;
            }
            if (product.stock < qty) {
                Swal.showValidationMessage(`Stock insuficiente. Solo hay ${product.stock} unidad(es).`);
                return false;
            }
            if (!customerName) {
                Swal.showValidationMessage('Ingresa al menos el nombre del cliente.');
                return false;
            }

            return { product, qty, customerName, customerPhone, customerEmail, channel, notes };
        }
    }).then((result) => {
        if (!result.isConfirmed || !result.value) return;
        const { product, qty, customerName, customerPhone, customerEmail, channel, notes } = result.value;

        product.stock -= qty;
        const total = Number(product.price) * qty;
        const sale = {
            id: getNextId(state.sales),
            createdAt: new Date().toISOString(),
            items: [{ productId: product.id, name: product.name, qty, unitPrice: product.price }],
            total,
            customerName,
            customerPhone,
            customerEmail,
            channel,
            notes
        };
        state.sales.push(sale);

        upsertCustomerFromSale(sale);

        saveCatalog();
        saveSales();
        saveCustomers();
        refreshUI();
        Swal.fire('Venta registrada', `Se guardó la venta por $${total.toLocaleString()}.`, 'success');
    });
}

function upsertCustomerFromSale(sale) {
    const nameKey = (sale.customerName || '').trim().toLowerCase();
    const phoneKey = (sale.customerPhone || '').trim();

    let customer = state.customers.find((item) => {
        const samePhone = phoneKey && item.phone && item.phone.trim() === phoneKey;
        const sameName = item.name && item.name.trim().toLowerCase() === nameKey;
        return samePhone || sameName;
    });

    if (!customer) {
        customer = {
            id: getNextId(state.customers),
            name: sale.customerName,
            phone: sale.customerPhone || '',
            email: sale.customerEmail || '',
            city: '',
            orderCount: 0,
            totalSpent: 0,
            lastPurchaseAt: null
        };
        state.customers.push(customer);
    }

    customer.name = sale.customerName || customer.name;
    customer.phone = sale.customerPhone || customer.phone;
    customer.email = sale.customerEmail || customer.email;
    customer.orderCount = Number(customer.orderCount || 0) + 1;
    customer.totalSpent = Number(customer.totalSpent || 0) + Number(sale.total || 0);
    customer.lastPurchaseAt = sale.createdAt;
}

function clearSales() {
    Swal.fire({
        title: '¿Limpiar ventas?',
        text: 'Esta acción borra el historial de ventas, pero no tocará catálogo ni clientes.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Limpiar',
        confirmButtonColor: '#ec5c8d'
    }).then((result) => {
        if (!result.isConfirmed) return;
        state.sales = [];
        saveSales();
        refreshUI();
    });
}

function showAddCustomer() {
    Swal.fire({
        title: 'Agregar cliente',
        html: `
            <input id="swal-c-name" class="swal2-input" placeholder="Nombre">
            <input id="swal-c-phone" class="swal2-input" placeholder="Teléfono">
            <input id="swal-c-email" class="swal2-input" placeholder="Email">
            <input id="swal-c-city" class="swal2-input" placeholder="Ciudad">
        `,
        showCancelButton: true,
        confirmButtonText: 'Guardar',
        confirmButtonColor: '#ec5c8d',
        preConfirm: () => {
            const name = document.getElementById('swal-c-name').value.trim();
            const phone = document.getElementById('swal-c-phone').value.trim();
            const email = document.getElementById('swal-c-email').value.trim();
            const city = document.getElementById('swal-c-city').value.trim();

            if (!name) {
                Swal.showValidationMessage('El nombre es obligatorio.');
                return false;
            }

            return { name, phone, email, city };
        }
    }).then((result) => {
        if (!result.isConfirmed || !result.value) return;

        state.customers.push({
            id: getNextId(state.customers),
            ...result.value,
            orderCount: 0,
            totalSpent: 0,
            lastPurchaseAt: null
        });
        saveCustomers();
        refreshUI();
    });
}

function deleteCustomer(customerId) {
    const customer = state.customers.find((item) => Number(item.id) === Number(customerId));
    if (!customer) return;

    Swal.fire({
        title: '¿Eliminar cliente?',
        text: customer.name,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Eliminar',
        confirmButtonColor: '#ec5c8d'
    }).then((result) => {
        if (!result.isConfirmed) return;
        state.customers = state.customers.filter((item) => Number(item.id) !== Number(customerId));
        saveCustomers();
        refreshUI();
    });
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
