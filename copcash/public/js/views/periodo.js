// Periodo: lo que puedes gastar, tus movimientos del periodo y en qué se fue la plata.
import { api } from '../api.js';
import { h, pesos, diaMes, fechaCorta, abrirDialogo } from '../ui.js';
import { estado, periodoActual, diaCorte, proyeccion, presupuestoPorCategoria } from '../estado.js';
import { rangoPeriodo, sumarMeses, resumenTarjeta } from '../motor.js';
import { filaMovimiento, editarMovimiento, formMovimiento, medioDe } from './movimientos.js';
import { colorDeuda, formPago } from './deudas.js';

const FILTROS = { gasto: 'Gastos', pago_deuda: 'Pagos a deudas', ingreso: 'Ingresos', todo: 'Todo' };
const TIPOS_MEDIO = {
  disponible: { etq: 'Disponible en cuentas', nota: 'Salió de tus cuentas' },
  efectivo: { etq: 'Efectivo', nota: 'Pagado en efectivo' },
  tarjeta: { etq: 'Tarjeta de crédito', nota: 'Lo pagas en la próxima factura' },
  credito: { etq: 'Crédito', nota: 'Queda como deuda' },
  ninguno: { etq: 'Sin especificar', nota: 'Edita el gasto para decir con qué lo pagaste' },
};

/** Presupuesto del periodo por categoría: lo variable + los gastos fijos activos que caen en ella. */
/** Fecha dentro del periodo en que cae un día del mes (p. ej. el día de pago de una tarjeta). */
function fechaEnPeriodo(desde, hasta, dia) {
  const [a, m] = desde.split('-').map(Number);
  for (const [y, mm] of [[a, m], [m === 12 ? a + 1 : a, m === 12 ? 1 : m + 1]]) {
    const ultimo = new Date(y, mm, 0).getDate();
    const f = `${y}-${String(mm).padStart(2, '0')}-${String(Math.min(dia, ultimo)).padStart(2, '0')}`;
    if (f >= desde && f <= hasta) return f;
  }
  return null;
}

export async function vistaPeriodo(raiz, [clave = periodoActual()]) {
  const d = estado.datos;
  const actualClave = periodoActual();
  const esActual = clave === actualClave;
  const esFuturo = clave > actualClave;
  const [desde, hasta] = rangoPeriodo(clave, diaCorte());
  const movs = await api.get(`/movimientos?desde=${desde}&hasta=${hasta}`);
  const miParte = (m) => m.monto;
  const gastos = movs.filter((m) => m.tipo === 'gasto');

  // ── cuotas del periodo (según tu configuración) y si ya se pagaron
  const proy = proyeccion({ desde: clave, meses: 1 }).periodos[0];
  const pagadoA = new Map();
  for (const m of movs) if (m.tipo === 'pago_deuda') pagadoA.set(m.deuda_id, (pagadoA.get(m.deuda_id) || 0) + m.monto);
  const deudaDe = (id) => d.deudas.find((x) => String(x.id) === String(id));
  const cuotas = [
    ...proy.grupos.deudas.map((c) => ({ ...c, nomina: false })),
    ...proy.grupos.ingresos[0].detalle.filter((x) => !x.ahorro).map((c) => ({ ...c, nomina: true })),
  ].map((c) => {
    const x = deudaDe(c.deuda_id);
    const pagado = c.nomina ? c.monto : pagadoA.get(x?.id) || 0;
    const estadoC = c.nomina ? 'nomina' : pagado >= c.monto * 0.95 ? 'pagada' : pagado > 0 ? 'abono' : 'pendiente';
    const vence = x?.dia_pago ? fechaEnPeriodo(desde, hasta, x.dia_pago) : null;
    return { ...c, x, pagado: Math.min(pagado, c.monto), estado: estadoC, vence };
  }).sort((a, b) => (a.estado === 'nomina') - (b.estado === 'nomina') || String(a.vence || '9').localeCompare(String(b.vence || '9')));
  const totalCuotas = cuotas.reduce((s, c) => s + c.monto, 0);
  const pagadoCuotas = cuotas.reduce((s, c) => s + c.pagado, 0);

  // ── presupuesto y gasto por categoría, separados en fijos y variables
  const presu = presupuestoPorCategoria();
  const sinCat = { cat: { id: 0, nombre: 'Sin categoría', icono: '•', fija: false }, presupuesto: 0, gastado: 0 };
  for (const m of gastos) (presu.get(m.categoria_id) || sinCat).gastado += miParte(m);
  const cats = [...presu.values(), sinCat].filter((v) => v.presupuesto > 0 || v.gastado > 0);
  const grupo = (fija) => {
    const filas = cats.filter((v) => !!v.cat.fija === fija).sort((a, b) => b.gastado - a.gastado);
    return { filas, gastado: filas.reduce((s, v) => s + v.gastado, 0), presupuesto: filas.reduce((s, v) => s + v.presupuesto, 0) };
  };
  const fijos = grupo(true);
  const variables = grupo(false);
  // "Puedes gastar al día" sale solo de tus categorías: las cuotas tienen su propio seguimiento abajo
  const totalGast = fijos.gastado + variables.gastado;
  const totalPresu = fijos.presupuesto + variables.presupuesto;
  const queda = totalPresu - totalGast;
  // Las cuotas de deudas son gasto fijo. Las que se descuentan por nómina ya salen de tu pago, así que no se cuentan aquí.
  const cuotasPropias = cuotas.filter((c) => !c.nomina);
  if (cuotasPropias.length) {
    const fila = { cat: { id: 'cuotas', nombre: 'Cuotas de deudas', icono: '💳', fija: true },
      presupuesto: cuotasPropias.reduce((s2, c) => s2 + c.monto, 0), gastado: cuotasPropias.reduce((s2, c) => s2 + c.pagado, 0) };
    fijos.filas.unshift(fila);
    fijos.presupuesto += fila.presupuesto;
    fijos.gastado += fila.gastado;
  }

  // ── con qué se pagó
  const porMedio = new Map();
  for (const m of gastos) {
    const md = medioDe(m);
    const g = porMedio.get(md.tipo) || { tipo: md.tipo, total: 0, detalle: new Map() };
    g.total += miParte(m);
    const k = md.nombre || '—';
    g.detalle.set(k, (g.detalle.get(k) || 0) + miParte(m));
    porMedio.set(md.tipo, g);
  }
  const medios = [...porMedio.values()].sort((a, b) => b.total - a.total);

  // ── días
  const hoy = new Date(`${d.hoy}T12:00:00`);
  const ini = new Date(`${desde}T12:00:00`);
  const fin = new Date(`${hasta}T12:00:00`);
  const diasTotales = Math.round((fin - ini) / 864e5) + 1;
  const diasRestantes = esActual ? Math.max(1, Math.round((fin - hoy) / 864e5) + 1) : esFuturo ? diasTotales : 0;
  const diasPasados = diasTotales - diasRestantes + (esActual ? 1 : 0);
  const porDia = Math.max(0, queda) / Math.max(1, diasRestantes);

  // ── lista de la izquierda
  const filtroTipo = raiz.dataset.tipo || 'gasto';
  const filtro = raiz.dataset.filtro || '';
  const visibles = movs.filter((m) => (filtroTipo === 'todo' || m.tipo === filtroTipo)
    && (!filtro || String(m.categoria_id) === filtro || `c:${m.cuenta_id}` === filtro || (m.tipo === 'gasto' && `t:${m.deuda_id}` === filtro)));
  const porFecha = new Map();
  for (const m of visibles) { if (!porFecha.has(m.fecha)) porFecha.set(m.fecha, []); porFecha.get(m.fecha).push(m); }
  const cuenta = (t) => movs.filter((m) => t === 'todo' || m.tipo === t).length;

  const bloqueGrupo = (titulo, g, clase) => h`
    <div class="fv-grupo ${clase}">
      <div class="fv-cab"><span class="fv-nombre">${titulo}</span><span class="fv-total">${pesos(g.gastado)}</span></div>
      <p class="chico suave">${g.presupuesto > 0 ? `de ${pesos(g.presupuesto)} previstos${g.gastado > g.presupuesto ? ` · te pasaste ${pesos(g.gastado - g.presupuesto)}` : ''}` : 'Sin presupuesto'}</p>
      ${g.filas.map((v) => {
        const r = v.presupuesto ? v.gastado / v.presupuesto : (v.gastado ? 2 : 0);
        return h`<div class="cat ${r > 1 ? 'pasado' : r > 0.85 ? 'cerca' : ''}">
          <span class="ic" aria-hidden="true">${v.cat.icono}</span><span>${v.cat.nombre}</span>
          <span class="chico ${r > 1 ? 'neg' : 'suave'}">${pesos(v.gastado)}${v.presupuesto ? ` / ${pesos(v.presupuesto)}` : ''}</span>
          <span class="riel" aria-hidden="true"><span style="width:${Math.min(100, Math.round(r * 100))}%"></span></span>
        </div>`;
      })}
    </div>`;

  const ESTADOS = { pagada: 'Pagada', abono: 'Abonada', pendiente: 'Pendiente', nomina: 'Por nómina' };

  raiz.innerHTML = h`
    <section class="banda">
      <div class="banda-arriba">
        <div class="periodo-nav">
          <a class="nav-flecha" href="#/periodo/${sumarMeses(clave, -1)}" aria-label="Periodo anterior">‹</a>
          <p class="banda-periodo">Periodo ${diaMes(desde)} – ${diaMes(hasta)}</p>
          <a class="nav-flecha" href="#/periodo/${sumarMeses(clave, 1)}" aria-label="Periodo siguiente">›</a>
          ${!esActual ? h`<a class="chico" href="#/" style="color:#B9D5C7">Ir al actual</a>` : ''}
        </div>
        <button class="boton-claro solo-escritorio-flex" data-registrar>+ Registrar gasto</button>
      </div>
      <div class="banda-cuerpo">
        <div class="banda-principal">
          ${esActual || esFuturo ? h`
            <p class="banda-etq">Puedes gastar al día</p>
            <p class="banda-cifra ${queda < 0 ? 'neg' : ''}">${pesos(porDia)}</p>
            <p class="banda-sub">${queda < 0 ? `Ya te pasaste ${pesos(-queda)} del presupuesto` : esFuturo ? `durante los ${diasTotales} días de este periodo` : diasRestantes === 1 ? 'Hoy es el último día del periodo' : `durante los ${diasRestantes} días que faltan para el corte del ${diaCorte()}`}</p>`
          : h`
            <p class="banda-etq">Gastaste en este periodo</p>
            <p class="banda-cifra">${pesos(totalGast)}</p>
            <p class="banda-sub">${queda >= 0 ? `Te sobraron ${pesos(queda)} del presupuesto` : `Te pasaste ${pesos(-queda)} del presupuesto`}</p>`}
        </div>
        <dl class="banda-datos">
          <div><dt>Te consignan</dt><dd>${pesos(proy.grupos.ingresos[0].monto)}</dd></div>
          <div><dt>Has gastado</dt><dd>${pesos(totalGast)}</dd></div>
          <div><dt>Te queda del presupuesto</dt><dd class="${queda < 0 ? 'neg' : ''}">${pesos(queda)}</dd></div>
        </dl>
      </div>
      <div class="dias" role="img" aria-label="${`Día ${Math.max(0, diasPasados)} de ${diasTotales} del periodo`}">
        ${Array.from({ length: diasTotales }, (_, i) => h`<span class="${i < diasPasados - (esActual ? 1 : 0) ? 'pasado' : esActual && i === diasPasados - 1 ? 'hoy' : ''}"></span>`)}
      </div>
    </section>

    <div class="periodo-rejilla">
      <section class="bloque movs">
        <div class="bloque-cab movs-cab">
          <div class="chips" role="radiogroup" aria-label="Qué mostrar">
            ${Object.entries(FILTROS).map(([k, v]) => h`<label><input type="radio" name="tipo-mov" value="${k}" ${k === filtroTipo ? 'checked' : ''}><span>${v} <span class="cuenta">${cuenta(k)}</span></span></label>`)}
          </div>
          <select id="filtro" aria-label="Filtrar por categoría o medio">
            <option value="">Todas las categorías y medios</option>
            <optgroup label="Categoría">${d.categorias.map((c) => h`<option value="${c.id}" ${String(c.id) === filtro ? 'selected' : ''}>${c.icono} ${c.nombre}</option>`)}</optgroup>
            <optgroup label="Cuentas">${(d.cuentas || []).map((x) => h`<option value="c:${x.id}" ${`c:${x.id}` === filtro ? 'selected' : ''}>${x.nombre}</option>`)}</optgroup>
            <optgroup label="Tarjetas">${d.deudas.filter((x) => x.tipo === 'tarjeta').map((x) => h`<option value="t:${x.id}" ${`t:${x.id}` === filtro ? 'selected' : ''}>${x.nombre}</option>`)}</optgroup>
          </select>
        </div>
        ${visibles.length ? [...porFecha.entries()].map(([f, lista]) => h`
          <div class="dia"><span>${fechaCorta(f)}</span><span>${pesos(lista.filter((m) => m.tipo === 'gasto').reduce((s, m) => s + miParte(m), 0) || 0)}</span></div>
          <ul class="lista">${lista.map(filaMovimiento)}</ul>`)
          : h`<div class="vacio"><p>No hay ${FILTROS[filtroTipo].toLowerCase()} ${filtro ? 'con ese filtro ' : ''}en este periodo.</p>
              ${filtroTipo === 'gasto' && !filtro ? h`<button class="primario" data-registrar>Registrar el primero</button>` : ''}</div>`}
      </section>

      <div class="pila">
        <section class="bloque">
          <div class="bloque-cab"><h2>Fijos y variables</h2><span class="chico suave">${pesos(fijos.gastado + variables.gastado)} de ${pesos(fijos.presupuesto + variables.presupuesto)}</span></div>
          <div class="fv-barra" role="img" aria-label="${`Fijos ${pesos(fijos.gastado)}, variables ${pesos(variables.gastado)}`}">
            <span class="fijo" style="flex:${fijos.gastado || 0.0001}"></span><span class="variable" style="flex:${variables.gastado || 0.0001}"></span>
          </div>
          ${bloqueGrupo('Gastos fijos', fijos, 'fijo')}
          ${bloqueGrupo('Gastos variables', variables, 'variable')}
          <p class="chico suave" style="margin-top:10px">Cambia qué categoría es fija o variable en <a href="#/ajustes/gastos">Ajustes</a>.</p>
        </section>

        <section class="bloque">
          <div class="bloque-cab"><h2>Con qué pagaste</h2></div>
          ${medios.length ? h`<ul class="medios">${medios.map((g) => h`<li>
              <div class="medio-cab"><span class="medio-pill ${g.tipo}">${TIPOS_MEDIO[g.tipo].etq}</span><strong>${pesos(g.total)}</strong></div>
              <p class="chico suave">${TIPOS_MEDIO[g.tipo].nota}${g.detalle.size > 1 || [...g.detalle.keys()][0] !== '—' ? ': ' : ''}${[...g.detalle.entries()].filter(([k]) => k !== '—').map(([k, v]) => `${k} ${pesos(v)}`).join(' · ')}</p>
            </li>`)}</ul>` : h`<p class="chico suave">Aún no hay gastos en este periodo.</p>`}
        </section>

        <section class="bloque">
          <div class="bloque-cab"><h2>Cuotas de este periodo</h2><span class="chico suave">${pesos(pagadoCuotas)} de ${pesos(totalCuotas)}</span></div>
          <div class="meta cuotas-meta" aria-hidden="true"><span style="width:${totalCuotas ? Math.round((pagadoCuotas / totalCuotas) * 100) : 0}%"></span></div>
          ${cuotas.length ? h`<ul class="cuotas">${cuotas.map((c) => h`
            <li class="cuota ${c.estado}" style="--c:${c.x ? colorDeuda(c.x) : 'var(--tinta-suave)'}">
              <div class="cuota-txt"><strong>${c.nombre}</strong>
                <span class="chico suave">${c.estado === 'nomina' ? 'Se descuenta de tu pago' : c.vence ? `Vence el ${fechaCorta(c.vence)}` : 'Durante el periodo'}${c.estado === 'abono' ? ` · llevas ${pesos(c.pagado)}` : ''}</span></div>
              <span class="cuota-monto">${pesos(c.monto)}</span>
              ${c.estado === 'pendiente' || c.estado === 'abono'
                ? h`<button class="sutil cuota-estado" data-pagar-cuota="${c.x?.id ?? ''}" data-monto="${Math.round(c.monto - c.pagado)}">Pagar</button>`
                : h`<span class="cuota-estado">${ESTADOS[c.estado]}</span>`}
            </li>`)}</ul>` : h`<p class="chico suave">No hay cuotas en este periodo.</p>`}
        </section>
      </div>
    </div>`;

  raiz.querySelector('#filtro').onchange = (e) => { raiz.dataset.filtro = e.target.value; vistaPeriodo(raiz, [clave]); };
  raiz.onchange = (e) => {
    if (e.target.name === 'tipo-mov') { raiz.dataset.tipo = e.target.value; vistaPeriodo(raiz, [clave]); }
  };
  raiz.onclick = async (e) => {
    if (e.target.closest('[data-registrar]')) abrirDialogo((dlg) => formMovimiento(dlg, { tipo: 'gasto' }));
    const pagar = e.target.closest('[data-pagar-cuota]');
    if (pagar) {
      const x = deudaDe(pagar.dataset.pagarCuota);
      if (!x) return;
      const rt = x.tipo === 'tarjeta' ? resumenTarjeta(x, (d.compras || []).filter((c) => c.deuda_id === x.id), d.hoy) : null;
      abrirDialogo((dlg) => formPago(dlg, x, rt));
      return;
    }
    const fila = e.target.closest('[data-mov]');
    if (fila) editarMovimiento(movs.find((m) => String(m.id) === fila.dataset.mov));
  };
}

