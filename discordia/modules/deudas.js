// discordia/deudas.js
// ─────────────────────────────────────────────────────────────
// Módulo de Deudas del panel admin.
// - Lista todas las ventas con payment_status = 'pending'
// - Permite registrar abonos via /api/payments
// - Permite marcar una venta como pagada completamente
// ─────────────────────────────────────────────────────────────

import { formatCurrency } from '/discordia/utils.js';
import { esc } from '/discordia/modules/ui.js?v=3';

export async function renderDeudas(container) {
  container.innerHTML = `<div class="skeleton" style="height:300px"></div>`;

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
        <button onclick="location.reload()" class="mt-3 px-4 py-2 bg-gradient-to-r from-[#9d5fa5] to-[#d94a7b] text-white rounded-xl text-sm font-semibold">Reintentar</button>
      </div>`;
    return;
  }

  paintDeudas(container, ventas);
}

function paintDeudas(container, ventas) {
  const totalDeuda = ventas.reduce((s,v) => s + (Number(v.total) - Number(v.amount_paid)), 0);
  const totalAbonado = ventas.reduce((s,v) => s + Number(v.amount_paid || 0), 0);
  const vieja = ventas.reduce((a, v) => (!a || new Date(v.created_at) < new Date(a.created_at) ? v : a), null);
  const diasDesde = f => Math.max(0, Math.floor((Date.now() - new Date(f)) / 86400000));

  if (!ventas.length) {
    container.innerHTML = `
      <article class="card">
        <div class="empty" style="padding:48px 10px">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/></svg>
          <b>Sin deudas pendientes</b>Todas las clientas están al día.
        </div>
      </article>`;
    return;
  }

  const rows = ventas.map(v => {
    const fecha     = new Date(v.created_at).toLocaleDateString('es-CO', { day:'numeric', month:'short', year:'2-digit' });
    const pendiente = Number(v.total) - Number(v.amount_paid);
    const pct       = Math.round((Number(v.amount_paid) / Number(v.total)) * 100) || 0;
    const items     = (v.items||[]);
    const dias      = diasDesde(v.created_at);

    return `
      <tr>
        <td><div class="prod" style="min-width:170px"><div><b>${esc(v.customer_name||'Sin nombre')}</b><span>${esc(v.customer_phone||'Sin teléfono')}</span></div></div></td>
        <td class="code">${fecha}<br><span class="${dias > 30 ? 'pill crit' : dias > 15 ? 'pill warn' : 'pill mute'}" style="margin-top:4px">${dias === 0 ? 'hoy' : `hace ${dias} día${dias!==1?'s':''}`}</span></td>
        <td style="max-width:220px;font-size:12.5px;color:var(--dim)">${items.slice(0,3).map(i=>`<div style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(i.name||i.productName||'Producto')} ×${i.quantity}</div>`).join('') || '—'}
          ${items.length > 3 ? `<div style="color:var(--faint)">+${items.length-3} más</div>` : ''}</td>
        <td style="min-width:150px">
          <div class="money">${formatCurrency(Number(v.total))}</div>
          <div class="hbar" title="${pct}% abonado"><i style="width:${pct}%;background:var(--good)"></i></div>
          <div style="font-size:11.5px;color:var(--faint);margin-top:4px">Abonado ${formatCurrency(Number(v.amount_paid))} · ${pct}%</div>
        </td>
        <td class="r"><b class="money" style="color:var(--warn);font-size:15px">${formatCurrency(pendiente)}</b></td>
        <td>
          <div class="actions">
            <button type="button" data-sale-id="${v.id}" data-pendiente="${pendiente}" data-name="${esc(v.customer_name||'Cliente')}" class="btn sm btn-abonar">Abonar</button>
            <button type="button" data-sale-id="${v.id}" data-pendiente="${pendiente}" data-name="${esc(v.customer_name||'Cliente')}" class="btn sm ok btn-pagar">Pagado</button>
          </div>
        </td>
      </tr>`;
  }).join('');

  container.innerHTML = `
    <section class="dgrid">
      <article class="card hero kpi span-4"><div class="kpi-label">Total por cobrar</div><div class="kpi-value num">${formatCurrency(totalDeuda)}</div><div class="kpi-foot">${ventas.length} venta${ventas.length!==1?'s':''} pendiente${ventas.length!==1?'s':''}</div></article>
      <article class="card kpi span-4"><div class="kpi-label">Ya abonado</div><div class="kpi-value num">${formatCurrency(totalAbonado)}</div><div class="kpi-foot">en estas ventas</div></article>
      <article class="card kpi span-4"><div class="kpi-label">Deuda más antigua</div><div class="kpi-value num">${vieja ? diasDesde(vieja.created_at) + ' días' : '—'}</div><div class="kpi-foot">${vieja ? esc(vieja.customer_name || 'Sin nombre') : ''}</div></article>
    </section>
    <article class="card flush">
      <div class="card-head"><div><h3>Ventas por cobrar</h3><p>Registra abonos o marca como pagado</p></div></div>
      <div class="table-wrap" style="margin-top:6px">
        <table class="tbl">
          <thead><tr><th>Cliente</th><th>Fecha</th><th>Productos</th><th>Total / abonado</th><th class="r">Pendiente</th><th class="r">Acciones</th></tr></thead>
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
      <p style="color:var(--ink);font-weight:600;margin-bottom:12px;">${esc(customerName)}</p>
      <p style="font-size:13px;color:var(--dim);margin-bottom:8px;">Pendiente: <strong style="color:var(--accent);">${formatCurrency(pendiente)}</strong></p>
      <input id="sw-abono" type="number" min="1" max="${pendiente}" class="swal2-input" placeholder="Monto del abono">
      <input id="sw-nota" class="swal2-input" placeholder="Nota (opcional)">`,
    showCancelButton: true,
    confirmButtonText: 'Registrar abono',
    
    preConfirm: () => {
      const amount = Number(document.getElementById('sw-abono').value);
      if (!amount || amount <= 0) { Swal.showValidationMessage('Ingresa un monto válido.'); return false; }
      if (amount > pendiente)     { Swal.showValidationMessage(`El abono no puede superar ${formatCurrency(pendiente)}.`); return false; }
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
      html: `<p style="color:var(--ink);">${esc(customerName)}</p><p style="font-size:13px;color:var(--dim);">Se registrará el pago completo de <strong>${formatCurrency(pendiente)}</strong></p>`,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Sí, marcar pagado',
    
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
      : `Abono registrado. Restan ${formatCurrency(json.data.remaining)}`;

    await Swal.fire('Listo', msg, 'success');
    await renderDeudas(container);
  } catch (err) {
    Swal.fire('Error', err.message || 'No se pudo registrar el pago.', 'error');
  }
}
