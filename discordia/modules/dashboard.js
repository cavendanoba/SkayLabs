// discordia/modules/dashboard.js
// ─────────────────────────────────────────────────────────────
// Vista "Resumen" del panel: saludo con el estado del día, KPIs,
// ventas por día, rotación, más vendidos, inventario por categoría,
// stock bajo, últimas ventas y salud del catálogo.
// Usa /api/discordia/dashboard y los datos ya cargados por admin.js.
// ─────────────────────────────────────────────────────────────

import { formatCurrency } from '/discordia/utils.js';
import { esc, foto, NOMBRES_CATEGORIA, COLOR_CATEGORIA, nombreCategoria, esProductoReal, sinFoto, svg } from '/discordia/modules/ui.js?v=4';

const I = {
  money: svg('<path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>'),
  bag:   svg('<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18M16 10a4 4 0 0 1-8 0"/>'),
  card:  svg('<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>'),
  box:   svg('<path d="M21 8 12 3 3 8v8l9 5 9-5Z"/><path d="m3 8 9 5 9-5M12 13v8"/>'),
  arrow: svg('<path d="M7 17 17 7M8 7h9v9"/>'),
  plus:  svg('<path d="M12 5v14M5 12h14"/>'),
  ext:   svg('<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>'),
  check: svg('<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>'),
  img:   svg('<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/>'),
  tag:   svg('<path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8Z"/>'),
  alert: svg('<path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/>'),
  eye:   svg('<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>'),
};

let rango = 14;

export async function renderDashboard(container, ctx = {}) {
  const state = ctx.state || { catalog: [], sales: [], customers: [] };
  const goTo = ctx.goTo || (() => {});

  let api = null;
  try {
    const res = await fetch('/api/discordia/dashboard', { cache: 'no-store' });
    const json = await res.json();
    if (json.ok) api = json.data;
  } catch { /* el resumen funciona con los datos locales */ }

  const d = calcular(state, api);
  container.innerHTML = `
    ${saludo(d, ctx.user)}
    <section class="dgrid kpis">
      ${kpiHero(d)}
      ${kpi({ icon: I.bag,   label: 'Ventas del mes',      value: d.mes.n, foot: d.mes.n ? `Ticket promedio <b class="num">${formatCurrency(d.mes.total / d.mes.n)}</b>` : 'Aún no hay ventas este mes' })}
      ${kpi({ icon: I.card,  label: 'Por cobrar',          value: formatCurrency(d.deuda.total), foot: d.deuda.n ? `${d.deuda.n} venta${d.deuda.n !== 1 ? 's' : ''} pendiente${d.deuda.n !== 1 ? 's' : ''}` : '<span class="pill good">Todo cobrado</span>', go: 'debts' })}
      ${kpi({ icon: I.box,   label: 'Inventario a precio de venta', value: formatCurrency(d.inv.valor), foot: `<span class="num">${d.inv.unidades}</span> unidades · <span class="num">${d.inv.activos}</span> productos`, go: 'catalog' })}
    </section>

    <section class="dgrid">
      ${tarjetaVentas(d)}
      ${tarjetaRotacion(d)}
    </section>

    <section class="dgrid">
      ${tarjetaTop(d)}
      ${tarjetaCategorias(d)}
      ${tarjetaStockBajo(d)}
    </section>

    <section class="dgrid">
      ${tarjetaUltimas(d)}
      ${tarjetaSalud(d)}
    </section>`;

  conectar(container, d, goTo, state, ctx);
}

// ── DATOS ─────────────────────────────────────────────────────
function diaClave(fecha) {
  const f = new Date(fecha);
  return `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, '0')}-${String(f.getDate()).padStart(2, '0')}`;
}

function calcular(state, api) {
  const productos = state.catalog.filter(esProductoReal);
  const activos = productos.filter(p => p.active !== false);
  const ventas = [...state.sales].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  const ahora = new Date();
  const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
  const inicioMesAnt = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1);
  const mismoDiaMesAnt = new Date(ahora.getFullYear(), ahora.getMonth() - 1, ahora.getDate(), 23, 59, 59);

  const delMes = ventas.filter(v => new Date(v.created_at) >= inicioMes);
  const mesAnt = ventas.filter(v => { const f = new Date(v.created_at); return f >= inicioMesAnt && f <= mismoDiaMesAnt; });
  const suma = arr => arr.reduce((s, v) => s + Number(v.total || 0), 0);
  const cobrado = arr => arr.reduce((s, v) => s + (v.payment_status === 'paid' ? Number(v.total || 0) : Number(v.amount_paid || 0)), 0);

  // Ventas por día (últimos 30 días, hora local)
  const porDia = new Map();
  ventas.forEach(v => {
    const k = diaClave(v.created_at);
    const x = porDia.get(k) || { total: 0, n: 0 };
    x.total += Number(v.total || 0); x.n += 1;
    porDia.set(k, x);
  });
  const dias = [];
  for (let i = 29; i >= 0; i--) {
    const f = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate() - i);
    const x = porDia.get(diaClave(f)) || { total: 0, n: 0 };
    dias.push({ fecha: f, ...x });
  }

  const hoy = dias[dias.length - 1];
  const pendientes = ventas.filter(v => v.payment_status === 'pending');

  // Inventario por categoría (unidades en productos activos)
  const cats = new Map();
  activos.forEach(p => {
    const k = NOMBRES_CATEGORIA[p.category] ? p.category : 'OTRAS';
    const x = cats.get(k) || { unidades: 0, valor: 0, productos: 0 };
    x.unidades += Number(p.stock) || 0; x.valor += (Number(p.stock) || 0) * (Number(p.price) || 0); x.productos += 1;
    cats.set(k, x);
  });
  const orden = ['LABI', 'OJOS', 'PIEL', 'CEJAS', 'SKIN', 'ACCE', 'OTRAS'];
  const categorias = orden.filter(k => cats.has(k)).map(k => ({ key: k, nombre: k === 'OTRAS' ? 'Otras' : nombreCategoria(k), color: COLOR_CATEGORIA[k] || 'var(--c-other)', ...cats.get(k) }));

  const total = suma(delMes);
  const totalAnt = suma(mesAnt);

  // Más vendidos: del servidor (histórico); si no hay, a partir de las ventas cargadas.
  let top = (api?.topProductos || []).map(t => ({ nombre: t.product_name, unidades: Number(t.unidades), ingresos: Number(t.ingresos) }));
  if (!top.length) {
    const m = new Map();
    ventas.forEach(v => (v.items || []).forEach(i => {
      const n = i.name || i.product_name || 'Producto';
      const x = m.get(n) || { nombre: n, unidades: 0, ingresos: 0 };
      x.unidades += Number(i.quantity || 0); x.ingresos += Number(i.quantity || 0) * Number(i.price || 0);
      m.set(n, x);
    }));
    top = [...m.values()].sort((a, b) => b.ingresos - a.ingresos).slice(0, 5);
  }
  const porNombre = new Map(productos.map(p => [String(p.name).toLowerCase(), p]));
  top.forEach(t => { t.producto = porNombre.get(String(t.nombre).toLowerCase()); });

  const rot = api?.rotacionInventario;
  const vendidas = rot ? Number(rot.stockVendido) : ventas.reduce((s, v) => s + (v.items || []).reduce((a, i) => a + Number(i.quantity || 0), 0), 0);
  const enStock = activos.reduce((s, p) => s + (Number(p.stock) || 0), 0);

  return {
    hoy,
    dias,
    mes: { total, n: delMes.length, cobrado: cobrado(delMes), variacion: totalAnt > 0 ? Math.round((total - totalAnt) / totalAnt * 100) : null },
    deuda: { total: pendientes.reduce((s, v) => s + Number(v.total || 0) - Number(v.amount_paid || 0), 0), n: pendientes.length },
    inv: {
      valor: activos.reduce((s, p) => s + (Number(p.stock) || 0) * (Number(p.price) || 0), 0),
      unidades: enStock, activos: activos.length
    },
    rot: { vendidas, enStock, pct: vendidas + enStock > 0 ? Math.round(vendidas / (vendidas + enStock) * 100) : 0 },
    categorias,
    top,
    stockBajo: activos.filter(p => Number(p.stock) <= 1).sort((a, b) => Number(a.stock) - Number(b.stock) || a.name.localeCompare(b.name)),
    ultimas: ventas.slice(0, 6),
    salud: {
      sinFoto: activos.filter(sinFoto).length,
      sinPrecio: productos.filter(p => !Number(p.price)).length,
      agotados: activos.filter(p => Number(p.stock) <= 0).length,
      inactivos: productos.length - activos.length,
      total: productos.length
    }
  };
}

// ── PIEZAS ────────────────────────────────────────────────────
function saludo(d, user) {
  const h = new Date().getHours();
  const hola = h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches';
  const partes = [
    `<b>${formatCurrency(d.hoy.total)}</b> vendidos hoy en ${d.hoy.n} venta${d.hoy.n !== 1 ? 's' : ''}`,
    d.deuda.total > 0 ? `<b>${formatCurrency(d.deuda.total)}</b> por cobrar` : 'nada pendiente por cobrar',
    `${d.stockBajo.length} producto${d.stockBajo.length !== 1 ? 's' : ''} en su última unidad o agotado${d.stockBajo.length !== 1 ? 's' : ''}`
  ];
  return `
    <section class="hello">
      <div>
        <small>${hola}${user ? ', ' + esc(user) : ''}</small>
        <h2>Discordia hoy</h2>
        <p>${partes.join(' · ')}.</p>
      </div>
      <div class="right">
        <a class="btn" href="./index.html" target="_blank" rel="noopener">${I.eye}Ver catálogo</a>
        <button class="btn primary" type="button" data-accion="nueva-venta" style="background:var(--grad);color:#fff">${I.plus}Nueva venta</button>
      </div>
    </section>`;
}

function sparkline(valores, alto = 38) {
  const w = 200, h = alto, max = Math.max(...valores, 1);
  const pts = valores.map((v, i) => [i / (valores.length - 1) * w, h - 3 - v / max * (h - 8)]);
  const linea = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join('');
  return `<svg class="spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true">
    <path class="area" d="${linea}L${w},${h}L0,${h}Z" style="fill:color-mix(in oklab, var(--accent) 16%, transparent);stroke:none"/>
    <path d="${linea}" fill="none" stroke="var(--accent)" stroke-width="2" vector-effect="non-scaling-stroke" stroke-linejoin="round"/>
  </svg>`;
}

function delta(v) {
  if (v === null || v === undefined) return '';
  return `<span class="delta ${v >= 0 ? 'up' : 'down'}">${v >= 0 ? '↑' : '↓'} ${Math.abs(v)}%</span>`;
}

function kpiHero(d) {
  const pct = d.mes.total ? Math.round(d.mes.cobrado / d.mes.total * 100) : 0;
  return `
    <article class="card hero kpi span-3 wide">
      <div class="kpi-label"><span class="ico">${I.money}</span>Vendido · ${new Date().toLocaleDateString('es-CO', { month: 'long' })}</div>
      <div class="kpi-value num">${formatCurrency(d.mes.total)}</div>
      <div class="kpi-foot">${delta(d.mes.variacion)} ${d.mes.variacion === null ? 'Sin datos del mes anterior' : 'vs. mismo corte del mes pasado'}</div>
      <div class="kpi-foot" title="${pct}% de lo vendido este mes ya está cobrado">Cobrado <b class="num">${formatCurrency(d.mes.cobrado)}</b> · ${pct}%</div>
      <div class="meter"><i style="width:${pct}%"></i></div>
    </article>`;
}

function kpi({ icon, label, value, foot, go }) {
  return `
    <article class="card kpi span-3">
      <div class="kpi-label"><span class="ico">${icon}</span>${label}
        ${go ? `<button class="circle-btn" type="button" data-go="${go}" style="margin-left:auto" aria-label="Abrir ${label}">${I.arrow}</button>` : ''}</div>
      <div class="kpi-value num">${value}</div>
      <div class="kpi-foot">${foot}</div>
    </article>`;
}

function tarjetaVentas(d) {
  const dias = d.dias.slice(-rango);
  const max = Math.max(...dias.map(x => x.total), 0);
  const tope = max > 0 ? niceMax(max) : 100000;
  const total = dias.reduce((s, x) => s + x.total, 0);
  const n = dias.reduce((s, x) => s + x.n, 0);
  const mejor = dias.reduce((a, b) => (b.total > a.total ? b : a), dias[0]);
  const fmtCorto = v => v >= 1e6 ? `$${(v / 1e6).toFixed(v % 1e6 ? 1 : 0)}M` : v >= 1e3 ? `$${Math.round(v / 1e3)}k` : `$${v}`;
  const etiqueta = f => f.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }).replace('.', '');
  const marcas = [0, Math.floor(dias.length / 3), Math.floor(dias.length * 2 / 3), dias.length - 1];

  return `
    <article class="card span-8" id="card-ventas">
      <div class="card-head">
        <div><h3>Ventas por día</h3><p>Últimos ${rango} días · todo lo vendido, pagado o pendiente</p></div>
        <div class="right">
          <div class="seg" role="group" aria-label="Rango">
            ${[7, 14, 30].map(r => `<button type="button" data-rango="${r}" class="${r === rango ? 'is-on' : ''}" aria-pressed="${r === rango}">${r} días</button>`).join('')}
          </div>
        </div>
      </div>
      <div style="display:flex;gap:28px;flex-wrap:wrap;margin-bottom:14px">
        <div><div class="kpi-label">Total</div><div class="kpi-value num" style="font-size:24px">${formatCurrency(total)}</div></div>
        <div><div class="kpi-label">Ventas</div><div class="kpi-value num" style="font-size:24px">${n}</div></div>
        <div><div class="kpi-label">Mejor día</div><div class="kpi-value num" style="font-size:24px">${mejor.total ? formatCurrency(mejor.total) : '—'}</div>
          <div class="kpi-foot">${mejor.total ? etiqueta(mejor.fecha) : 'sin ventas'}</div></div>
      </div>
      <div class="chart" role="img" aria-label="Ventas por día de los últimos ${rango} días: total ${formatCurrency(total)} en ${n} ventas">
        <div class="y" aria-hidden="true">${[1, .75, .5, .25, 0].map(f => `<span>${fmtCorto(Math.round(tope * f))}</span>`).join('')}</div>
        <div class="plot">
          <div class="bars">
            ${dias.map((x, i) => `<button type="button" class="${x.total ? '' : 'zero'}${i === dias.length - 1 ? ' today' : ''}"
                data-tip="${esc(x.fecha.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' }))}|${formatCurrency(x.total)}|${x.n} venta${x.n !== 1 ? 's' : ''}"
                aria-label="${esc(etiqueta(x.fecha))}: ${formatCurrency(x.total)}, ${x.n} ventas"><i style="height:${x.total ? Math.max(2, x.total / tope * 100) : 0}%"></i></button>`).join('')}
            ${total ? '' : '<div class="empty-overlay"><div><b>Sin ventas en este rango</b>Cuando registres ventas, aparecen aquí día por día.</div></div>'}
          </div>
          <div class="x" aria-hidden="true">${marcas.map(i => `<span>${i === dias.length - 1 ? 'Hoy' : etiqueta(dias[i].fecha)}</span>`).join('')}</div>
          <div class="tip" role="tooltip"></div>
        </div>
      </div>
    </article>`;
}

function niceMax(v) {
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  for (const m of [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]) if (m * p >= v) return m * p;
  return 10 * p;
}

function anillo(pct, size, grosor, contenido, color = 'var(--accent)') {
  const r = (size - grosor) / 2, C = 2 * Math.PI * r;
  return `<div class="gring" style="width:${size}px;height:${size}px">
    <svg viewBox="0 0 ${size} ${size}"><circle class="track" cx="${size / 2}" cy="${size / 2}" r="${r}" stroke-width="${grosor}"/>
      <circle class="val" cx="${size / 2}" cy="${size / 2}" r="${r}" stroke-width="${grosor}" stroke="${color}" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - Math.min(100, pct) / 100)}"/></svg>
    <em>${contenido}</em></div>`;
}

function tarjetaRotacion(d) {
  return `
    <article class="card span-4">
      <div class="card-head"><div><h3>Rotación del inventario</h3><p>Unidades vendidas frente a lo que hay</p></div></div>
      <div class="gauge">
        ${anillo(d.rot.pct, 140, 14, `<span>${d.rot.pct}%<small>vendido</small></span>`)}
        <dl>
          <div><dt>Unidades vendidas</dt><dd class="num good">${d.rot.vendidas}</dd></div>
          <div><dt>En inventario</dt><dd class="num">${d.rot.enStock}</dd></div>
          <div><dt>Productos activos</dt><dd class="num">${d.inv.activos}</dd></div>
        </dl>
      </div>
      <p class="kpi-foot" style="margin:14px 0 0">Se cuenta desde que se reiniciaron las ventas; sube a medida que vendes.</p>
    </article>`;
}

function tarjetaTop(d) {
  const max = Math.max(...d.top.map(t => t.ingresos), 1);
  return `
    <article class="card span-4">
      <div class="card-head"><div><h3>Más vendidos</h3><p>Por ingresos, de todas las ventas</p></div>
        <div class="right"><button class="circle-btn" type="button" data-go="sales" aria-label="Ver ventas">${I.arrow}</button></div></div>
      ${d.top.length ? `<ul class="rows">${d.top.map((t, i) => `
        <li>
          <span class="rank">${i + 1}</span>
          <img class="thumb" src="${esc(foto(t.producto?.image))}" alt="" loading="lazy" onerror="this.src='./assets/default.png';this.onerror=null;">
          <div class="grow"><div class="t">${esc(t.nombre)}</div>
            <div class="s">${t.unidades} vendida${t.unidades !== 1 ? 's' : ''}</div>
            <div class="hbar"><i style="width:${t.ingresos / max * 100}%"></i></div></div>
          <div class="end">${formatCurrency(t.ingresos)}</div>
        </li>`).join('')}</ul>`
      : vacio('Todavía no hay ventas', 'El ranking aparece con la primera venta.', I.bag)}
    </article>`;
}

function tarjetaCategorias(d) {
  const total = d.categorias.reduce((s, c) => s + c.unidades, 0);
  const size = 170, grosor = 18, r = (size - grosor) / 2, C = 2 * Math.PI * r;
  const gap = d.categorias.filter(c => c.unidades).length > 1 ? 3 : 0;
  let acum = 0;
  const arcos = d.categorias.filter(c => c.unidades > 0).map(c => {
    const largo = c.unidades / total * C;
    const s = `<circle cx="${size / 2}" cy="${size / 2}" r="${r}" stroke="${c.color}" stroke-dasharray="${Math.max(0, largo - gap)} ${C}" stroke-dashoffset="${-acum}"><title>${esc(c.nombre)}: ${c.unidades} unidades</title></circle>`;
    acum += largo;
    return s;
  }).join('');
  return `
    <article class="card span-4">
      <div class="card-head"><div><h3>Inventario por categoría</h3><p>Unidades en productos activos</p></div></div>
      ${total ? `<div class="donut-wrap">
        <div class="donut" role="img" aria-label="Inventario por categoría, ${total} unidades">
          <svg viewBox="0 0 ${size} ${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${r}" stroke="var(--well)"/>${arcos}</svg>
          <div class="center"><b class="num">${total}</b><span>unidades</span></div>
        </div>
        <ul class="legend">${d.categorias.map(c => `
          <li><i style="background:${c.color}"></i><span>${esc(c.nombre)}</span><span class="v">${c.unidades}</span><span class="p">${Math.round(c.unidades / total * 100)}%</span></li>`).join('')}
        </ul></div>` : vacio('Sin inventario', 'No hay unidades en productos activos.', I.box)}
    </article>`;
}

function tarjetaStockBajo(d) {
  const lista = d.stockBajo.slice(0, 6);
  return `
    <article class="card span-4">
      <div class="card-head"><div><h3>Por reponer</h3><p>Agotados o con una sola unidad</p></div>
        ${d.stockBajo.length ? `<div class="right"><button class="link" type="button" data-go="catalog" data-filtro="low">Ver ${d.stockBajo.length}</button></div>` : ''}</div>
      ${lista.length ? `<ul class="rows">${lista.map(p => `
        <li>
          <img class="thumb" src="${esc(foto(p.image))}" alt="" loading="lazy" onerror="this.src='./assets/default.png';this.onerror=null;">
          <div class="grow"><div class="t">${esc(p.name)}</div><div class="s">${esc(p.code || '')} · ${esc(nombreCategoria(p.category))}</div></div>
          ${Number(p.stock) <= 0 ? '<span class="pill crit">Agotado</span>' : `<span class="pill warn">${p.stock} ud${Number(p.stock) !== 1 ? 's' : ''}</span>`}
        </li>`).join('')}</ul>` : vacio('Stock saludable', 'Todos los productos activos tienen 2 o más unidades.', I.check)}
    </article>`;
}

function tarjetaUltimas(d) {
  return `
    <article class="card flush span-8">
      <div class="card-head"><div><h3>Últimas ventas</h3><p>Las 6 más recientes</p></div>
        <div class="right"><button class="link" type="button" data-go="sales">Ver todas</button></div></div>
      ${d.ultimas.length ? `<div class="table-wrap" style="margin-top:6px"><table class="tbl stack">
        <thead><tr><th>Cliente</th><th>Fecha</th><th>Canal</th><th>Estado</th><th class="r">Total</th></tr></thead>
        <tbody>${d.ultimas.map(v => {
          const pend = Number(v.total || 0) - Number(v.amount_paid || 0);
          return `<tr>
            <td class="full"><b style="font-weight:500">${esc(v.customer_name || 'Sin nombre')}</b></td>
            <td class="code" data-label="Fecha">${new Date(v.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}</td>
            <td data-label="Canal">${esc(v.channel || '—')}</td>
            <td data-label="Estado">${v.payment_status === 'paid' ? '<span class="pill good">Pagado</span>' : `<span class="pill warn">Debe ${formatCurrency(pend)}</span>`}</td>
            <td class="r money" data-label="Total">${formatCurrency(Number(v.total || 0))}</td></tr>`;
        }).join('')}</tbody></table></div>`
      : `<div style="padding:0 18px 18px">${vacio('Sin ventas registradas', 'Usa “Nueva venta” o presiona N para registrar la primera.', I.bag)}</div>`}
    </article>`;
}

function tarjetaSalud(d) {
  const s = d.salud;
  const item = (n, label, icono, filtro, nivel) => `
    <button type="button" class="${n ? nivel : 'is-ok'}" data-go="catalog" data-filtro="${filtro}">
      <b class="num">${n}</b><span>${icono}${label}</span></button>`;
  const completos = s.total - s.sinFoto - s.inactivos;
  return `
    <article class="card span-4">
      <div class="card-head"><div><h3>Salud del catálogo</h3><p>Lo que falta para que el catálogo esté completo</p></div></div>
      <div class="health">
        ${item(s.sinFoto, 'sin foto', I.img, 'nophoto', 'is-warn')}
        ${item(s.sinPrecio, 'sin precio', I.tag, 'noprice', 'is-warn')}
        ${item(s.agotados, 'agotados', I.alert, 'out', 'is-crit')}
        ${item(s.inactivos, 'desactivados', I.eye, 'all&inactivos', 'is-warn')}
      </div>
      <p class="kpi-foot" style="margin:12px 0 0">${Math.max(0, completos)} de ${s.total} productos activos y con foto.</p>
    </article>`;
}

function vacio(titulo, texto, icono) {
  return `<div class="empty">${icono}<b>${titulo}</b>${texto}</div>`;
}

// ── INTERACCIÓN ───────────────────────────────────────────────
function conectar(container, d, goTo, state, ctx) {
  container.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => {
    const destino = b.dataset.go;
    const f = b.dataset.filtro;
    if (destino === 'catalog' && f) {
      if (f === 'all&inactivos') goTo('catalog', { filtro: 'all', showInactive: true, query: '', categoria: 'all' });
      else goTo('catalog', { filtro: f, showInactive: false, query: '', categoria: 'all' });
    } else goTo(destino);
  }));

  container.querySelector('[data-accion="nueva-venta"]')?.addEventListener('click', () => document.getElementById('nueva-venta')?.click());

  conectarRango(container, d);
  conectarBarras(container.querySelector('#card-ventas'));
}

function conectarRango(container, d) {
  container.querySelectorAll('#card-ventas [data-rango]').forEach(b => b.addEventListener('click', () => {
    rango = Number(b.dataset.rango);
    container.querySelector('#card-ventas').outerHTML = tarjetaVentas(d);
    const nueva = container.querySelector('#card-ventas');
    nueva.style.animation = 'none';
    conectarBarras(nueva);
    conectarRango(container, d);
  }));
}

function conectarBarras(card) {
  const plot = card.querySelector('.plot');
  const tip = card.querySelector('.tip');
  const mostrar = b => {
    const [dia, total, n] = b.dataset.tip.split('|');
    tip.innerHTML = `<span>${dia}</span><b>${total}</b><span>${n}</span>`;
    const r = b.getBoundingClientRect(), pr = plot.getBoundingClientRect();
    const barra = b.querySelector('i').getBoundingClientRect();
    const x = Math.min(Math.max(r.left + r.width / 2 - pr.left, 60), pr.width - 60);
    tip.style.left = `${x}px`;
    tip.style.top = `${Math.min(barra.top, r.bottom - 4) - pr.top}px`;
    tip.classList.add('show');
  };
  const ocultar = () => tip.classList.remove('show');
  card.querySelectorAll('.bars button').forEach(b => {
    b.addEventListener('mouseenter', () => mostrar(b));
    b.addEventListener('focus', () => mostrar(b));
    b.addEventListener('mouseleave', ocultar);
    b.addEventListener('blur', ocultar);
  });
}
