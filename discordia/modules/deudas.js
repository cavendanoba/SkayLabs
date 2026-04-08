// discordia/modules/deudas.js
// ─────────────────────────────────────────────────────────────
// Módulo de Deudas del panel admin.
// - Lista todas las ventas con payment_status = 'pending'
// - Permite registrar abonos via /api/discordia/payments
// - Permite marcar una venta como pagada completamente
// ─────────────────────────────────────────────────────────────

export async function renderDeudas(container) {
  container.innerHTML = `<div class="animate-pulse bg-gray-100 rounded-2xl h-64"></div>`;

  let ventas = [];
  try {
    const res  = await fetch('/api/discordia/sales?status=pending&limit=200');
    const json = await res.json();
    if (!json.ok) throw new Error();
    ventas = json.data;
  } catch {
    container.innerHTML = `
      <div class="bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl p-6 text-center">
        <p class="font-bold">Error al cargar deudas</p>
        <button onclick="location.reload()" class="mt-3 px-4 py-2 bg-gradient-to-r from-[#ec5c8d] to-[#ff8c91] text-white rounded-xl text-sm font-semibold">Reintentar</button>
      </div>`;
    return;
  }

  paintDeudas(container, ventas);
}

function paintDeudas(container, ventas) {
  const totalDeuda = ventas.reduce((s,v) => s + (Number(v.total) - Number(v.amount_paid)), 0);

  if (!ventas.length) {
    container.innerHTML = `
      <article class="bg-emerald-50 border border-emerald-100 rounded-2xl p-10 text-center shadow-sm">
        <span class="text-5xl block mb-4">🎉</span>
        <p class="font-bold text-emerald-800 text-xl" style="font-family:'Playfair Display',serif">¡Sin deudas pendientes!</p>
        <p class="text-emerald-600 mt-2 text-sm">Todas las clientas han pagado sus compras.</p>
      </article>`;
    return;
  }

  const rows = ventas.map(v => {
    const fecha    = new Date(v.created_at).toLocaleDateString('es-CO', { day:'numeric', month:'short', year:'2-digit' });
    const pendiente = Number(v.total) - Number(v.amount_paid);
    const pct       = Math.round((Number(v.amount_paid) / Number(v.total)) * 100);
    const itemNames = (v.items||[]).map(i=>`${i.product_name} x${i.quantity}`).join(', ') || '—';

    return `
      <tr class="border-b border-gray-100 hover:bg-[#fdf7fa] transition">
        <td class="p-3">
          <p class="font-semibold text-gray-900 text-sm">${v.customer_name||'Sin nombre'}</p>
          <p class="text-xs text-gray-400">${v.customer_phone||'Sin teléfono'}</p>
        </td>
        <td class="p-3 text-xs text-gray-500 whitespace-nowrap">${fecha}</td>
        <td class="p-3 text-xs text-gray-500 max-w-[180px] truncate" title="${itemNames}">${itemNames}</td>
        <td class="p-3">
          <p class="font-bold text-gray-800 text-sm">$${Number(v.total).toLocaleString('es-CO')}</p>
          <p class="text-xs text-emerald-600">Abonado: $${Number(v.amount_paid).toLocaleString('es-CO')}</p>
          <div class="w-full bg-gray-100 rounded-full h-1 mt-1">
            <div class="bg-emerald-400 h-1 rounded-full" style="width:${pct}%"></div>
          </div>
        </td>
        <td class="p-3 font-bold text-rose-600 text-sm whitespace-nowrap">$${pendiente.toLocaleString('es-CO')}</td>
        <td class="p-3">
          <div class="flex gap-2">
            <button data-sale-id="${v.id}" data-pendiente="${pendiente}" data-name="${v.customer_name||'Cliente'}"
              class="btn-abonar px-3 py-1.5 rounded-lg bg-amber-100 text-amber-800 font-semibold text-xs hover:bg-amber-200 transition whitespace-nowrap">
              💳 Abonar
            </button>
            <button data-sale-id="${v.id}" data-pendiente="${pendiente}" data-name="${v.customer_name||'Cliente'}"
              class="btn-pagar px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-700 font-semibold text-xs hover:bg-emerald-200 transition whitespace-nowrap">
              ✅ Pagado
            </button>
          </div>
        </td>
      </tr>`;
  }).join('');

  container.innerHTML = `
    <article class="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
      <div class="bg-gradient-to-r from-amber-500 to-orange-400 px-5 py-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 class="font-bold text-white text-lg" style="font-family:'Playfair Display',serif">⚠️ Deudas pendientes</h3>
          <p class="text-white/70 text-xs mt-0.5">${ventas.length} venta${ventas.length!==1?'s':''} por cobrar</p>
        </div>
        <div class="text-right">
          <p class="text-white text-xs">Total adeudado</p>
          <p class="text-white font-bold text-xl">$${totalDeuda.toLocaleString('es-CO')}</p>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="min-w-full text-sm">
          <thead class="bg-amber-50">
            <tr>
              <th class="p-3 text-left text-xs uppercase tracking-widest text-amber-800 font-semibold">Cliente</th>
              <th class="p-3 text-left text-xs uppercase tracking-widest text-amber-800 font-semibold">Fecha</th>
              <th class="p-3 text-left text-xs uppercase tracking-widest text-amber-800 font-semibold">Productos</th>
              <th class="p-3 text-left text-xs uppercase tracking-widest text-amber-800 font-semibold">Total / Abonado</th>
              <th class="p-3 text-left text-xs uppercase tracking-widest text-amber-800 font-semibold">Pendiente</th>
              <th class="p-3 text-left text-xs uppercase tracking-widest text-amber-800 font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </article>`;

  // Botón abonar
  container.querySelectorAll('.btn-abonar').forEach(btn => {
    btn.addEventListener('click', () => registrarAbono(
      Number(btn.dataset.saleId),
      Number(btn.dataset.pendiente),
      btn.dataset.name,
      container
    ));
  });

  // Botón marcar como pagado completo
  container.querySelectorAll('.btn-pagar').forEach(btn => {
    btn.addEventListener('click', () => marcarPagado(
      Number(btn.dataset.saleId),
      Number(btn.dataset.pendiente),
      btn.dataset.name,
      container
    ));
  });
}

// ── REGISTRAR ABONO ───────────────────────────────────────────
async function registrarAbono(saleId, pendiente, customerName, container) {
  const { value, isConfirmed } = await Swal.fire({
    title: `Registrar abono`,
    html: `
      <p style="color:#6d165a;font-weight:600;margin-bottom:12px;">${customerName}</p>
      <p style="font-size:13px;color:#6b7280;margin-bottom:8px;">Pendiente: <strong style="color:#a0346e;">$${pendiente.toLocaleString('es-CO')}</strong></p>
      <input id="sw-abono" type="number" min="1" max="${pendiente}" class="swal2-input" placeholder="Monto del abono">
      <input id="sw-nota" class="swal2-input" placeholder="Nota (opcional)">`,
    showCancelButton: true,
    confirmButtonText: 'Registrar abono',
    confirmButtonColor: '#ec5c8d',
    preConfirm: () => {
      const amount = Number(document.getElementById('sw-abono').value);
      if (!amount || amount <= 0) { Swal.showValidationMessage('Ingresa un monto válido.'); return false; }
      if (amount > pendiente)     { Swal.showValidationMessage(`El abono no puede superar $${pendiente.toLocaleString('es-CO')}.`); return false; }
      return { saleId, amount, note: document.getElementById('sw-nota').value.trim() };
    }
  });

  if (!isConfirmed || !value) return;
  await submitPayment(value, container);
}

// ── MARCAR PAGADO TOTAL ───────────────────────────────────────
async function marcarPagado(saleId, pendiente, customerName, container) {
  const { isConfirmed } = await Swal.fire({
    title: '¿Marcar como pagado?',
    html: `<p style="color:#6d165a;">${customerName}</p><p style="font-size:13px;color:#6b7280;">Se registrará el pago completo de <strong>$${pendiente.toLocaleString('es-CO')}</strong></p>`,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Sí, marcar pagado',
    confirmButtonColor: '#10b981',
  });

  if (!isConfirmed) return;
  await submitPayment({ saleId, amount: pendiente, note: 'Pago completo' }, container);
}

// ── SUBMIT PAYMENT ────────────────────────────────────────────
async function submitPayment(payload, container) {
  try {
    const res  = await fetch('/api/discordia/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    if (!json.ok) throw new Error(json.message);

    const msg = json.data.newStatus === 'paid'
      ? '¡Deuda saldada completamente! 🎉'
      : `Abono registrado. Restan $${json.data.remaining.toLocaleString('es-CO')}`;

    await Swal.fire('Listo', msg, 'success');
    await renderDeudas(container);
  } catch (err) {
    Swal.fire('Error', err.message || 'No se pudo registrar el pago.', 'error');
  }
}