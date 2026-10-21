import { api } from '../api.js';
import { h, pesos, pct, aviso, abrirDialogo, cerrarDialogo, confirmar, numero, hoyISO, mascaraPesos, leerForm, selectorColor, conectarColor, colorElegido, diaMes, fechaCorta } from '../ui.js';
import { estado, cargar, proyeccion } from '../estado.js';
import { tasaEfectivaAnual, simularPlazos, nombreMes, resumenTarjeta, valorCuota, cuotasPendientes, cargosTarjeta } from '../motor.js';

export const COLORES = ['#1E6B52', '#2F5DA8', '#6A4FB3', '#B3372B', '#C2610C', '#0E7C86', '#8A3B6E', '#3D4A57', '#9A7B0F', '#4E7A1F'];
/** Color de una deuda: el que escogiste o uno de la paleta según su posición. */
export const colorDeuda = (x, i = 0) => x.color || COLORES[(Number(x.id) || i) % COLORES.length];

const TIPOS = { tarjeta: 'Tarjeta', credito: 'Crédito', nomina: 'Crédito por nómina', educativo: 'Educativo', otro: 'Otro' };

export async function vistaDeudas(raiz) {
  const d = estado.datos;
  const pendientes = d.compras || await api.get('/compras-pendientes');
  const resumenes = new Map(d.deudas.filter((x) => x.tipo === 'tarjeta')
    .map((x) => [x.id, resumenTarjeta(x, pendientes.filter((c) => c.deuda_id === x.id), d.hoy)]));
  const proy = proyeccion({ meses: 12 });
  const fin = new Map(proy.deudas.map((x) => [String(x.id), x.terminaEn]));
  // Saldo al inicio y al final de cada periodo proyectado, para la curva de la tarjeta
  const historial = new Map(proy.deudas.map((x) => { const o = d.deudas.find((y) => String(y.id) === String(x.id)); return [String(x.id), o ? [{ clave: 'hoy', saldo: o.saldo }, ...x.historial] : x.historial]; }));
  const activas = d.deudas.filter((x) => x.activa);
  const parte = (x) => Number(x.mi_porcentaje) / 100;
  const total = activas.reduce((s, x) => s + x.saldo * parte(x), 0);
  const cuotas = activas.filter((x) => !x.descuento_nomina).reduce((s, x) => s + x.cuota * parte(x), 0);
  const nomina = activas.filter((x) => x.descuento_nomina).reduce((s, x) => s + x.cuota * parte(x), 0);
  const cara = [...activas].sort((a, b) => b.tasa_mensual - a.tasa_mensual)[0];

  raiz.innerHTML = h`
    <header class="cabecera">
      <div><h1>Deudas</h1><p class="sub">Saldos y cuotas en tu parte. Las fechas de fin salen de la proyección.</p></div>
      <button class="primario" data-nueva>Agregar deuda</button>
    </header>
    <div class="pila">
      <div class="cifras">
        <div><span class="etq">Debes en total</span><span class="cifra">${pesos(total)}</span></div>
        <div><span class="etq">Cuotas que pagas tú</span><span class="cifra">${pesos(cuotas)}</span></div>
        <div><span class="etq">Descontado por nómina</span><span class="cifra">${pesos(nomina)}</span></div>
        <div><span class="etq">La más cara</span><span class="cifra">${cara && cara.tasa_mensual > 0 ? pct(tasaEfectivaAnual(cara.tasa_mensual)) : '—'}</span>
          <span class="chico suave">${cara && cara.tasa_mensual > 0 ? cara.nombre : ''}</span></div>
      </div>

      ${d.deudas.length ? h`<div class="deudas-rejilla">${d.deudas.map((x, i) => {
        const termina = fin.get(String(x.id));
        const hist = historial.get(String(x.id)) || [];
        const maxS = Math.max(1, ...hist.map((p) => p.saldo));
        const sinSaldo = !(x.saldo > 0);
        const rt = resumenes.get(x.id);
        return h`<article class="deuda clicable ${x.activa ? '' : 'inactiva'}" style="--c:${colorDeuda(x, i)}" data-detalle="${x.id}" tabindex="0" role="button" aria-label="${`Ver detalle de ${x.nombre}`}">
          <div class="deuda-cara">
            <div class="deuda-top"><h3>${x.nombre}</h3><span>${TIPOS[x.tipo]}</span></div>
            <div>
              <span class="deuda-etq">${sinSaldo ? 'Saldo' : x.compartida ? `Tu parte (${Number(x.mi_porcentaje)} %)` : 'Saldo'}</span>
              <span class="deuda-saldo">${sinSaldo ? 'Sin registrar' : pesos(x.saldo * parte(x))}</span>
            </div>
            ${!sinSaldo && hist.length ? h`<div class="deuda-curva" aria-label="Cómo baja el saldo mes a mes">
                ${hist.map((p) => h`<span title="${p.clave === 'hoy' ? `Hoy debes ${pesos(p.saldo * parte(x))}` : p.pago > 0 ? `${nombreMes(p.clave)}: pagas ${pesos(p.pago * parte(x))}, quedas debiendo ${pesos(p.saldo * parte(x))}` : p.saldo > 0.5 ? `${nombreMes(p.clave)}: sin pago, debes ${pesos(p.saldo * parte(x))}` : `${nombreMes(p.clave)}: ya pagada`}" style="height:${Math.max(3, Math.round((p.saldo / maxS) * 100))}%"></span>`)}
              </div>`
              : x.cuotas_restantes != null ? h`<div class="deuda-pips" aria-label="${`${x.cuotas_restantes} cuotas por pagar`}">
                ${Array.from({ length: Math.min(x.cuotas_restantes, 36) }, () => h`<span></span>`)}</div>`
              : h`<div class="deuda-pips vacio-pips"><span class="chico">Sin fecha de fin</span></div>`}
          </div>
          <div class="deuda-cuerpo">
            ${rt ? h`<dl class="deuda-datos">
              <div><dt>Próximo pago</dt><dd>${pesos((rt.estimado || x.cuota) * parte(x))}</dd></div>
              <div><dt>Vence</dt><dd class="${rt.diasParaPagar != null && rt.diasParaPagar <= 3 ? 'neg' : ''}">${rt.vence ? diaMes(rt.vence) : '—'}</dd></div>
              <div><dt>Disponible</dt><dd>${rt.disponible != null ? pesos(rt.disponible) : '—'}</dd></div>
            </dl>
            ${rt.uso != null ? h`<div class="uso-cupo" title="${`Usas el ${Math.round(rt.uso * 100)} % del cupo`}"><span style="width:${Math.round(rt.uso * 100)}%"></span></div>` : ''}
            <p class="chico suave">${rt.corte ? `Corte ${diaMes(rt.corte)}` : 'Sin fecha de corte'}${rt.pendientes.length ? ` · ${rt.pendientes.length} ${rt.pendientes.length === 1 ? 'compra' : 'compras'} por pagar` : ''}</p>`
            : h`<dl class="deuda-datos">
              <div><dt>Cuota</dt><dd>${pesos(x.cuota * parte(x))}</dd></div>
              <div><dt>Tasa</dt><dd>${x.tasa_mensual > 0 ? pct(tasaEfectivaAnual(x.tasa_mensual)) : '—'}</dd></div>
              <div><dt>Termina</dt><dd>${termina ? nombreMes(termina) : x.cuotas_restantes != null ? `${x.cuotas_restantes} cuotas` : '—'}</dd></div>
            </dl>`}
            <div class="deuda-pie">
              ${x.descuento_nomina ? h`<span class="etiqueta nomina">Por nómina</span>` : ''}
              ${x.compartida ? h`<span class="etiqueta hogar">Compartida</span>` : ''}
              ${!x.activa ? h`<span class="etiqueta">Inactiva</span>` : ''}
              <span class="deuda-acciones"><button class="sutil" data-pagar="${x.id}">Pagar</button><button class="sutil" data-editar="${x.id}">Editar</button></span>
            </div>
          </div>
        </article>`;
      })}</div>` : h`<div class="bloque vacio"><p>No tienes deudas registradas.</p></div>`}

      <section class="bloque" id="simulador">
        <h2>Simulador de crédito</h2>
        <p class="chico suave" style="margin-bottom:12px">Compara plazos con los costos reales. Las comisiones que se suman al crédito (como el FGA) suben la tasa real aunque la tasa nominal no cambie.</p>
        <form id="f-sim" class="fila-campos">
          <div class="campo"><label for="s-monto">Te desembolsan</label><input id="s-monto" name="recibes" data-pesos inputmode="decimal" value="2500000"></div>
          <div class="campo"><label for="s-tasa">Tasa mensual (%)</label><input id="s-tasa" name="tasa" inputmode="decimal" value="1,25"></div>
          <div class="campo"><label for="s-com">Comisión sumada (%)</label><input id="s-com" name="comision" inputmode="decimal" value="3,57"><p class="ayuda">FGA 3 % + IVA = 3,57 %</p></div>
          <div class="campo"><label for="s-seg">Seguro único (%)</label><input id="s-seg" name="seguro" inputmode="decimal" value="0,39"><p class="ayuda">0,3 % anual por el plazo</p></div>
        </form>
        <div id="sim-res"></div>
      </section>
    </div>`;

  const sim = raiz.querySelector('#f-sim');
  mascaraPesos(sim);
  const calcular = () => {
    const recibes = numero(sim.recibes.value);
    const tasa = numero(sim.tasa.value) / 100;
    const debes = recibes * (1 + numero(sim.comision.value) / 100 + numero(sim.seguro.value) / 100);
    const filas = simularPlazos({ recibes, debes, tasaMensual: tasa, plazos: [6, 9, 12, 15, 18, 24, 36, 48] });
    raiz.querySelector('#sim-res').innerHTML = h`<p class="chico" style="margin-bottom:8px">Deberías <strong>${pesos(debes)}</strong> por <strong>${pesos(recibes)}</strong> recibidos.</p>
      <div class="tabla-env"><table>
        <thead><tr><th>Plazo</th><th>Cuota</th><th>Pagas en total</th><th>Te cuesta</th><th>Tasa real E.A.</th></tr></thead>
        <tbody>${filas.map((f) => h`<tr><td>${f.plazo} meses</td><td>${pesos(f.cuota)}</td><td>${pesos(f.total)}</td><td>${pesos(f.costo)}</td><td>${pct(f.tasaRealAnual)}</td></tr>`)}</tbody>
      </table></div>`;
  };
  sim.oninput = calcular;
  calcular();

  const buscar = (id) => d.deudas.find((x) => String(x.id) === String(id));
  raiz.onclick = (e) => {
    const b = e.target.closest('button');
    if (b) {
      if (b.dataset.nueva !== undefined) abrirDialogo((dlg) => formDeuda(dlg, {}));
      if (b.dataset.editar) abrirDialogo((dlg) => formDeuda(dlg, buscar(b.dataset.editar)));
      if (b.dataset.pagar) abrirDialogo((dlg) => formPago(dlg, buscar(b.dataset.pagar), resumenes.get(Number(b.dataset.pagar))));
      return;
    }
    const card = e.target.closest('[data-detalle]');
    if (card) abrirDetalle(buscar(card.dataset.detalle));
  };
  raiz.onkeydown = (e) => {
    const card = e.target.closest?.('[data-detalle]');
    if (card && e.target === card && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); abrirDetalle(buscar(card.dataset.detalle)); }
  };
}

function formDeuda(dlg, x) {
  const editando = !!x.id;
  dlg.innerHTML = h`<form id="f-deuda" novalidate>
    <h2>${editando ? `Editar ${x.nombre}` : 'Agregar deuda'}</h2>
    <div class="fila-campos">
      <div class="campo"><label for="d-nombre">Nombre</label><input id="d-nombre" name="nombre" required maxlength="80" value="${x.nombre || ''}"></div>
      <div class="campo"><label for="d-tipo">Tipo</label><select id="d-tipo" name="tipo">${Object.entries(TIPOS).map(([k, v]) => h`<option value="${k}" ${k === (x.tipo || 'tarjeta') ? 'selected' : ''}>${v}</option>`)}</select></div>
    </div>
    <div class="fila-campos">
      <div class="campo"><label for="d-saldo">Saldo total</label><input id="d-saldo" name="saldo" data-num data-pesos inputmode="decimal" value="${x.saldo ?? ''}"><p class="ayuda">El total, aunque sea compartida. Déjalo en 0 si no lo sabes.</p></div>
      <div class="campo"><label for="d-cuota">Cuota mensual total</label><input id="d-cuota" name="cuota" data-num data-pesos inputmode="decimal" value="${x.cuota ?? ''}"></div>
    </div>
    <div class="fila-campos">
      <div class="campo"><label for="d-tasa">Tasa mensual (%)</label><input id="d-tasa" name="tasa_mensual" data-pct inputmode="decimal" value="${x.tasa_mensual != null ? String(+(x.tasa_mensual * 100).toFixed(4)).replace('.', ',') : ''}"><p class="ayuda">Mes vencido. 1,25 % M.V. ≈ 16,1 % E.A.</p></div>
      <div class="campo"><label for="d-restantes">Cuotas por pagar</label><input id="d-restantes" name="cuotas_restantes" type="number" min="0" data-num value="${x.cuotas_restantes ?? ''}"><p class="ayuda">Vacío si no tiene fin fijo (tarjeta).</p></div>
      <div class="campo"><label for="d-pct">Tu parte (%)</label><input id="d-pct" name="mi_porcentaje" type="number" min="0" max="100" data-num value="${x.mi_porcentaje ?? 100}"></div>
    </div>
    <fieldset class="solo-tarjeta campo">
      <legend class="chico" style="font-weight:600;margin-bottom:6px">Tarjeta de crédito</legend>
      <div class="fila-campos">
        <div class="campo"><label for="d-cupo">Cupo total</label><input id="d-cupo" name="cupo" data-num data-pesos inputmode="decimal" value="${x.cupo ?? ''}"></div>
        <div class="campo"><label for="d-corte">Día de corte</label><input id="d-corte" name="dia_corte" type="number" min="1" max="31" data-num value="${x.dia_corte ?? ''}"></div>
        <div class="campo"><label for="d-diapago">Pagar hasta el día</label><input id="d-diapago" name="dia_pago" type="number" min="1" max="31" data-num value="${x.dia_pago ?? ''}"></div>
      </div>
      <div class="campo">
        <span class="chico" style="font-weight:600;display:block;margin-bottom:4px">Cobros fijos de cada mes</span>
        <p class="ayuda" style="margin:0 0 8px">Cuota de manejo, seguros, cuota de membresía… Lo que la tarjeta te cobra en cada factura aunque no compres nada.</p>
        <div class="cargos" data-cargos>${cargosTarjeta(x).map((c) => filaCargo(c))}</div>
        <button type="button" class="sutil" data-cargo-nuevo>+ Agregar cobro</button>
      </div>
    </fieldset>
    ${selectorColor(x.color || colorDeuda(x))}
    <div class="campo"><label class="check"><input type="checkbox" name="compartida" ${x.compartida ? 'checked' : ''}>Es compartida (pagas solo tu parte)</label></div>
    <div class="campo"><label class="check"><input type="checkbox" name="descuento_nomina" ${x.descuento_nomina ? 'checked' : ''}>Se descuenta por nómina</label>
      <p class="ayuda">Si la marcas, la cuota se resta de lo que te consignan en lugar de contarse como gasto.</p></div>
    ${editando ? h`<div class="campo"><label class="check"><input type="checkbox" name="activa" ${x.activa ? 'checked' : ''}>Activa</label></div>` : ''}
    <div class="campo"><label for="d-notas">Notas</label><textarea id="d-notas" name="notas" rows="2" maxlength="1000">${x.notas || ''}</textarea></div>
    <div class="acciones">
      ${editando ? h`<button type="button" class="peligro izq" data-borrar>Borrar</button>` : ''}
      <button type="button" data-cerrar>Cancelar</button>
      <button class="primario">${editando ? 'Guardar cambios' : 'Agregar deuda'}</button>
    </div></form>`;
  const form = dlg.querySelector('form');
  mascaraPesos(form);
  conectarColor(form);
  const listaCargos = form.querySelector('[data-cargos]');
  form.querySelector('[data-cargo-nuevo]').onclick = () => {
    listaCargos.insertAdjacentHTML('beforeend', filaCargo({ nombre: listaCargos.children.length ? 'Seguro' : 'Cuota de manejo', valor: '' }));
    mascaraPesos(listaCargos.lastElementChild);
    listaCargos.lastElementChild.querySelector('input').select();
  };
  listaCargos.onclick = (e) => { if (e.target.closest('[data-quitar-cargo]')) e.target.closest('.cargo').remove(); };
  const syncTipo = () => { form.querySelector('.solo-tarjeta').hidden = form.tipo.value !== 'tarjeta'; };
  form.tipo.addEventListener('change', syncTipo);
  syncTipo();
  form.onsubmit = async (e) => {
    e.preventDefault();
    const c = leerForm(form);
    c.saldo = c.saldo || 0; c.cuota = c.cuota || 0; c.tasa_mensual = c.tasa_mensual || 0;
    c.color = colorElegido(form);
    delete c.color_libre;
    c.cargos = [...listaCargos.querySelectorAll('.cargo')]
      .map((f) => ({ nombre: f.querySelector('[data-cargo-nombre]').value.trim(), valor: numero(f.querySelector('[data-cargo-valor]').value) || 0 }))
      .filter((k) => k.nombre || k.valor);
    if (c.cargos.some((k) => !k.nombre)) { aviso('Ponle nombre a cada cobro fijo.', true); return; }
    c.cuota_manejo = 0; // reemplazado por la lista de cobros
    if (c.tipo !== 'tarjeta') { c.cupo = null; c.dia_corte = null; c.dia_pago = null; c.cargos = []; }
    try {
      if (editando) await api.put(`/deudas/${x.id}`, c); else await api.post('/deudas', c);
      cerrarDialogo(); aviso(editando ? 'Deuda actualizada' : 'Deuda agregada');
      await cargar(); window.dispatchEvent(new Event('copcash:cambio'));
    } catch (err) { aviso(err.message, true); }
  };
  dlg.querySelector('[data-borrar]')?.addEventListener('click', async () => {
    if (!(await confirmar(`¿Borrar ${x.nombre}? Sus pagos registrados se conservan sin deuda asociada.`))) return;
    try { await api.del(`/deudas/${x.id}`); aviso('Deuda borrada'); await cargar(); window.dispatchEvent(new Event('copcash:cambio')); } catch (err) { aviso(err.message, true); }
  });
}

function filaCargo(c) {
  return h`<div class="cargo">
    <input data-cargo-nombre maxlength="60" value="${c.nombre}" aria-label="Nombre del cobro" placeholder="Ej: Seguro de vida">
    <input data-cargo-valor data-pesos inputmode="decimal" value="${c.valor === '' ? '' : Math.round(c.valor)}" aria-label="Valor mensual" placeholder="0">
    <button type="button" class="sutil" data-quitar-cargo aria-label="Quitar ${c.nombre}">✕</button>
  </div>`;
}

export function formPago(dlg, x, rt = null) {
  const d = estado.datos;
  const sugerido = Math.round((rt?.estimado || x.cuota) * Number(x.mi_porcentaje) / 100);
  dlg.innerHTML = h`<form id="f-pago" novalidate>
    <h2>Pagar ${x.nombre}</h2>
    <p class="chico suave" style="margin-bottom:12px">Saldo actual: ${pesos(x.saldo)}. El pago baja el saldo y queda en tus movimientos.</p>
    <div class="campo"><label for="p-monto">Valor pagado</label><input id="p-monto" class="monto-grande" name="monto" data-pesos inputmode="decimal" value="${sugerido || ''}" autofocus></div>
    <div class="fila-campos">
      <div class="campo"><label for="p-fecha">Fecha</label><input id="p-fecha" type="date" name="fecha" value="${hoyISO()}"></div>
      <div class="campo"><label for="p-cuenta">Pagas desde</label><select id="p-cuenta" name="cuenta_id">
        <option value="">Sin especificar</option>
        ${(d.cuentas || []).filter((c) => c.activa).map((c) => h`<option value="${c.id}">${c.nombre} (${pesos(c.saldo)})</option>`)}</select></div>
    </div>
    ${x.cuotas_restantes != null ? h`<div class="campo"><label class="check"><input type="checkbox" name="cuota_pagada" checked>Es la cuota del mes (quedan ${x.cuotas_restantes - 1 < 0 ? 0 : x.cuotas_restantes - 1})</label></div>` : ''}
    ${x.tipo === 'tarjeta' ? h`<div class="campo"><label class="check"><input type="checkbox" name="avanzar_compras" checked>Es el pago de la factura${rt?.corte ? ` del ${diaMes(rt.corte)}` : ''}</label>
      <p class="ayuda">Cada compra que entró a ese corte avanza una cuota.</p></div>` : ''}
    <div class="acciones"><button type="button" data-cerrar>Cancelar</button><button class="primario">Registrar pago</button></div>
  </form>`;
  const form = dlg.querySelector('form');
  mascaraPesos(form);
  form.onsubmit = async (e) => {
    e.preventDefault();
    const monto = numero(form.monto.value);
    if (!(monto > 0)) { aviso('Escribe el valor que pagaste.', true); return; }
    try {
      await api.post(`/deudas/${x.id}/pagos`, { monto, fecha: form.fecha.value, cuenta_id: Number(form.cuenta_id.value) || null, cuota_pagada: form.cuota_pagada?.checked || false, avanzar_compras: form.avanzar_compras?.checked || false, corte: form.avanzar_compras?.checked ? rt?.corte || null : null });
      cerrarDialogo(); aviso('Pago registrado');
      await cargar(); window.dispatchEvent(new Event('copcash:cambio'));
    } catch (err) { aviso(err.message, true); }
  };
}

// ───────────── detalle de una deuda ─────────────

async function abrirDetalle(x) {
  if (!x) return;
  const d = estado.datos;
  const { compras, pagos } = await api.get(`/deudas/${x.id}/detalle`);
  const esTarjeta = x.tipo === 'tarjeta';
  const rt = esTarjeta ? resumenTarjeta(x, compras, d.hoy) : null;
  const pend = compras.filter((c) => cuotasPendientes(c) > 0);
  const pagadas = compras.filter((c) => cuotasPendientes(c) === 0).slice(0, 10);
  const enFactura = new Set((rt?.enFactura || []).map((c) => c.id));
  const color = colorDeuda(x);

  const dlg = abrirDialogo((dl) => {
    dl.classList.add('ancho');
    dl.innerHTML = h`<div class="detalle-deuda" style="--c:${color}">
      <header class="detalle-cara">
        <div class="deuda-top"><h2>${x.nombre}</h2><button type="button" class="cerrar-x" data-cerrar aria-label="Cerrar">✕</button></div>
        <div class="detalle-cifras">
          <div><span class="deuda-etq">Debes</span><span class="deuda-saldo">${x.saldo > 0 ? pesos(x.saldo) : 'Sin registrar'}</span></div>
          ${rt?.disponible != null ? h`<div><span class="deuda-etq">Disponible de ${pesos(x.cupo)}</span><span class="deuda-saldo chica">${pesos(rt.disponible)}</span></div>` : ''}
          ${rt ? h`<div><span class="deuda-etq">${rt.vence ? `Pagar hasta el ${fechaCorta(rt.vence)}` : 'Próximo pago'}</span><span class="deuda-saldo chica">${pesos(rt.estimado || x.cuota)}</span></div>`
            : h`<div><span class="deuda-etq">Cuota</span><span class="deuda-saldo chica">${pesos(x.cuota)}</span></div>`}
        </div>
        ${rt?.uso != null ? h`<div class="meta"><span style="width:${Math.round(rt.uso * 100)}%"></span></div>` : ''}
        <p class="deuda-etq" style="margin-top:6px">${esTarjeta
          ? `${x.dia_corte ? `Corte el ${x.dia_corte} de cada mes` : 'Agrega el día de corte en Editar'}${x.dia_pago ? ` · pago hasta el ${x.dia_pago}` : ''}${x.compartida ? ` · pagas el ${Number(x.mi_porcentaje)} %` : ''}`
          : `${TIPOS[x.tipo]}${x.tasa_mensual > 0 ? ` · ${pct(tasaEfectivaAnual(x.tasa_mensual))} E.A.` : ''}${x.cuotas_restantes != null ? ` · ${x.cuotas_restantes} cuotas por pagar` : ''}`}</p>
      </header>

      <div class="detalle-cuerpo">
        ${esTarjeta ? h`
          <section>
            <div class="bloque-cab"><h3>Compras por pagar</h3><span class="chico suave">Edita cuotas o valor de cuota y se guarda solo</span></div>
            ${pend.length ? h`<div class="tabla-env"><table class="compras">
              <thead><tr><th>Compra</th><th>Valor</th><th>Cuotas</th><th>Pagadas</th><th>Valor cuota</th><th>Falta</th></tr></thead>
              <tbody>${pend.map((c) => h`<tr data-compra="${c.id}" class="${enFactura.has(c.id) ? 'en-factura' : ''}">
                <td><strong>${c.descripcion || c.categoria || 'Compra'}</strong><br><span class="chico suave">${fechaCorta(c.fecha)}${enFactura.has(c.id) ? ' · en esta factura' : ''}</span></td>
                <td>${pesos(c.monto)}</td>
                <td data-etq="Cuotas"><input name="cuotas" type="number" min="1" max="72" value="${c.cuotas}" aria-label="Número de cuotas"></td>
                <td data-etq="Pagadas"><input name="cuotas_pagadas" type="number" min="0" max="${c.cuotas}" value="${c.cuotas_pagadas}" aria-label="Cuotas pagadas"></td>
                <td data-etq="Valor cuota"><input name="cuota_valor" data-pesos inputmode="decimal" value="${Math.round(valorCuota(c))}" aria-label="Valor de la cuota"></td>
                <td>${pesos(valorCuota(c) * cuotasPendientes(c))}</td>
              </tr>`)}</tbody>
            </table></div>` : h`<p class="chico suave">No hay compras registradas por pagar.</p>`}
            <dl class="detalle-totales">
              <div><dt>Compras detalladas</dt><dd>${pesos(rt.detallado)}</dd></div>
              <div><dt>Saldo sin detallar</dt><dd>${pesos(rt.sinDetallar)}</dd></div>
              <div><dt>Cobros fijos</dt><dd>${pesos(rt.cargos)}</dd></div>
              <div><dt>Esta factura</dt><dd>${pesos(rt.estimado)}</dd></div>
            </dl>
            <p class="chico suave">${cargosTarjeta(x).length ? cargosTarjeta(x).map((k) => `${k.nombre} ${pesos(k.valor)}`).join(' · ') : 'Sin cobros fijos registrados.'} <button type="button" class="sutil" data-editar-det>Cambiar</button></p>
            ${rt.estimado && Math.round(rt.estimado) !== Math.round(x.cuota) ? h`<p class="chico">La cuota que usa la proyección es ${pesos(x.cuota)}. <button type="button" class="sutil" data-usar-cuota="${rt.estimado}">Usar ${pesos(rt.estimado)}</button></p>` : ''}
          </section>
          ${pagadas.length ? h`<details class="supuesto"><summary>Compras ya pagadas (${pagadas.length})</summary><div class="contenido"><ul class="lista compacta">
            ${pagadas.map((c) => h`<li><div class="txt"><strong>${c.descripcion || c.categoria || 'Compra'}</strong><span class="chico suave">${fechaCorta(c.fecha)} · ${c.cuotas} ${c.cuotas === 1 ? 'cuota' : 'cuotas'}</span></div><span class="monto">${pesos(c.monto)}</span></li>`)}
          </ul></div></details>` : ''}` : ''}
        <section>
          <h3 style="margin-bottom:6px">Pagos</h3>
          ${pagos.length ? h`<ul class="lista compacta">${pagos.slice(0, 8).map((p) => h`<li><div class="txt"><strong>${fechaCorta(p.fecha)}</strong></div><span class="monto pos">${pesos(p.monto)}</span></li>`)}</ul>`
            : h`<p class="chico suave">Aún no registras pagos de esta deuda.</p>`}
        </section>
        <div class="acciones">
          ${esTarjeta ? h`<button type="button" class="izq" data-compra-nueva>+ Registrar compra</button>` : ''}
          <button type="button" data-editar-det>Editar ${esTarjeta ? 'tarjeta' : 'deuda'}</button>
          <button type="button" class="primario" data-pagar-det>Pagar</button>
        </div>
      </div>
    </div>`;
  });
  dlg.addEventListener('close', () => dlg.classList.remove('ancho'), { once: true });
  mascaraPesos(dlg);

  dlg.querySelector('table.compras')?.addEventListener('change', async (e) => {
    const fila = e.target.closest('[data-compra]');
    if (!fila) return;
    const campo = e.target.name;
    let v = campo === 'cuota_valor' ? numero(e.target.value) : Number(e.target.value);
    if (campo === 'cuotas') {
      // al cambiar el número de cuotas, la cuota vuelve a ser valor / cuotas (sin intereses)
      try { await api.put(`/movimientos/${fila.dataset.compra}`, { cuotas: v, cuota_valor: null }); aviso('Cuotas actualizadas'); } catch (err) { aviso(err.message, true); return; }
    } else {
      if (!Number.isFinite(v) || v < 0) { aviso('Revisa el valor.', true); return; }
      try { await api.put(`/movimientos/${fila.dataset.compra}`, { [campo]: v }); aviso('Guardado'); } catch (err) { aviso(err.message, true); return; }
    }
    await cargar();
    abrirDetalle(estado.datos.deudas.find((y) => y.id === x.id));
  });
  dlg.onclick = async (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.usarCuota) {
      try { await api.put(`/deudas/${x.id}`, { cuota: Math.round(Number(b.dataset.usarCuota)) }); await cargar(); aviso('Cuota actualizada'); abrirDetalle(estado.datos.deudas.find((y) => y.id === x.id)); } catch (err) { aviso(err.message, true); }
    }
    if (b.dataset.editarDet !== undefined) abrirDialogo((dl) => { dl.classList.remove('ancho'); formDeuda(dl, x); });
    if (b.dataset.pagarDet !== undefined) abrirDialogo((dl) => { dl.classList.remove('ancho'); formPago(dl, x, rt); });
    if (b.dataset.compraNueva !== undefined) {
      const { formMovimiento } = await import('./movimientos.js');
      abrirDialogo((dl) => { dl.classList.remove('ancho'); formMovimiento(dl, { tipo: 'gasto', deuda_id: x.id }); });
    }
  };
}
