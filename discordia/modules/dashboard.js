// discordia/modules/dashboard.js
// ─────────────────────────────────────────────────────────────
// Módulo visual del Dashboard. Consulta /api/discordia/dashboard y
// renderiza KPIs, deudas activas, top productos, ventas
// recientes y alertas de stock bajo.
// ─────────────────────────────────────────────────────────────

export async function renderDashboard(container) {
  container.innerHTML = buildSkeleton();

  let data;
  try {
    const res  = await fetch('/api/discordia/dashboard');
    const json = await res.json();
    if (!json.ok) throw new Error('API error');
    data = json.data;
  } catch {
    container.innerHTML = `
      <div class="bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl p-6 text-center">
        <p class="font-bold text-lg">No se pudieron cargar las métricas</p>
        <p class="text-sm mt-1">Verifica tu conexión e intenta de nuevo.</p>
        <button onclick="location.reload()"
          class="mt-4 px-5 py-2 bg-gradient-to-r from-[#ec5c8d] to-[#ff8c91] text-white rounded-xl text-sm font-semibold">
          Reintentar
        </button>
      </div>`;
    return;
  }

  container.innerHTML = `
    <div class="space-y-6">
      ${buildKPICards(data.ingresosMes, data.deudasActivas, data.stockBajo)}
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        ${buildDeudas(data.deudasActivas)}
        ${buildTopProductos(data.topProductos)}
      </div>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        ${buildVentasRecientes(data.ventasRecientes)}
        ${buildStockBajo(data.stockBajo)}
      </div>
    </div>`;
}

function buildSkeleton() {
  const p = `<div class="animate-pulse bg-gray-100 rounded-2xl h-28"></div>`;
  return `<div class="space-y-6">
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">${[1,2,3,4].map(()=>p).join('')}</div>
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="animate-pulse bg-gray-100 rounded-2xl h-64"></div>
      <div class="animate-pulse bg-gray-100 rounded-2xl h-64"></div>
    </div>
  </div>`;
}

function buildKPICards(ingresos, deudas, stockBajo) {
  const totalDeuda = deudas.reduce((s,d) => s + Number(d.total_debt), 0);
  const varHTML = ingresos.variacion !== null
    ? `<span class="text-xs font-semibold px-2 py-0.5 rounded-full mt-2 bg-white/20 text-white inline-block">
        ${ingresos.variacion >= 0 ? '▲' : '▼'} ${Math.abs(ingresos.variacion)}% vs mes anterior
       </span>`
    : `<span class="text-xs text-white/60 mt-2 block">Sin datos anteriores</span>`;

  const cards = [
    { label:'Ingresos del mes', value:`$${Number(ingresos.total).toLocaleString('es-CO')}`, sub:varHTML, icon:'💰', bg:'bg-gradient-to-br from-[#6d165a] to-[#a0346e]', vc:'text-white', lc:'text-white/60', bc:'border-[#a0346e]/30' },
    { label:'Ventas este mes', value:ingresos.cantidad, sub:`<span class="text-xs text-gray-500 mt-2 block">${ingresos.cantidad===1?'transacción':'transacciones'}</span>`, icon:'🛍️', bg:'bg-white', vc:'text-[#6d165a]', lc:'text-gray-400', bc:'border-gray-100' },
    { label:'Deuda pendiente', value:`$${totalDeuda.toLocaleString('es-CO')}`, sub:`<span class="text-xs font-semibold text-amber-600 mt-2 block">${deudas.length} cliente${deudas.length!==1?'s':''} ${deudas.length!==1?'deben':'debe'}</span>`, icon:'⚠️', bg:'bg-amber-50', vc:'text-amber-800', lc:'text-amber-400', bc:'border-amber-100' },
    { label:'Stock bajo', value:stockBajo.length, sub:`<span class="text-xs font-semibold ${stockBajo.length>0?'text-rose-600':'text-emerald-600'} mt-2 block">${stockBajo.length===0?'Todo en buen nivel ✅':`${stockBajo.length} producto${stockBajo.length!==1?'s':''} ≤ 3 uds`}</span>`, icon:'📦', bg:stockBajo.length>0?'bg-rose-50':'bg-white', vc:stockBajo.length>0?'text-rose-700':'text-[#6d165a]', lc:stockBajo.length>0?'text-rose-300':'text-gray-400', bc:stockBajo.length>0?'border-rose-100':'border-gray-100' },
  ];

  return `<div class="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
    ${cards.map(c=>`
      <article class="${c.bg} border ${c.bc} rounded-2xl p-4 md:p-5 shadow-sm hover:shadow-md transition">
        <div class="flex items-start justify-between">
          <span class="text-xl">${c.icon}</span>
          <span class="text-[10px] uppercase tracking-[0.12em] ${c.lc} font-semibold text-right leading-tight max-w-[90px]">${c.label}</span>
        </div>
        <p class="text-2xl md:text-3xl font-bold mt-3 ${c.vc}">${c.value}</p>
        ${c.sub}
      </article>`).join('')}
  </div>`;
}

function buildDeudas(deudas) {
  if (!deudas.length) return `
    <article class="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 flex items-center gap-4 shadow-sm">
      <span class="text-4xl">✅</span>
      <div>
        <p class="font-bold text-emerald-800 text-lg" style="font-family:'Playfair Display',serif">Sin deudas pendientes</p>
        <p class="text-sm text-emerald-600 mt-1">Todas las clientas están al día.</p>
      </div>
    </article>`;

  const total = deudas.reduce((s,d) => s+Number(d.total_debt), 0);
  return `
    <article class="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
      <div class="bg-gradient-to-r from-[#6d165a] to-[#a0346e] px-5 py-4 flex items-center justify-between">
        <h3 class="font-bold text-white text-lg" style="font-family:'Playfair Display',serif">⚠️ Deudas activas</h3>
        <span class="text-xs bg-white/20 text-white px-3 py-1 rounded-full font-semibold">Total $${total.toLocaleString('es-CO')}</span>
      </div>
      <div class="overflow-x-auto">
        <table class="min-w-full text-sm">
          <thead class="bg-[#fdf2f7]">
            <tr>
              <th class="p-3 text-left text-xs uppercase tracking-widest text-[#6d165a] font-semibold">Cliente</th>
              <th class="p-3 text-center text-xs uppercase tracking-widest text-[#6d165a] font-semibold">Ventas</th>
              <th class="p-3 text-right text-xs uppercase tracking-widest text-[#6d165a] font-semibold">Debe</th>
            </tr>
          </thead>
          <tbody>
            ${deudas.map(d=>`
              <tr class="border-b border-gray-100 hover:bg-[#fdf7fa] transition">
                <td class="p-3">
                  <p class="font-semibold text-gray-900 text-sm">${d.name}</p>
                  <p class="text-xs text-gray-400">${d.phone||'Sin teléfono'}</p>
                </td>
                <td class="p-3 text-center">
                  <span class="text-xs bg-amber-100 text-amber-700 font-semibold px-2 py-0.5 rounded-full">${d.ventas_pendientes} venta${Number(d.ventas_pendientes)!==1?'s':''}</span>
                </td>
                <td class="p-3 text-right font-bold text-[#a0346e] text-sm whitespace-nowrap">$${Number(d.total_debt).toLocaleString('es-CO')}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
      <div class="px-5 py-3 bg-amber-50 border-t border-amber-100">
        <p class="text-xs text-amber-700">💡 Ve al módulo <strong>Deudas</strong> para registrar abonos o marcar como pagado.</p>
      </div>
    </article>`;
}

function buildTopProductos(productos) {
  if (!productos.length) return `<article class="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex items-center justify-center text-gray-400 text-sm">Sin datos de ventas aún.</article>`;
  const maxUds = Math.max(...productos.map(p=>Number(p.unidades)));
  const medals = ['🥇','🥈','🥉','4️⃣','5️⃣'];
  return `
    <article class="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
      <div class="bg-gradient-to-r from-[#ec5c8d] to-[#ff8c91] px-5 py-4">
        <h3 class="font-bold text-white text-lg" style="font-family:'Playfair Display',serif">🏆 Top productos</h3>
        <p class="text-xs text-white/70 mt-0.5">Más vendidos de todos los tiempos</p>
      </div>
      <ul class="px-5">
        ${productos.map((p,i)=>`
          <li class="py-3 ${i<productos.length-1?'border-b border-gray-100':''}">
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center gap-2 min-w-0">
                <span class="flex-none">${medals[i]||'·'}</span>
                <p class="text-sm font-semibold text-gray-900 truncate">${p.product_name}</p>
              </div>
              <div class="flex items-center gap-3 flex-none ml-2">
                <span class="text-xs text-gray-400">${p.unidades} uds</span>
                <span class="text-sm font-bold text-[#a0346e]">$${Number(p.ingresos).toLocaleString('es-CO')}</span>
              </div>
            </div>
            <div class="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
              <div class="bg-gradient-to-r from-[#ec5c8d] to-[#ff8c91] h-1.5 rounded-full" style="width:${Math.round(Number(p.unidades)/maxUds*100)}%"></div>
            </div>
          </li>`).join('')}
      </ul>
    </article>`;
}

function buildVentasRecientes(ventas) {
  if (!ventas.length) return `<article class="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex items-center justify-center text-gray-400 text-sm">Sin ventas registradas aún.</article>`;
  const ci = {Nequi:'💜',Daviplata:'🟡',Davivienda:'🔴',Efectivo:'💵',regalo:'🎁',WhatsApp:'💬',Instagram:'📸'};
  return `
    <article class="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
      <div class="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <h3 class="font-bold text-[#6d165a] text-lg" style="font-family:'Playfair Display',serif">🕐 Ventas recientes</h3>
        <span class="text-xs text-gray-400">Últimas 5</span>
      </div>
      <div class="overflow-x-auto">
        <table class="min-w-full text-sm">
          <thead class="bg-[#fdf2f7]">
            <tr>
              <th class="p-3 text-left text-xs uppercase tracking-widest text-[#6d165a] font-semibold">Cliente</th>
              <th class="p-3 text-center text-xs uppercase tracking-widest text-[#6d165a] font-semibold">Canal</th>
              <th class="p-3 text-center text-xs uppercase tracking-widest text-[#6d165a] font-semibold">Estado</th>
              <th class="p-3 text-right text-xs uppercase tracking-widest text-[#6d165a] font-semibold">Total</th>
            </tr>
          </thead>
          <tbody>
            ${ventas.map(v=>{
              const fecha = new Date(v.created_at).toLocaleDateString('es-CO',{day:'numeric',month:'short'});
              const badge = v.payment_status==='paid'
                ? `<span class="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">Pagado</span>`
                : `<span class="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">Pendiente</span>`;
              return `
                <tr class="border-b border-gray-100 hover:bg-[#fdf7fa] transition">
                  <td class="p-3"><p class="font-semibold text-gray-900 text-sm">${v.cliente||'Sin nombre'}</p><p class="text-xs text-gray-400">${fecha}</p></td>
                  <td class="p-3 text-center"><span title="${v.channel}">${ci[v.channel]||'🛍️'}</span></td>
                  <td class="p-3 text-center">${badge}</td>
                  <td class="p-3 text-right font-bold text-[#a0346e] text-sm whitespace-nowrap">$${Number(v.total).toLocaleString('es-CO')}</td>
                </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    </article>`;
}

function buildStockBajo(productos) {
  if (!productos.length) return `
    <article class="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 flex items-center gap-4 shadow-sm">
      <span class="text-4xl">📦</span>
      <div>
        <p class="font-bold text-emerald-800" style="font-family:'Playfair Display',serif">Stock saludable</p>
        <p class="text-sm text-emerald-600 mt-1">Todos los productos tienen suficiente inventario.</p>
      </div>
    </article>`;
  return `
    <article class="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
      <div class="bg-gradient-to-r from-rose-500 to-rose-400 px-5 py-4 flex items-center justify-between">
        <h3 class="font-bold text-white text-lg" style="font-family:'Playfair Display',serif">📦 Stock bajo</h3>
        <span class="text-xs bg-white/20 text-white px-3 py-1 rounded-full font-semibold">${productos.length} producto${productos.length!==1?'s':''}</span>
      </div>
      <div class="overflow-x-auto">
        <table class="min-w-full text-sm">
          <thead class="bg-rose-50">
            <tr>
              <th class="p-3 text-left text-xs uppercase tracking-widest text-rose-700 font-semibold">Producto</th>
              <th class="p-3 text-right text-xs uppercase tracking-widest text-rose-700 font-semibold">Stock</th>
            </tr>
          </thead>
          <tbody>
            ${productos.slice(0,8).map(p=>`
              <tr class="border-b border-gray-100 hover:bg-[#fdf7fa] transition">
                <td class="p-3"><p class="font-semibold text-gray-900 text-sm truncate max-w-[180px]">${p.name}</p><p class="text-xs text-gray-400">${p.category||'Sin categoría'}</p></td>
                <td class="p-3 text-right"><span class="text-xs font-bold px-2.5 py-1 rounded-full ${p.stock<=1?'bg-rose-100 text-rose-700':'bg-amber-100 text-amber-700'}">${p.stock} ud${p.stock!==1?'s':''}</span></td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
      ${productos.length>8?`<p class="text-xs text-gray-400 text-center py-2">+${productos.length-8} más en Catálogo</p>`:''}
      <div class="px-5 py-3 bg-rose-50 border-t border-rose-100">
        <p class="text-xs text-rose-700">💡 Ve al módulo <strong>Catálogo</strong> para actualizar el inventario.</p>
      </div>
    </article>`;
}