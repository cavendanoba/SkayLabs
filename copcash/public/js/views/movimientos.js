import { api } from '../api.js';
import { h, pesos, diaMes, fechaCorta, hoyISO, aviso, abrirDialogo, cerrarDialogo, confirmar, numero, mascaraPesos } from '../ui.js';
import { estado, cargar, periodoActual, diaPago, opcionesMedio, leerMedio } from '../estado.js';
import { rangoPeriodo, sumarMeses } from '../motor.js';

const TIPOS = { gasto: 'Gasto', ingreso: 'Ingreso', pago_deuda: 'Pago de deuda' };

/** Con qué se pagó un movimiento: tarjeta, crédito, efectivo o plata disponible en una cuenta. */
export function medioDe(m) {
  if (m.tipo === 'gasto' && m.deuda_id) {
    return m.deuda_tipo === 'tarjeta' ? { tipo: 'tarjeta', etq: 'Tarjeta', nombre: m.deuda } : { tipo: 'credito', etq: 'Crédito', nombre: m.deuda };
  }
  if (m.cuenta_id) return m.cuenta_tipo === 'efectivo' ? { tipo: 'efectivo', etq: 'Efectivo', nombre: m.cuenta } : { tipo: 'disponible', etq: 'Disponible', nombre: m.cuenta };
  return { tipo: 'ninguno', etq: 'Sin medio', nombre: null };
}

export function filaMovimiento(m) {
  const signo = m.tipo === 'ingreso' ? '+' : '';
  const titulo = m.descripcion || m.categoria || TIPOS[m.tipo];
  const medio = medioDe(m);
  const detalle = [m.tipo === 'gasto' ? m.categoria : m.tipo === 'pago_deuda' ? `Pago ${m.deuda || ''}`.trim() : TIPOS[m.tipo]].filter(Boolean).join(' · ');
  const deMedio = m.tipo === 'ingreso' ? 'Entra a' : '';
  return h`<li>
    <button class="fila" data-mov="${m.id}" aria-label="${`Editar ${titulo}`}">
      <span class="ic" aria-hidden="true">${m.tipo === 'gasto' ? (m.icono || '•') : m.tipo === 'ingreso' ? '＋' : '◫'}</span>
      <span class="txt"><strong>${titulo}</strong>
        <span class="chico suave">${detalle}${m.cuotas > 1 ? ` · ${m.cuotas} cuotas` : ''}</span>
        <span class="medio-pill ${medio.tipo}">${deMedio ? `${deMedio} ` : ''}${medio.nombre && medio.nombre !== medio.etq ? `${medio.nombre} · ` : ''}${medio.etq}</span>
</span>
      <span class="monto ${m.tipo === 'ingreso' ? 'pos' : ''}">${signo}${pesos(m.monto)}</span>
    </button></li>`;
}

export function editarMovimiento(m) {
  if (!m) return;
  abrirDialogo((dlg) => formMovimiento(dlg, m));
}

/** Formulario de gasto/ingreso/pago. `m.id` presente = edición. */
export function formMovimiento(dlg, m = {}) {
  const d = estado.datos;
  const tipo = m.tipo || 'gasto';
  const { cuentas, tarjetas } = opcionesMedio({ cuentaId: m.cuenta_id, deudaId: m.deuda_id });
  // Medio actual: en un gasto con tarjeta, deuda_id es la tarjeta; si no, la cuenta
  const medioActual = m.tipo === 'gasto' && m.deuda_id ? `t:${m.deuda_id}` : m.cuenta_id ? `c:${m.cuenta_id}` : (cuentas[0] ? `c:${cuentas[0].id}` : '');
  const cats = d.categorias.filter((c) => c.activa || c.id === m.categoria_id);
  const editando = !!m.id;

  dlg.innerHTML = h`<form method="dialog" id="f-mov" novalidate>
    <h2>${editando ? 'Editar movimiento' : tipo === 'gasto' ? 'Registrar gasto' : 'Registrar movimiento'}</h2>
    <div class="campo chips" role="radiogroup" aria-label="Tipo">
      ${Object.entries(TIPOS).map(([k, v]) => h`<label><input type="radio" name="tipo" value="${k}" ${k === tipo ? 'checked' : ''}><span>${v}</span></label>`)}
    </div>
    <div class="campo"><label for="m-monto">Valor</label>
      <input id="m-monto" class="monto-grande" name="monto" inputmode="decimal" data-pesos autocomplete="off" required value="${m.monto ?? ''}" autofocus></div>
    <div class="campo" data-solo="gasto"><span class="chico" style="font-weight:600;display:block;margin-bottom:6px">Categoría</span>
      <div class="chips">${cats.map((c, i) => h`<label><input type="radio" name="categoria_id" value="${c.id}" ${(m.categoria_id ? c.id === m.categoria_id : i === 0) ? 'checked' : ''}><span>${c.icono} ${c.nombre}</span></label>`)}</div></div>
    <div class="campo" data-solo="pago_deuda"><label for="m-deuda">Deuda que pagas</label>
      <select id="m-deuda" name="deuda_id">${d.deudas.filter((x) => x.activa).map((x) => h`<option value="${x.id}" ${x.id === m.deuda_id ? 'selected' : ''}>${x.nombre}</option>`)}</select></div>
    <div class="fila-campos">
      <div class="campo"><label for="m-medio" id="m-medio-etq">Pagado con</label>
        <select id="m-medio" name="medio">
          <option value="">Sin especificar</option>
          <optgroup label="Cuentas">${cuentas.map((x) => h`<option value="c:${x.id}" ${`c:${x.id}` === medioActual ? 'selected' : ''}>${x.nombre}</option>`)}</optgroup>
          ${tarjetas.length ? h`<optgroup label="Tarjetas de crédito" data-tarjetas>${tarjetas.map((x) => h`<option value="t:${x.id}" ${`t:${x.id}` === medioActual ? 'selected' : ''}>${x.nombre}</option>`)}</optgroup>` : ''}
        </select></div>
      <div class="campo"><label for="m-fecha">Fecha</label><input id="m-fecha" type="date" name="fecha" value="${m.fecha || hoyISO()}" required></div>
    </div>
    <div class="campo"><label for="m-desc">Descripción</label><input id="m-desc" name="descripcion" maxlength="200" value="${m.descripcion || ''}" placeholder="Opcional: dónde o qué"></div>
    <div class="fila-campos">
      <div class="campo" data-cuotas><label for="m-cuotas">Cuotas</label><input id="m-cuotas" type="number" name="cuotas" min="1" max="72" value="${m.cuotas || 1}"></div>
      <div class="campo" data-cuotas><label for="m-cuota-valor">Valor de cada cuota</label><input id="m-cuota-valor" name="cuota_valor" data-pesos inputmode="decimal" value="${m.cuota_valor != null ? Math.round(m.cuota_valor) : ''}" placeholder="Automático"><p class="ayuda">Si el banco cobra intereses, pon el valor del extracto.</p></div>
    </div>
    ${!editando ? h`<div class="campo" data-cuotas><label class="check"><input type="checkbox" name="ya_en_saldo">Es una compra anterior: ya está incluida en el saldo de la tarjeta</label></div>` : ''}
    <div class="fila-campos" data-pagadas hidden>
      <div class="campo"><label for="m-pagadas">Cuotas ya pagadas</label><input id="m-pagadas" type="number" name="cuotas_pagadas" min="0" max="72" value="${m.cuotas_pagadas || 0}"></div>
    </div>
    <div class="acciones">
      ${editando ? h`<button type="button" class="peligro izq" data-borrar>Borrar</button>` : ''}
      <button type="button" data-cerrar>Cancelar</button>
      <button class="primario" type="submit">${editando ? 'Guardar cambios' : 'Guardar'}</button>
    </div>
  </form>`;

  const form = dlg.querySelector('#f-mov');
  mascaraPesos(form);
  const sync = () => {
    const t = form.tipo.value;
    form.querySelectorAll('[data-solo]').forEach((el) => { el.hidden = el.dataset.solo !== t; });
    const conTarjeta = form.medio.value.startsWith('t:');
    form.querySelectorAll('[data-cuotas]').forEach((el) => { el.hidden = !(t === 'gasto' && conTarjeta); });
    // Las cuotas ya pagadas solo aplican a compras viejas o al editar
    form.querySelector('[data-pagadas]').hidden = !(t === 'gasto' && conTarjeta && (editando || form.ya_en_saldo?.checked));
    // Ingresos entran a una cuenta y los pagos salen de una cuenta: sin tarjetas
    const grupoT = form.querySelector('[data-tarjetas]');
    if (grupoT) grupoT.hidden = grupoT.disabled = t !== 'gasto';
    if (t !== 'gasto' && conTarjeta) form.medio.value = '';
    form.querySelector('#m-medio-etq').textContent = t === 'ingreso' ? 'Entra a' : t === 'pago_deuda' ? 'Pagas desde' : 'Pagado con';
  };
  form.addEventListener('change', sync);
  sync();

  form.onsubmit = async (e) => {
    e.preventDefault();
    const t = form.tipo.value;
    const monto = numero(form.monto.value);
    if (!(monto > 0)) { aviso('Escribe un valor mayor que cero.', true); form.monto.focus(); return; }
    const cuerpo = {
      tipo: t,
      monto,
      fecha: form.fecha.value,
      descripcion: form.descripcion.value || null,
      cuenta_id: leerMedio(form.medio.value).cuenta_id,
      categoria_id: t === 'gasto' ? Number(form.categoria_id.value) : null,
      deuda_id: t === 'pago_deuda' ? Number(form.deuda_id.value) : t === 'gasto' ? leerMedio(form.medio.value).deuda_id : null,
      cuotas: t === 'gasto' && !form.querySelector('[data-cuotas]').hidden ? Number(form.cuotas.value || 1) : 1,
      cuota_valor: t === 'gasto' && !form.querySelector('[data-cuotas]').hidden && numero(form.cuota_valor.value) > 0 ? numero(form.cuota_valor.value) : null,
      cuotas_pagadas: !form.querySelector('[data-pagadas]').hidden ? Number(form.cuotas_pagadas.value || 0) : 0,
      ya_en_saldo: !editando && !form.querySelector('[data-cuotas]').hidden && form.ya_en_saldo.checked,
    };
    try {
      if (editando) await api.put(`/movimientos/${m.id}`, cuerpo); else await api.post('/movimientos', cuerpo);
      cerrarDialogo();
      aviso(editando ? 'Cambios guardados' : `${TIPOS[t]} guardado`);
      await cargar();
      window.dispatchEvent(new Event('copcash:cambio'));
    } catch (err) { aviso(err.message, true); }
  };

  dlg.querySelector('[data-borrar]')?.addEventListener('click', async () => {
    if (!(await confirmar(`¿Borrar ${m.descripcion || 'este movimiento'} por ${pesos(m.monto)}?`))) { abrirDialogo((x) => formMovimiento(x, m)); return; }
    try {
      await api.del(`/movimientos/${m.id}`);
      aviso('Movimiento borrado');
      await cargar();
      window.dispatchEvent(new Event('copcash:cambio'));
    } catch (err) { aviso(err.message, true); }
  });
}
