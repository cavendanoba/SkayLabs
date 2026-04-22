// discordia/ventas.js
// ─────────────────────────────────────────────────────────────
// Módulo de Ventas del panel admin.
// - Historial completo desde PostgreSQL
// - Registrar nueva venta via /api/sales
// - Filtros por estado, canal y búsqueda
// ─────────────────────────────────────────────────────────────

import { getCatalog } from './catalog.js';

let allSales = [];

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
        <button onclick="location.reload()" class="mt-3 px-4 py-2 bg-gradient-to-r from-[#ecd9ff] to-[#ffd5e3] text-white rounded-xl text-sm font-semibold">Reintentar</button>
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
        <td class="p-3 font-bold text-[#a0346e] text-sm whitespace-nowrap">$${Number(s.total).toLocaleString('es-CO')}</td>
        <td class="p-3 text-sm text-gray-600">${s.channel||'—'}</td>
        <td class="p-3">${badge}</td>
        <td class="p-3 text-xs text-gray-400 max-w-[200px] truncate">${s.notes||'—'}</td>
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
          <p class="text-lg font-bold text-emerald-600">$${totalIngresos.toLocaleString('es-CO')}</p>
          <p class="text-xs text-gray-500">Cobrado</p>
        </div>
        <div class="bg-white px-4 py-3 text-center">
          <p class="text-lg font-bold text-amber-600">$${totalDeuda.toLocaleString('es-CO')}</p>
          <p class="text-xs text-gray-500">Por cobrar</p>
        </div>
      </div>

      <!-- Filtros -->
      <div class="p-4 border-b border-gray-100 flex flex-wrap gap-3">
        <input id="ventas-search" placeholder="Buscar cliente, canal, nota..."
          class="flex-1 min-w-[200px] px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#ecd9ff]"
          value="${query}">
        <select id="ventas-status"
          class="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#ecd9ff] bg-white">
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
            </tr>
          </thead>
          <tbody>
            ${rows || `<tr><td colspan="7" class="p-6 text-center text-gray-400">No hay ventas que coincidan.</td></tr>`}
          </tbody>
        </table>
      </div>
    </article>`;

  // Eventos de filtro
  container.querySelector('#ventas-search').addEventListener('input', e => {
    paintVentas(container, { query: e.target.value, status: container.querySelector('#ventas-status').value });
  });
  container.querySelector('#ventas-status').addEventListener('change', e => {
    paintVentas(container, { query: container.querySelector('#ventas-search').value, status: e.target.value });
  });

  // Botón nueva venta
  container.querySelector('#btn-nueva-venta').addEventListener('click', () => showNuevaVentaModal(container));
}

// ── MODAL NUEVA VENTA ─────────────────────────────────────────
async function showNuevaVentaModal(container) {
  const catalog = getCatalog();
  const productOptions = catalog.map(p =>
    `<option value="${p.id}" data-price="${p.price}" data-name="${p.name}" data-stock="${p.stock}">
      ${p.name} — $${p.price.toLocaleString('es-CO')} (stock: ${p.stock})
    </option>`
  ).join('');

  const { value: formValues, isConfirmed } = await Swal.fire({
    title: 'Registrar nueva venta',
    width: 620,
    html: `
      <div style="text-align:left;display:flex;flex-direction:column;gap:10px;">
        <div>
          <label style="font-size:12px;font-weight:600;color:#6d165a;display:block;margin-bottom:4px;">CLIENTE</label>
          <input id="sw-customer-name" class="swal2-input" style="margin:0;width:100%;" placeholder="Nombre de la clienta">
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
          <div>
            <label style="font-size:12px;font-weight:600;color:#6d165a;display:block;margin-bottom:4px;">TELÉFONO</label>
            <input id="sw-customer-phone" class="swal2-input" style="margin:0;width:100%;" placeholder="WhatsApp / Celular">
          </div>
          <div>
            <label style="font-size:12px;font-weight:600;color:#6d165a;display:block;margin-bottom:4px;">CANAL</label>
            <select id="sw-channel" class="swal2-input" style="margin:0;width:100%;">
              <option value="WhatsApp">WhatsApp</option>
              <option value="Instagram">Instagram</option>
              <option value="Efectivo">Efectivo</option>
              <option value="Nequi">Nequi</option>
              <option value="Daviplata">Daviplata</option>
              <option value="Presencial">Presencial</option>
            </select>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
          <div>
            <label style="font-size:12px;font-weight:600;color:#6d165a;display:block;margin-bottom:4px;">ESTADO DE PAGO</label>
            <select id="sw-payment" class="swal2-input" style="margin:0;width:100%;">
              <option value="paid">Pagado ✅</option>
              <option value="pending">Pendiente ⚠️</option>
            </select>
          </div>
          <div>
            <label style="font-size:12px;font-weight:600;color:#6d165a;display:block;margin-bottom:4px;">NOTAS</label>
            <input id="sw-notes" class="swal2-input" style="margin:0;width:100%;" placeholder="Opcional">
          </div>
        </div>
        <hr style="border-color:#f1d7e2;margin:4px 0;">
        <div>
          <label style="font-size:12px;font-weight:600;color:#6d165a;display:block;margin-bottom:4px;">PRODUCTO</label>
          <div style="display:grid;grid-template-columns:1fr auto;gap:8px;align-items:end;">
            <select id="sw-product" class="swal2-input" style="margin:0;width:100%;">
              ${productOptions}
            </select>
            <div>
              <label style="font-size:12px;font-weight:600;color:#6d165a;display:block;margin-bottom:4px;">CANT</label>
              <input id="sw-qty" type="number" min="1" value="1" class="swal2-input" style="margin:0;width:70px;">
            </div>
          </div>
        </div>
        <div id="sw-items-list" style="min-height:40px;background:#fdf2f7;border-radius:10px;padding:8px;font-size:13px;"></div>
        <button id="sw-add-item" type="button"
          style="background:linear-gradient(90deg,#ecd9ff,#ffd5e3);color:#fff;border:none;border-radius:10px;padding:8px 16px;font-weight:700;cursor:pointer;width:100%;">
          + Agregar producto a la venta
        </button>
        <div style="font-size:14px;font-weight:700;color:#a0346e;text-align:right;">
          Total: <span id="sw-total">$0</span>
        </div>
      </div>`,
    showCancelButton: true,
    confirmButtonText: 'Guardar venta',
    confirmButtonColor: '#ecd9ff',
    cancelButtonText: 'Cancelar',
    didOpen: () => {
      window._swItems = [];
      window._swUpdateTotal = () => {
        const t = window._swItems.reduce((s,i) => s+i.price*i.qty, 0);
        document.getElementById('sw-total').textContent = `$${t.toLocaleString('es-CO')}`;
        document.getElementById('sw-items-list').innerHTML = window._swItems.length
          ? window._swItems.map((i,idx) =>
              `<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-bottom:1px solid #f1d7e2;">
                <span>${i.name} x${i.qty}</span>
                <span style="color:#a0346e;font-weight:700;">$${(i.price*i.qty).toLocaleString('es-CO')}
                  <button data-idx="${idx}" style="background:none;border:none;color:#ecd9ff;cursor:pointer;margin-left:8px;font-size:16px;">✕</button>
                </span>
              </div>`).join('')
          : '<span style="color:#9ca3af;font-size:12px;">Sin productos aún</span>';

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
    await Swal.fire('¡Venta registrada!', `Total: $${formValues.items.reduce((s,i)=>s+i.price*i.quantity,0).toLocaleString('es-CO')}`, 'success');
    await renderVentas(container);
  } catch (err) {
    Swal.fire('Error', err.message || 'No se pudo guardar la venta.', 'error');
  }
}
