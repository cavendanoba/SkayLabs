// discordia/ventas.js
// ─────────────────────────────────────────────────────────────
// Módulo de Ventas del panel admin.
// - Historial completo desde PostgreSQL
// - Registrar nueva venta via /api/sales
// - Filtros por estado, canal y búsqueda
// ─────────────────────────────────────────────────────────────

import { getCatalog } from '../catalog.js';
import { formatCurrency } from '../utils.js';

let allSales = [];
let ventasDebounceTimer = null;

function debounceVentasRender(container, filtros) {
  clearTimeout(ventasDebounceTimer);
  ventasDebounceTimer = setTimeout(() => paintVentas(container, filtros), 300);
}

export async function renderVentas(container) {
  container.innerHTML = buildSkeleton();

  try {
    const res  = await fetch('/api/discordia/sales?limit=100');
    const json = await res.json();
    if (!json.ok) throw new Error();
    allSales = json.data;
  } catch {
    container.innerHTML = `
      <div class="bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl p-6 text-center">
        <p class="font-bold">Error al cargar ventas</p>
        <button onclick="location.reload()" class="mt-3 px-4 py-2 bg-gradient-to-r from-[#9d5fa5] to-[#d94a7b] text-white rounded-xl text-sm font-semibold">Reintentar</button>
      </div>`;
    return;
  }

  paintVentas(container);
}

function buildSkeleton() {
  return `<div class="space-y-3">${[1,2,3,4].map(()=>`<div class="animate-pulse bg-gray-100 rounded-2xl h-16"></div>`).join('')}</div>`;
}

function paintVentas(container, filtros = {}) {
  const { query = '', status = 'all' } = filtros;
  const q = query.trim().toLowerCase();

  const filtered = allSales.filter(s => {
    const matchStatus = status === 'all' || s.payment_status === status;
    const matchQuery  = !q ||
      (s.customer_name||'').toLowerCase().includes(q) ||
      (s.channel||'').toLowerCase().includes(q) ||
      (s.notes||'').toLowerCase().includes(q);
    return matchStatus && matchQuery;
  });

  const totalIngresos = filtered.filter(s=>s.payment_status==='paid').reduce((sum,s)=>sum+Number(s.total),0);
  const totalDeuda    = filtered.filter(s=>s.payment_status==='pending').reduce((sum,s)=>sum+Number(s.total)-Number(s.amount_paid),0);

  const rows = filtered.map(s => {
    const fecha = new Date(s.created_at).toLocaleDateString('es-CO', { day:'numeric', month:'short', year:'2-digit' });
    const itemCount = (s.items||[]).reduce((sum,i)=>sum+Number(i.quantity||1),0);
    const badge = s.payment_status === 'paid'
      ? `<span class="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">Pagado</span>`
      : `<span class="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">Pendiente</span>`;

    return `
      <tr class="border-b border-gray-100 hover:bg-[#fdf7fa] transition">
        <td class="p-3 text-xs text-gray-500 whitespace-nowrap">${fecha}</td>
        <td class="p-3">
          <p class="font-semibold text-gray-900 text-sm">${s.customer_name||'Sin nombre'}</p>
          <p class="text-xs text-gray-400">${s.customer_phone||'—'}</p>
        </td>
        <td class="p-3 text-center text-xs text-gray-600">${itemCount} item${itemCount!==1?'s':''}</td>
        <td class="p-3 font-bold text-[#a0346e] text-sm whitespace-nowrap">${formatCurrency(Number(s.total))}</td>
        <td class="p-3 text-sm text-gray-600">${s.channel||'—'}</td>
        <td class="p-3">${badge}</td>
        <td class="p-3 text-xs text-gray-400 max-w-[200px] truncate">${s.notes||'—'}</td>
        <td class="p-3">
          <div class="flex gap-2">
            <button class="view-sale px-3 py-1.5 rounded-lg bg-blue-100 text-blue-800 font-semibold text-xs hover:bg-blue-200 transition" data-id="${s.id}">👁️ Ver</button>
            <button class="edit-sale px-3 py-1.5 rounded-lg bg-amber-100 text-amber-800 font-semibold text-xs hover:bg-amber-200 transition" data-id="${s.id}">✏️ Editar</button>
            <button class="delete-sale px-3 py-1.5 rounded-lg bg-rose-100 text-rose-700 font-semibold text-xs hover:bg-rose-200 transition" data-id="${s.id}">🗑️ Eliminar</button>
          </div>
        </td>
      </tr>`;
  }).join('');

  container.innerHTML = `
    <article class="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">

      <!-- Header -->
      <div class="bg-gradient-to-r from-[#6d165a] to-[#a0346e] px-5 py-4 flex flex-wrap items-center justify-between gap-3">
        <h3 class="font-bold text-white text-lg" style="font-family:'Playfair Display',serif">🛍️ Historial de ventas</h3>
        <button id="btn-nueva-venta"
          class="px-4 py-2 bg-white/20 hover:bg-white/30 text-white text-sm font-semibold rounded-xl transition flex items-center gap-2">
          <i class="fa-solid fa-plus"></i> Nueva venta
        </button>
      </div>

      <!-- Resumen rápido -->
      <div class="grid grid-cols-3 gap-px bg-gray-100">
        <div class="bg-white px-4 py-3 text-center">
          <p class="text-lg font-bold text-[#6d165a]">${filtered.length}</p>
          <p class="text-xs text-gray-500">Ventas</p>
        </div>
        <div class="bg-white px-4 py-3 text-center">
          <p class="text-lg font-bold text-emerald-600">${formatCurrency(totalIngresos)}</p>
          <p class="text-xs text-gray-500">Cobrado</p>
        </div>
        <div class="bg-white px-4 py-3 text-center">
          <p class="text-lg font-bold text-amber-600">${formatCurrency(totalDeuda)}</p>
          <p class="text-xs text-gray-500">Por cobrar</p>
        </div>
      </div>

      <!-- Filtros -->
      <div class="p-4 border-b border-gray-100 flex flex-wrap gap-3">
        <input id="ventas-search" placeholder="Buscar cliente, canal, nota..."
          class="flex-1 min-w-[200px] px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#9d5fa5]"
          value="${query}">
        <select id="ventas-status"
          class="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#9d5fa5] bg-white">
          <option value="all"     ${status==='all'    ?'selected':''}>Todos</option>
          <option value="paid"    ${status==='paid'   ?'selected':''}>Pagados</option>
          <option value="pending" ${status==='pending'?'selected':''}>Pendientes</option>
        </select>
        <span class="self-center text-xs text-gray-400">Mostrando ${filtered.length} de ${allSales.length}</span>
      </div>

      <!-- Tabla -->
      <div class="overflow-x-auto">
        <table class="min-w-full text-sm">
          <thead class="bg-[#fdf2f7]">
            <tr>
              <th class="p-3 text-left text-xs uppercase tracking-widest text-[#6d165a] font-semibold">Fecha</th>
              <th class="p-3 text-left text-xs uppercase tracking-widest text-[#6d165a] font-semibold">Cliente</th>
              <th class="p-3 text-center text-xs uppercase tracking-widest text-[#6d165a] font-semibold">Items</th>
              <th class="p-3 text-left text-xs uppercase tracking-widest text-[#6d165a] font-semibold">Total</th>
              <th class="p-3 text-left text-xs uppercase tracking-widest text-[#6d165a] font-semibold">Canal</th>
              <th class="p-3 text-left text-xs uppercase tracking-widest text-[#6d165a] font-semibold">Estado</th>
              <th class="p-3 text-left text-xs uppercase tracking-widest text-[#6d165a] font-semibold">Notas</th>
              <th class="p-3 text-left text-xs uppercase tracking-widest text-[#6d165a] font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody>
            ${rows || `<tr><td colspan="8" class="p-6 text-center text-gray-400">No hay ventas que coincidan.</td></tr>`}
          </tbody>
        </table>
      </div>
    </article>`;

  // Eventos de filtro
  container.querySelector('#ventas-search').addEventListener('input', e => {
    debounceVentasRender(container, { query: e.target.value, status: container.querySelector('#ventas-status').value });
  });
  container.querySelector('#ventas-status').addEventListener('change', e => {
    debounceVentasRender(container, { query: container.querySelector('#ventas-search').value, status: e.target.value });
  });

  // Botón nueva venta
  container.querySelector('#btn-nueva-venta').addEventListener('click', () => showNuevaVentaModal(container));

  // Botones de ver/editar/eliminar ventas
  container.querySelectorAll('.view-sale').forEach(btn => 
    btn.addEventListener('click', () => showVentaDetailsModal(Number(btn.dataset.id)))
  );
  container.querySelectorAll('.edit-sale').forEach(btn => 
    btn.addEventListener('click', () => showEditVentaModal(container, Number(btn.dataset.id)))
  );
  container.querySelectorAll('.delete-sale').forEach(btn => 
    btn.addEventListener('click', () => deleteSale(container, Number(btn.dataset.id)))
  );
}

// ── MODAL NUEVA VENTA ─────────────────────────────────────────
async function showNuevaVentaModal(container) {
  const catalog = getCatalog();
  const productOptions = catalog.map(p =>
    `<option value="${p.id}" data-price="${p.price}" data-name="${p.name}" data-stock="${p.stock}">
      ${p.name} — ${formatCurrency(p.price)} (stock: ${p.stock})
    </option>`
  ).join('');
 
  const { value: formValues, isConfirmed } = await Swal.fire({
    title: 'Registrar nueva venta',
    width: 720,
    padding: '28px',
    html: `
      <div style="text-align:left;display:flex;flex-direction:column;gap:20px;font-family:inherit;">
 
        <!-- SECCIÓN: DATOS DEL CLIENTE -->
        <section>
          <h3 style="font-size:13px;font-weight:800;color:#a0346e;text-transform:uppercase;letter-spacing:.04em;margin:0 0 10px;">
            Datos del cliente
          </h3>
          <div style="display:flex;flex-direction:column;gap:12px;">
            <div>
              <label style="font-size:12px;font-weight:600;color:#6d165a;display:block;margin-bottom:6px;">Cliente</label>
              <input id="sw-customer-name" class="swal2-input" style="margin:0;width:100%;height:44px;" placeholder="Nombre de la clienta">
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
              <div>
                <label style="font-size:12px;font-weight:600;color:#6d165a;display:block;margin-bottom:6px;">Teléfono</label>
                <input id="sw-customer-phone" class="swal2-input" style="margin:0;width:100%;height:44px;" placeholder="WhatsApp / Celular">
              </div>
              <div>
                <label style="font-size:12px;font-weight:600;color:#6d165a;display:block;margin-bottom:6px;">Canal</label>
                <select id="sw-channel" class="swal2-input" style="margin:0;width:100%;height:44px;">
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Instagram">Instagram</option>
                  <option value="Efectivo">Efectivo</option>
                  <option value="Nequi">Nequi</option>
                  <option value="Daviplata">Daviplata</option>
                  <option value="Presencial">Presencial</option>
                </select>
              </div>
            </div>
          </div>
        </section>
 
        <hr style="border:none;border-top:1px solid #f1d7e2;margin:0;">
 
        <!-- SECCIÓN: PAGO -->
        <section>
          <h3 style="font-size:13px;font-weight:800;color:#a0346e;text-transform:uppercase;letter-spacing:.04em;margin:0 0 10px;">
            Pago
          </h3>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
            <div>
              <label style="font-size:12px;font-weight:600;color:#6d165a;display:block;margin-bottom:6px;">Estado de pago</label>
              <select id="sw-payment" class="swal2-input" style="margin:0;width:100%;height:44px;">
                <option value="paid">Pagado ✅</option>
                <option value="pending">Pendiente ⚠️</option>
              </select>
            </div>
            <div>
              <label style="font-size:12px;font-weight:600;color:#6d165a;display:block;margin-bottom:6px;">Notas</label>
              <input id="sw-notes" class="swal2-input" style="margin:0;width:100%;height:44px;" placeholder="Opcional">
            </div>
          </div>
        </section>
 
        <hr style="border:none;border-top:1px solid #f1d7e2;margin:0;">
 
        <!-- SECCIÓN: PRODUCTOS -->
        <section>
          <h3 style="font-size:13px;font-weight:800;color:#a0346e;text-transform:uppercase;letter-spacing:.04em;margin:0 0 10px;">
            Productos de la venta
          </h3>
 
          <input id="sw-product-search" type="text"
            placeholder="🔍 Buscar producto por nombre o código..."
            class="swal2-input" style="margin:0 0 10px;width:100%;height:42px;font-size:14px;">
 
          <div style="display:grid;grid-template-columns:1fr 90px;gap:10px;align-items:end;">
            <div>
              <label style="font-size:12px;font-weight:600;color:#6d165a;display:block;margin-bottom:6px;">Producto</label>
              <select id="sw-product" class="swal2-input" style="margin:0;width:100%;height:44px;">
                ${productOptions}
              </select>
            </div>
            <div>
              <label style="font-size:12px;font-weight:600;color:#6d165a;display:block;margin-bottom:6px;">Cant.</label>
              <input id="sw-qty" type="number" min="1" value="1" class="swal2-input" style="margin:0;width:100%;height:44px;text-align:center;">
            </div>
          </div>
 
          <button id="sw-add-item" type="button"
            style="margin-top:12px;background:linear-gradient(90deg,#9d5fa5,#d94a7b);color:#fff;border:none;border-radius:10px;padding:12px 16px;font-weight:700;font-size:14px;cursor:pointer;width:100%;">
            + Agregar producto a la venta
          </button>
 
          <div id="sw-items-list"
            style="margin-top:14px;min-height:48px;background:#fdf2f7;border-radius:12px;padding:12px;font-size:13px;">
          </div>
 
          <div style="margin-top:14px;padding-top:14px;border-top:2px solid #f1d7e2;font-size:17px;font-weight:800;color:#a0346e;text-align:right;">
            Total: <span id="sw-total">$0</span>
          </div>
        </section>
 
      </div>`,
    showCancelButton: true,
    confirmButtonText: 'Guardar venta',
    confirmButtonColor: '#a0346e',
    cancelButtonText: 'Cancelar',
    didOpen: () => {
      window._swItems = [];
 
      // Filtro en vivo del selector de productos
      const allOptionsHTML = productOptions;
      document.getElementById('sw-product-search').addEventListener('input', (e) => {
        const q = e.target.value.toLowerCase();
        const filtered = catalog
          .filter(p => p.name.toLowerCase().includes(q) || (p.code || '').toLowerCase().includes(q))
          .map(p =>
            `<option value="${p.id}" data-price="${p.price}" data-name="${p.name}" data-stock="${p.stock}">
              ${p.name} — ${formatCurrency(p.price)} (stock: ${p.stock})
            </option>`
          ).join('');
        document.getElementById('sw-product').innerHTML = filtered || allOptionsHTML;
      });
 
      window._swUpdateTotal = () => {
        const t = window._swItems.reduce((s,i) => s+i.price*i.qty, 0);
        document.getElementById('sw-total').textContent = formatCurrency(t);
        document.getElementById('sw-items-list').innerHTML = window._swItems.length
          ? window._swItems.map((i,idx) =>
              `<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 4px;border-bottom:1px solid #f1d7e2;">
                <span style="font-weight:500;">${i.name} <span style="color:#c48bb0;">×${i.qty}</span></span>
                <span style="color:#a0346e;font-weight:700;display:flex;align-items:center;gap:8px;">
                  ${formatCurrency(i.price*i.qty)}
                  <button data-idx="${idx}" style="background:#fff;border:1px solid #f1d7e2;color:#a0346e;cursor:pointer;width:24px;height:24px;border-radius:50%;font-size:13px;line-height:1;">✕</button>
                </span>
              </div>`).join('')
          : '<span style="color:#9ca3af;font-size:13px;">Sin productos aún</span>';
 
        document.getElementById('sw-items-list').querySelectorAll('button[data-idx]').forEach(btn => {
          btn.addEventListener('click', () => {
            window._swItems.splice(Number(btn.dataset.idx), 1);
            window._swUpdateTotal();
          });
        });
      };
 
      document.getElementById('sw-add-item').addEventListener('click', () => {
        const sel   = document.getElementById('sw-product');
        const opt   = sel.options[sel.selectedIndex];
        const qty   = Math.max(1, parseInt(document.getElementById('sw-qty').value) || 1);
        const stock = parseInt(opt.dataset.stock);
        if (qty > stock) { Swal.showValidationMessage(`Stock insuficiente (${stock} disponibles).`); return; }
        window._swItems.push({
          productId:   parseInt(opt.value),
          productName: opt.dataset.name,
          name:        opt.dataset.name,
          price:       parseInt(opt.dataset.price),
          qty
        });
        document.getElementById('sw-qty').value = 1;
        window._swUpdateTotal();
      });
    },
    preConfirm: () => {
      const customerName = document.getElementById('sw-customer-name').value.trim();
      if (!customerName) { Swal.showValidationMessage('El nombre del cliente es obligatorio.'); return false; }
      if (!window._swItems?.length) { Swal.showValidationMessage('Agrega al menos un producto.'); return false; }
      return {
        customerName,
        customerPhone: document.getElementById('sw-customer-phone').value.trim(),
        channel:       document.getElementById('sw-channel').value,
        paymentStatus: document.getElementById('sw-payment').value,
        notes:         document.getElementById('sw-notes').value.trim(),
        items: window._swItems.map(i => ({
          productId:   i.productId,
          name:        i.name || i.productName,
          productName: i.productName,
          price:       i.price,
          quantity:    i.qty
        }))
      };
    }
  });

  if (!isConfirmed || !formValues) return;

  try {
    const res  = await fetch('/api/discordia/sales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formValues)
    });
    const json = await res.json();
    if (!json.ok) throw new Error(json.message);
    await Swal.fire('¡Venta registrada!', `Total: ${formatCurrency(formValues.items.reduce((s,i)=>s+i.price*i.quantity,0))}`, 'success');
    await renderVentas(container);
  } catch (err) {
    Swal.fire('Error', err.message || 'No se pudo guardar la venta.', 'error');
  }
}

// ── EDITAR VENTA ──────────────────────────────────────────────
async function showEditVentaModal(container, saleId) {
  return new Promise((resolve) => {
    const sale = allSales.find(s => s.id === saleId);
    if (!sale) return resolve();

    const catalog = getCatalog();
    let editItems = JSON.parse(JSON.stringify(sale.items || []));

    // Crear overlay y modal
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4';
    overlay.style.animation = 'fadeIn 0.2s ease-out';

    const modal = document.createElement('div');
    modal.className = 'bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto';
    modal.style.animation = 'slideUp 0.3s ease-out';

    const saleDate = sale.created_at ? new Date(sale.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

    modal.innerHTML = `
      <style>
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .error-msg { color: #dc2626; font-size: 0.875rem; margin-top: 4px; display: none; }
        .input-error { border-color: #dc2626 !important; }
      </style>

      <!-- Header -->
      <div class="bg-gradient-to-r from-[#6d165a] to-[#9d5fa5] px-6 py-5 flex items-center justify-between">
        <h2 class="text-xl font-bold text-white" style="font-family: 'Playfair Display', serif;">
          ✏️ Editar Venta
        </h2>
        <button class="close-modal text-white hover:bg-white/20 p-2 rounded-lg transition">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>

      <!-- Content -->
      <div class="p-6 space-y-6" onclick="event.stopPropagation()">
        <!-- Cliente y Fecha -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-semibold text-[#6d165a] mb-2">Nombre del Cliente *</label>
            <input type="text" id="modal-customer-name" 
              value="${sale.customer_name||''}" 
              onclick="event.stopPropagation()"
              class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-[#9d5fa5] focus:ring-2 focus:ring-[#9d5fa5]/20 transition">
            <div class="error-msg" id="error-customer-name"></div>
          </div>
          <div>
            <label class="block text-sm font-semibold text-[#6d165a] mb-2">Fecha de la Venta</label>
            <input type="date" id="modal-sale-date" 
              value="${saleDate}"
              onclick="event.stopPropagation()"
              class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-[#9d5fa5] focus:ring-2 focus:ring-[#9d5fa5]/20 transition">
          </div>
        </div>

        <!-- Teléfono y Canal -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-semibold text-[#6d165a] mb-2">Teléfono</label>
            <input type="text" id="modal-customer-phone" 
              value="${sale.customer_phone||''}" 
              placeholder="WhatsApp / Celular"
              onclick="event.stopPropagation()"
              class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-[#9d5fa5] focus:ring-2 focus:ring-[#9d5fa5]/20 transition">
          </div>
          <div>
            <label class="block text-sm font-semibold text-[#6d165a] mb-2">Canal</label>
            <select id="modal-channel" onclick="event.stopPropagation()" class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-[#9d5fa5] focus:ring-2 focus:ring-[#9d5fa5]/20 transition bg-white">
              <option value="WhatsApp" ${sale.channel==='WhatsApp'?'selected':''}>WhatsApp</option>
              <option value="Instagram" ${sale.channel==='Instagram'?'selected':''}>Instagram</option>
              <option value="Efectivo" ${sale.channel==='Efectivo'?'selected':''}>Efectivo</option>
              <option value="Nequi" ${sale.channel==='Nequi'?'selected':''}>Nequi</option>
              <option value="Daviplata" ${sale.channel==='Daviplata'?'selected':''}>Daviplata</option>
              <option value="Presencial" ${sale.channel==='Presencial'?'selected':''}>Presencial</option>
            </select>
          </div>
        </div>

        <!-- Estado de Pago y Notas -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-semibold text-[#6d165a] mb-2">Estado de Pago</label>
            <select id="modal-payment" onclick="event.stopPropagation()" class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-[#9d5fa5] focus:ring-2 focus:ring-[#9d5fa5]/20 transition bg-white">
              <option value="paid" ${sale.payment_status==='paid'?'selected':''}>Pagado ✅</option>
              <option value="pending" ${sale.payment_status==='pending'?'selected':''}>Pendiente ⚠️</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-semibold text-[#6d165a] mb-2">Notas</label>
            <input type="text" id="modal-notes" 
              value="${sale.notes||''}" 
              placeholder="Opcional"
              onclick="event.stopPropagation()"
              class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-[#9d5fa5] focus:ring-2 focus:ring-[#9d5fa5]/20 transition">
          </div>
        </div>

        <!-- Productos -->
        <div class="border-t pt-6">
          <h3 class="text-sm font-bold text-[#6d165a] uppercase tracking-widest mb-4">Productos de la Venta</h3>
          
          <!-- Agregar producto -->
          <div class="grid grid-cols-3 gap-3 mb-4">
            <div>
              <label class="block text-xs font-semibold text-[#6d165a] mb-2">Producto</label>
              <select id="modal-product-select" onclick="event.stopPropagation()" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#9d5fa5] bg-white">
                <option value="">-- Seleccionar producto --</option>
                ${catalog.filter(p => p.active !== false).map(p => `<option value="${p.id}" data-price="${p.price}" data-name="${p.name}">${p.name} — $${Number(p.price).toLocaleString('es-CO')}</option>`).join('')}
              </select>
            </div>
            <div>
              <label class="block text-xs font-semibold text-[#6d165a] mb-2">Cantidad</label>
              <input type="number" id="modal-product-qty" onclick="event.stopPropagation()" min="1" value="1" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#9d5fa5]">
            </div>
            <div class="flex items-end">
              <button id="modal-add-product" type="button" onclick="event.stopPropagation()" class="w-full px-3 py-2 bg-gradient-to-r from-[#6d165a] to-[#9d5fa5] text-white font-semibold text-sm rounded-lg hover:shadow-md transition">
                ➕ Agregar
              </button>
            </div>
          </div>

          <!-- Lista de productos -->
          <div id="modal-items-list" class="bg-[#fdf2f7] rounded-lg p-4 space-y-2 min-h-[100px]">
          </div>
        </div>

        <!-- Total -->
        <div class="bg-gradient-to-r from-[#fdf2f7] to-[#f5ede8] px-4 py-3 rounded-lg flex justify-between items-center">
          <span class="text-lg font-bold text-[#6d165a]">Total:</span>
          <span class="text-2xl font-bold text-[#a0346e]" id="modal-total">$0</span>
        </div>

        <!-- Mensaje de error -->
        <div class="error-msg bg-red-50 px-4 py-3 rounded-lg border border-red-200" id="error-general"></div>
      </div>

      <!-- Footer -->
      <div class="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t border-gray-100">
        <button class="close-modal px-5 py-2.5 text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition" onclick="event.stopPropagation()">
          Cancelar
        </button>
        <button class="save-sale px-5 py-2.5 bg-gradient-to-r from-[#6d165a] to-[#9d5fa5] text-white font-semibold rounded-lg hover:shadow-lg transition flex items-center gap-2" onclick="event.stopPropagation()">
          <span class="save-text">💾 Guardar Cambios</span>
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

    const updateItemsList = () => {
      const itemsList = modal.querySelector('#modal-items-list');
      const total = editItems.reduce((sum, i) => sum + (i.price * (i.quantity || 1)), 0);
      modal.querySelector('#modal-total').textContent = formatCurrency(total);

      if (editItems.length === 0) {
        itemsList.innerHTML = '<p class="text-gray-400 text-sm text-center py-4">Sin productos</p>';
        return;
      }

      itemsList.innerHTML = editItems.map((item, idx) => `
        <div class="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100">
          <div class="flex-1 min-w-0">
            <p class="font-semibold text-gray-900 text-sm">${item.productName || item.name || 'Producto sin nombre'}</p>
            <p class="text-xs text-gray-500">×${item.quantity || 1}</p>
          </div>
          <div class="flex items-center gap-2">
            <input type="number" data-idx="${idx}" class="edit-price-input w-20 px-2 py-1 border border-gray-200 rounded text-sm text-right" value="${item.price}" min="0" onclick="event.stopPropagation()">
            <span class="font-bold text-[#a0346e] text-sm whitespace-nowrap w-20 text-right">${formatCurrency(item.price * (item.quantity || 1))}</span>
            <button data-idx="${idx}" type="button" class="delete-item px-2 py-1 text-red-600 hover:bg-red-50 rounded text-sm font-semibold" onclick="event.stopPropagation()">✕</button>
          </div>
        </div>
      `).join('');

      itemsList.querySelectorAll('.edit-price-input').forEach(input => {
        input.addEventListener('change', () => {
          const idx = Number(input.dataset.idx);
          editItems[idx].price = Number(input.value) || 0;
          updateItemsList();
        });
      });

      itemsList.querySelectorAll('.delete-item').forEach(btn => {
        btn.addEventListener('click', () => {
          editItems.splice(Number(btn.dataset.idx), 1);
          updateItemsList();
        });
      });
    };

    const closeModal = () => {
      overlay.style.animation = 'fadeOut 0.2s ease-out';
      modal.style.animation = 'slideDown 0.3s ease-out';
      setTimeout(() => {
        overlay.remove();
        resolve();
      }, 300);
    };

    const closeBtn = modal.querySelectorAll('.close-modal');
    closeBtn.forEach(btn => btn.addEventListener('click', closeModal));
    
    // Evitar cerrar modal al hacer clic en elementos del formulario
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay && !e.target.closest('select') && !e.target.closest('input') && !e.target.closest('textarea')) {
        closeModal();
      }
    });
    
    // Prevenir cierre accidental en selects, inputs y textareas
    modal.querySelectorAll('select, input, textarea').forEach(el => {
      el.addEventListener('click', (e) => e.stopPropagation());
      el.addEventListener('change', (e) => e.stopPropagation());
    });

    const addProductBtn = modal.querySelector('#modal-add-product');
    const productSelect = modal.querySelector('#modal-product-select');
    const qtyInput = modal.querySelector('#modal-product-qty');

    addProductBtn.addEventListener('click', () => {
      const opt = productSelect.options[productSelect.selectedIndex];
      if (!opt.value) {
        alert('Selecciona un producto');
        return;
      }
      const qty = Math.max(1, parseInt(qtyInput.value) || 1);
      editItems.push({
        productId: parseInt(opt.value),
        productName: opt.dataset.name,
        name: opt.dataset.name,
        price: parseInt(opt.dataset.price),
        quantity: qty
      });
      qtyInput.value = 1;
      productSelect.value = '';
      updateItemsList();
    });

    const saveBtn = modal.querySelector('.save-sale');
    const saveLoader = modal.querySelector('.save-loader');
    const saveText = modal.querySelector('.save-text');

    saveBtn.addEventListener('click', async () => {
      const customerName = modal.querySelector('#modal-customer-name').value.trim();
      if (!customerName) {
        alert('El nombre del cliente es obligatorio');
        return;
      }
      if (editItems.length === 0) {
        alert('Agrega al menos un producto');
        return;
      }

      saveBtn.disabled = true;
      saveLoader.classList.remove('hidden');
      saveText.textContent = 'Guardando...';

      try {
        const payload = {
          customerName,
          customerPhone: modal.querySelector('#modal-customer-phone').value.trim(),
          channel: modal.querySelector('#modal-channel').value,
          paymentStatus: modal.querySelector('#modal-payment').value,
          notes: modal.querySelector('#modal-notes').value.trim(),
          items: editItems.map(i => ({
            productId: i.productId,
            name: i.name || i.productName,
            quantity: i.quantity,
            price: i.price
          }))
        };

        const res = await fetch(`/api/discordia/sales/${saleId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const json = await res.json();
        if (!json.ok) throw new Error(json.message);

        const toast = document.createElement('div');
        toast.className = 'fixed top-5 right-5 bg-green-500 text-white px-5 py-3 rounded-lg shadow-lg';
        toast.textContent = '✓ Venta actualizada correctamente';
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);

        await renderVentas(container);
        closeModal();
      } catch (err) {
        alert('Error: ' + (err.message || 'No se pudo guardar'));
      } finally {
        saveBtn.disabled = false;
        saveLoader.classList.add('hidden');
        saveText.textContent = '💾 Guardar Cambios';
      }
    });

    updateItemsList();
  });
}

// ── VER DETALLES DE VENTA (COMPRAS) ────────────────────────────
function showVentaDetailsModal(saleId) {
  const sale = allSales.find(s => s.id === saleId);
  if (!sale) return;

  const items = sale.items || [];
  const fecha = new Date(sale.created_at).toLocaleDateString('es-CO', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const overlay = document.createElement('div');
  overlay.className = 'fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50';
  overlay.style.animation = 'fadeIn 0.3s ease-out';

  const modal = document.createElement('div');
  modal.className = 'bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto';
  modal.style.animation = 'slideUp 0.3s ease-out';
  modal.onclick = (e) => e.stopPropagation();

  modal.innerHTML = `
    <style>
      @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
      @keyframes slideDown { from { transform: translateY(0); opacity: 1; } to { transform: translateY(20px); opacity: 0; } }
    </style>

    <!-- Header -->
    <div class="bg-gradient-to-r from-[#6d165a] to-[#9d5fa5] px-6 py-5 flex items-center justify-between sticky top-0 z-10">
      <div class="flex-1">
        <h2 class="text-xl font-bold text-white" style="font-family: 'Playfair Display', serif;">
          👁️ Detalles de Compra
        </h2>
        <p class="text-white/80 text-sm mt-1">${fecha}</p>
      </div>
      <button class="close-modal text-white hover:bg-white/20 p-2 rounded-lg transition">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </button>
    </div>

    <!-- Content -->
    <div class="p-6 space-y-6">
      <!-- Información de la Cliente -->
      <div class="bg-[#fdf2f7] rounded-lg p-4 space-y-3">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-xs text-gray-500 uppercase tracking-widest font-semibold">Cliente</p>
            <p class="text-lg font-bold text-[#6d165a]">${sale.customer_name || 'Sin nombre'}</p>
          </div>
          <div class="text-right">
            <p class="text-xs text-gray-500 uppercase tracking-widest font-semibold">Teléfono</p>
            <p class="text-sm font-semibold text-gray-900">${sale.customer_phone || '—'}</p>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <p class="text-xs text-gray-500 uppercase tracking-widest font-semibold">Canal</p>
            <p class="text-sm font-semibold text-gray-900">${sale.channel || '—'}</p>
          </div>
          <div>
            <p class="text-xs text-gray-500 uppercase tracking-widest font-semibold">Estado de Pago</p>
            <p class="text-sm font-semibold">
              ${sale.payment_status === 'paid' 
                ? '<span class="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-xs font-bold">✅ Pagado</span>' 
                : '<span class="bg-amber-100 text-amber-700 px-2 py-1 rounded text-xs font-bold">⏳ Pendiente</span>'}
            </p>
          </div>
        </div>
        ${sale.notes ? `<div class="pt-2 border-t border-[#f1d7e2]">
          <p class="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-1">Notas</p>
          <p class="text-sm text-gray-700">${sale.notes}</p>
        </div>` : ''}
      </div>

      <!-- Productos Comprados -->
      <div>
        <h3 class="text-sm font-bold text-[#6d165a] uppercase tracking-widest mb-4">📦 Productos Comprados</h3>
        
        ${items.length === 0 
          ? `<div class="bg-gray-50 rounded-lg p-6 text-center text-gray-500">
              <p>No hay productos registrados para esta venta</p>
            </div>`
          : `<div class="space-y-3">
              ${items.map((item, idx) => `
                <div class="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition">
                  <div class="flex-1 min-w-0">
                    <p class="font-semibold text-gray-900">${item.name || item.productName || 'Producto sin nombre'}</p>
                    <p class="text-sm text-gray-500">Cantidad: ${item.quantity || 1}</p>
                  </div>
                  <div class="text-right ml-4">
                    <p class="text-xs text-gray-500">Precio unitario</p>
                    <p class="font-bold text-gray-900">${formatCurrency(item.price)}</p>
                  </div>
                  <div class="text-right ml-4 pl-4 border-l border-gray-200 min-w-[100px]">
                    <p class="text-xs text-gray-500">Subtotal</p>
                    <p class="text-lg font-bold text-[#a0346e]">${formatCurrency(item.price * (item.quantity || 1))}</p>
                  </div>
                </div>
              `).join('')}
            </div>`
        }
      </div>

      <!-- Total -->
      <div class="bg-gradient-to-r from-[#fdf2f7] to-[#f5ede8] px-6 py-4 rounded-lg flex justify-between items-center border-2 border-[#e8c1d8]">
        <span class="text-lg font-bold text-[#6d165a]">Total de la Compra:</span>
        <span class="text-3xl font-bold text-[#a0346e]">${formatCurrency(Number(sale.total) || items.reduce((sum, i) => sum + (i.price * (i.quantity || 1)), 0))}</span>
      </div>
    </div>

    <!-- Footer -->
    <div class="bg-gray-50 px-6 py-4 border-t border-gray-100 flex justify-end">
      <button class="close-modal px-6 py-2.5 bg-gradient-to-r from-[#6d165a] to-[#9d5fa5] text-white font-semibold rounded-lg hover:shadow-lg transition" onclick="event.stopPropagation()">
        Cerrar
      </button>
    </div>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  const closeBtn = modal.querySelectorAll('.close-modal');
  closeBtn.forEach(btn => btn.addEventListener('click', () => {
    overlay.style.animation = 'fadeOut 0.2s ease-out';
    modal.style.animation = 'slideDown 0.3s ease-out';
    setTimeout(() => overlay.remove(), 300);
  }));

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.style.animation = 'fadeOut 0.2s ease-out';
      modal.style.animation = 'slideDown 0.3s ease-out';
      setTimeout(() => overlay.remove(), 300);
    }
  });
}

// ── ELIMINAR VENTA ────────────────────────────────────────────
async function deleteSale(container, saleId) {
  const sale = allSales.find(s => s.id === saleId);
  if (!sale) return;

  const { isConfirmed } = await Swal.fire({
    title: '¿Eliminar venta?',
    text: `${sale.customer_name} - ${formatCurrency(Number(sale.total))}`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Eliminar',
    confirmButtonColor: '#9d5fa5'
  });

  if (!isConfirmed) return;

  try {
    const res  = await fetch(`/api/discordia/sales/${saleId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(error || `HTTP ${res.status}`);
    }

    const json = await res.json();
    if (!json.ok) throw new Error(json.message);
    
    await Swal.fire('Eliminada', 'Venta eliminada correctamente.', 'success');
    await renderVentas(container);
  } catch (err) {
    Swal.fire('Error', err.message || 'No se pudo eliminar la venta.', 'error');
  }
}
