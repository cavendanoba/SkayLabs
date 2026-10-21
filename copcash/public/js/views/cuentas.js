import { api } from '../api.js';
import { h, pesos, pct, aviso, abrirDialogo, cerrarDialogo, confirmar, numero, hoyISO, mascaraPesos, PALETA, selectorColor, conectarColor, colorElegido, fechaCorta } from '../ui.js';
import { estado, cargar } from '../estado.js';
import { saldoAhorro } from '../motor.js';

const TIPOS_CUENTA = { ahorros: 'Cuenta de ahorros', corriente: 'Cuenta corriente', billetera: 'Billetera digital', efectivo: 'Efectivo', otra: 'Otra' };
const TIPOS_AHORRO = { pension: 'Pensión', cesantias: 'Cesantías', cooperativa: 'Cooperativa / fondo', otro: 'Otro ahorro' };
const colorDe = (x, i) => x.color || PALETA[(Number(x.id) || i) % PALETA.length];

function refrescar() { return cargar().then(() => window.dispatchEvent(new Event('copcash:cambio'))); }

export async function vistaCuentas(raiz) {
  const d = estado.datos;
  const p = d.perfil;
  const cuentas = d.cuentas || [];
  const ahorros = (d.ahorros || []).map((a) => ({ ...a, ...saldoAhorro(a, p, d.hoy, d.aportes || []) }));
  const disponible = cuentas.filter((c) => c.activa).reduce((s, c) => s + c.saldo, 0);
  // Pensión y cesantías no se pueden usar: van aparte del ahorro disponible
  const esFondo = (a) => a.tipo === 'pension' || a.tipo === 'cesantias';
  const libres = ahorros.filter((a) => !esFondo(a));
  const fondos = ahorros.filter(esFondo);
  const suma = (l, f) => l.filter((a) => a.activa).reduce((s, a) => s + f(a), 0);
  const totalAhorro = suma(libres, (a) => a.saldo);
  const ahorroAlAnio = suma(libres, (a) => a.porPago * 12);
  const totalFondos = suma(fondos, (a) => a.saldo);
  const fondosAlAnio = suma(fondos, (a) => a.porPago * 12);

  raiz.innerHTML = h`
    <header class="cabecera">
      <div><h1>Cuentas</h1><p class="sub">Tu plata disponible y lo que vas guardando.</p></div>
      <button class="primario" data-nueva-cuenta>Agregar cuenta</button>
    </header>
    <div class="pila">
      <section class="banda banda-ahorro">
        <div class="banda-arriba"><p class="banda-periodo">Ahorros</p><button class="boton-claro" data-nuevo-ahorro>+ Agregar ahorro</button></div>
        <div class="banda-cuerpo">
          <div class="banda-principal">
            <p class="banda-etq">Llevas ahorrado</p>
            <p class="banda-cifra">${pesos(totalAhorro)}</p>
            <p class="banda-sub">${ahorroAlAnio > 0 ? `Con lo que aportas cada pago, en un año serán ${pesos(totalAhorro + ahorroAlAnio)}.` : 'Registra tus aportes para ver cuánto llevas.'}</p>
          </div>
          <dl class="banda-datos">
            <div><dt>Ahorras cada pago</dt><dd>${pesos(ahorroAlAnio / 12)}</dd></div>
            <div><dt>Disponible en cuentas</dt><dd>${pesos(disponible)}</dd></div>
          </dl>
        </div>
      </section>
      ${libres.length ? h`<div class="deudas-rejilla">${libres.map((a, i) => tarjetaAhorro(a, i, d))}</div>`
        : h`<div class="bloque vacio"><p>Aquí va lo que guardas y puedes usar: el ahorro del FEC, una cuenta de ahorro programado, una alcancía…</p></div>`}


      <section class="pila">
        <div class="bloque-cab" style="margin:8px 0 0"><h2 style="margin:0">Cuentas</h2><span class="suave">Disponible: <strong class="${disponible < 0 ? 'neg' : ''}">${pesos(disponible)}</strong></span></div>
      ${cuentas.length ? h`<div class="deudas-rejilla">${cuentas.map((c, i) => h`
        <article class="deuda ${c.activa ? '' : 'inactiva'}" style="--c:${colorDe(c, i)}">
          <div class="deuda-cara">
            <div class="deuda-top"><h3>${c.nombre}</h3><span>${c.entidad || TIPOS_CUENTA[c.tipo]}</span></div>
            <div><span class="deuda-etq">Saldo</span><span class="deuda-saldo">${pesos(c.saldo)}</span></div>
          </div>
          <div class="deuda-cuerpo">
            <p class="chico suave">${TIPOS_CUENTA[c.tipo]}${c.activa ? '' : ' · desactivada'}</p>
            <div class="deuda-pie">
              <span class="deuda-acciones" style="margin-left:0">
                ${c.activa ? h`<button class="sutil" data-agregar-dinero="${c.id}">Agregar dinero</button>` : ''}
                <button class="sutil" data-ajustar="${c.id}">Ajustar saldo</button>
              </span>
              <span class="deuda-acciones">
                <button class="sutil" data-activar="${c.id}">${c.activa ? 'Desactivar' : 'Activar'}</button>
                <button class="sutil" data-editar-cuenta="${c.id}">Editar</button>
              </span>
            </div>
          </div>
        </article>`)}</div>` : h`<div class="bloque vacio"><p>Agrega tu cuenta de nómina y tu efectivo para que los gastos descuenten de ahí.</p></div>`}

      </section>

      ${fondos.length ? h`<section class="bloque fondos">
        <div class="bloque-cab">
          <div><h2>Pensión y cesantías</h2><p class="sub">No los puedes usar ahora, pero son tuyos y crecen solos con cada pago.</p></div>
        </div>
        <dl class="fondos-cifras">
          <div><dt>Tienes acumulado</dt><dd>${pesos(totalFondos)}</dd></div>
          <div><dt>Entra al año</dt><dd>${pesos(fondosAlAnio)}</dd></div>
          <div><dt>En 5 años tendrás</dt><dd>${pesos(totalFondos + fondosAlAnio * 5)}</dd></div>
        </dl>
        <p class="chico suave">Sin contar rendimientos del fondo ni aumentos de salario.</p>
        <div class="deudas-rejilla">${fondos.map((a, i) => tarjetaAhorro(a, i + libres.length, d))}</div>
      </section>` : ''}
    </div>`;

  raiz.onclick = async (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    const cuenta = (id) => cuentas.find((c) => String(c.id) === id);
    const ahorro = (id) => d.ahorros.find((a) => String(a.id) === id);
    if (b.dataset.nuevaCuenta !== undefined) abrirDialogo((dlg) => formCuenta(dlg, {}));
    if (b.dataset.editarCuenta) abrirDialogo((dlg) => formCuenta(dlg, cuenta(b.dataset.editarCuenta)));
    if (b.dataset.ajustar) abrirDialogo((dlg) => formAjuste(dlg, cuenta(b.dataset.ajustar)));
    if (b.dataset.agregarDinero) abrirDialogo((dlg) => formIngreso(dlg, cuenta(b.dataset.agregarDinero)));
    if (b.dataset.activar) {
      const c = cuenta(b.dataset.activar);
      try { await api.put(`/cuentas/${c.id}`, { activa: !c.activa }); aviso(c.activa ? 'Cuenta desactivada' : 'Cuenta activada'); await refrescar(); } catch (err) { aviso(err.message, true); }
    }
    if (b.dataset.nuevoAhorro !== undefined) abrirDialogo((dlg) => formAhorro(dlg, {}));
    if (b.dataset.editarAhorro) abrirDialogo((dlg) => formAhorro(dlg, ahorro(b.dataset.editarAhorro)));
    if (b.dataset.aporte) abrirDialogo((dlg) => formAporte(dlg, ahorro(b.dataset.aporte)));
    if (b.dataset.borrarAporte) {
      if (!(await confirmar('¿Borrar este aporte?'))) return;
      try { await api.del(`/aportes/${b.dataset.borrarAporte}`); aviso('Aporte borrado'); await refrescar(); } catch (err) { aviso(err.message, true); }
    }
  };
}

function tarjetaAhorro(a, i, d) {
  const aportes = (d.aportes || []).filter((x) => x.ahorro_id === a.id).slice(0, 3);
  const enUnAnio = a.saldo + a.porPago * 12;
  const progreso = a.meta ? Math.min(100, Math.round((a.saldo / a.meta) * 100)) : null;
  const como = a.pct_salario != null && Number(a.pct_salario) > 0
    ? `${pct(a.pct_salario)} de tu básico cada pago`
    : a.descuento_nomina ? 'Se descuenta de tu nómina' : a.aporte_mensual > 0 ? 'Aporte fijo cada pago' : 'Aportes manuales';
  const nota = a.tipo === 'pension' ? 'Incluye tu 4 % y el 12 % que pone la empresa.'
    : a.tipo === 'cesantias' ? 'Se causan cada mes; la empresa las consigna al fondo en febrero.' : '';
  return h`<article class="deuda ${a.activa ? '' : 'inactiva'}" style="--c:${colorDe(a, i + 3)}">
    <div class="deuda-cara">
      <div class="deuda-top"><h3>${a.nombre}</h3><span>${a.entidad || TIPOS_AHORRO[a.tipo]}</span></div>
      <div><span class="deuda-etq">Llevas</span><span class="deuda-saldo">${pesos(a.saldo)}</span></div>
      ${progreso != null ? h`<div class="meta"><span style="width:${progreso}%"></span></div><span class="deuda-etq">${progreso} % de la meta de ${pesos(a.meta)}</span>`
        : h`<span class="deuda-etq">${a.porPago ? `+${pesos(a.porPago)} cada pago` : 'Sin aporte automático'}</span>`}
    </div>
    <div class="deuda-cuerpo">
      <dl class="deuda-datos">
        <div><dt>Cada pago</dt><dd>${pesos(a.porPago)}</dd></div>
        <div><dt>Al año</dt><dd>${pesos(a.porPago * 12)}</dd></div>
        <div><dt>En un año tendrás</dt><dd>${pesos(enUnAnio)}</dd></div>
      </dl>
      <p class="chico suave">${como}. ${nota}</p>
      ${aportes.length ? h`<ul class="lista compacta">${aportes.map((x) => h`<li><div class="txt"><strong>${x.monto < 0 ? 'Retiro' : 'Aporte'}${x.nota ? ` · ${x.nota}` : ''}</strong>
          <span class="chico suave">${fechaCorta(x.fecha)}</span></div><span class="monto ${x.monto < 0 ? 'neg' : 'pos'}">${x.monto < 0 ? '' : '+'}${pesos(x.monto)}</span>
          <button class="sutil" data-borrar-aporte="${x.id}" aria-label="Borrar aporte">✕</button></li>`)}</ul>` : ''}
      <div class="deuda-pie">
        ${a.descuento_nomina ? h`<span class="etiqueta nomina">Por nómina</span>` : ''}
        <span class="deuda-acciones"><button class="sutil" data-aporte="${a.id}">Agregar aporte</button><button class="sutil" data-editar-ahorro="${a.id}">Editar</button></span>
      </div>
    </div>
  </article>`;
}

function formCuenta(dlg, c) {
  const editando = !!c.id;
  dlg.innerHTML = h`<form novalidate>
    <h2>${editando ? `Editar ${c.nombre}` : 'Agregar cuenta'}</h2>
    <div class="fila-campos">
      <div class="campo"><label for="c-nombre">Nombre</label><input id="c-nombre" name="nombre" required maxlength="60" value="${c.nombre || ''}" placeholder="Ej.: Nequi" autofocus></div>
      <div class="campo"><label for="c-tipo">Tipo</label><select id="c-tipo" name="tipo">${Object.entries(TIPOS_CUENTA).map(([k, v]) => h`<option value="${k}" ${k === (c.tipo || 'ahorros') ? 'selected' : ''}>${v}</option>`)}</select></div>
    </div>
    <div class="fila-campos">
      <div class="campo"><label for="c-entidad">Banco o entidad</label><input id="c-entidad" name="entidad" maxlength="60" value="${c.entidad || ''}"></div>
      ${editando ? '' : h`<div class="campo"><label for="c-saldo">Saldo actual</label><input id="c-saldo" name="saldo" data-pesos inputmode="decimal" value="0"></div>`}
    </div>
    ${selectorColor(c.color || (editando ? null : PALETA[0]))}
    ${editando ? h`<div class="campo"><label class="check"><input type="checkbox" name="activa" ${c.activa ? 'checked' : ''}>Activa (aparece al registrar gastos)</label></div>` : ''}
    <div class="acciones">
      ${editando ? h`<button type="button" class="peligro izq" data-borrar>Borrar</button>` : ''}
      <button type="button" data-cerrar>Cancelar</button><button class="primario">${editando ? 'Guardar cambios' : 'Agregar cuenta'}</button>
    </div></form>`;
  const form = dlg.querySelector('form');
  mascaraPesos(form);
  conectarColor(form);
  form.onsubmit = async (e) => {
    e.preventDefault();
    const cuerpo = { nombre: form.nombre.value, tipo: form.tipo.value, entidad: form.entidad.value || null, color: colorElegido(form) };
    if (!editando) cuerpo.saldo = numero(form.saldo.value);
    else cuerpo.activa = form.activa.checked;
    try {
      if (editando) await api.put(`/cuentas/${c.id}`, cuerpo); else await api.post('/cuentas', cuerpo);
      cerrarDialogo(); aviso(editando ? 'Cuenta actualizada' : 'Cuenta agregada'); await refrescar();
    } catch (err) { aviso(err.message, true); }
  };
  dlg.querySelector('[data-borrar]')?.addEventListener('click', async () => {
    if (!(await confirmar(`¿Borrar ${c.nombre}? Los movimientos se conservan sin cuenta. Si solo no la usas, mejor desactívala.`))) return;
    try { await api.del(`/cuentas/${c.id}`); aviso('Cuenta borrada'); await refrescar(); } catch (err) { aviso(err.message, true); }
  });
}

function formAjuste(dlg, c) {
  dlg.innerHTML = h`<form novalidate>
    <h2>Ajustar saldo de ${c.nombre}</h2>
    <p class="chico suave" style="margin-bottom:12px">Escribe lo que ves hoy en tu banco. Esto corrige el saldo sin crear un movimiento.</p>
    <div class="campo"><label for="a-saldo">Saldo real</label><input id="a-saldo" class="monto-grande" name="saldo" data-pesos inputmode="decimal" value="${c.saldo}" autofocus></div>
    <div class="acciones"><button type="button" data-cerrar>Cancelar</button><button class="primario">Guardar saldo</button></div></form>`;
  const form = dlg.querySelector('form');
  mascaraPesos(form);
  form.onsubmit = async (e) => {
    e.preventDefault();
    try { await api.put(`/cuentas/${c.id}`, { saldo: numero(form.saldo.value) }); cerrarDialogo(); aviso('Saldo actualizado'); await refrescar(); } catch (err) { aviso(err.message, true); }
  };
}

function formIngreso(dlg, c) {
  dlg.innerHTML = h`<form novalidate>
    <h2>Agregar dinero a ${c.nombre}</h2>
    <p class="chico suave" style="margin-bottom:12px">Queda como un ingreso en tus movimientos y sube el saldo.</p>
    <div class="campo"><label for="i-monto">Valor</label><input id="i-monto" class="monto-grande" name="monto" data-pesos inputmode="decimal" autofocus></div>
    <div class="fila-campos">
      <div class="campo"><label for="i-desc">De dónde viene</label><input id="i-desc" name="descripcion" maxlength="200" placeholder="Ej.: Salario, venta kits"></div>
      <div class="campo"><label for="i-fecha">Fecha</label><input id="i-fecha" type="date" name="fecha" value="${hoyISO()}"></div>
    </div>
    <div class="acciones"><button type="button" data-cerrar>Cancelar</button><button class="primario">Agregar dinero</button></div></form>`;
  const form = dlg.querySelector('form');
  mascaraPesos(form);
  form.onsubmit = async (e) => {
    e.preventDefault();
    const monto = numero(form.monto.value);
    if (!(monto > 0)) { aviso('Escribe un valor mayor que cero.', true); return; }
    try {
      await api.post('/movimientos', { tipo: 'ingreso', monto, fecha: form.fecha.value, descripcion: form.descripcion.value || null, cuenta_id: c.id });
      cerrarDialogo(); aviso('Dinero agregado'); await refrescar();
    } catch (err) { aviso(err.message, true); }
  };
}

function formAhorro(dlg, a) {
  const editando = !!a.id;
  const porPct = a.pct_salario != null && Number(a.pct_salario) > 0;
  dlg.innerHTML = h`<form novalidate>
    <h2>${editando ? `Editar ${a.nombre}` : 'Agregar ahorro'}</h2>
    <div class="fila-campos">
      <div class="campo"><label for="h-nombre">Nombre</label><input id="h-nombre" name="nombre" required maxlength="60" value="${a.nombre || ''}" autofocus></div>
      <div class="campo"><label for="h-tipo">Tipo</label><select id="h-tipo" name="tipo">${Object.entries(TIPOS_AHORRO).map(([k, v]) => h`<option value="${k}" ${k === (a.tipo || 'cooperativa') ? 'selected' : ''}>${v}</option>`)}</select></div>
    </div>
    <div class="campo"><label for="h-entidad">Fondo o entidad</label><input id="h-entidad" name="entidad" maxlength="60" value="${a.entidad || ''}" placeholder="Ej.: Porvenir, FEC Colsubsidio"></div>
    <div class="fila-campos">
      <div class="campo"><label for="h-saldo">Saldo a la fecha</label><input id="h-saldo" name="saldo_inicial" data-pesos inputmode="decimal" value="${a.saldo_inicial ?? 0}">
        <p class="ayuda">Lo que dice tu extracto. Desde esa fecha se suman los aportes solos.</p></div>
      <div class="campo"><label for="h-fecha">Fecha de ese saldo</label><input id="h-fecha" type="date" name="fecha_inicial" value="${a.fecha_inicial ? String(a.fecha_inicial).slice(0, 10) : hoyISO()}"></div>
    </div>
    <div class="campo chips" role="radiogroup" aria-label="Cómo se aporta">
      <label><input type="radio" name="modo" value="fijo" ${porPct ? '' : 'checked'}><span>Valor fijo cada pago</span></label>
      <label><input type="radio" name="modo" value="pct" ${porPct ? 'checked' : ''}><span>Porcentaje del básico</span></label>
    </div>
    <div class="fila-campos">
      <div class="campo" data-modo="fijo"><label for="h-aporte">Aporte cada pago</label><input id="h-aporte" name="aporte_mensual" data-pesos inputmode="decimal" value="${a.aporte_mensual || 0}"></div>
      <div class="campo" data-modo="pct"><label for="h-pct">Porcentaje del básico (%)</label><input id="h-pct" name="pct" inputmode="decimal" value="${porPct ? String(+(a.pct_salario * 100).toFixed(2)).replace('.', ',') : ''}">
        <p class="ayuda">Pensión: 16. Cesantías: 8,33 (un salario al año).</p></div>
      <div class="campo"><label for="h-meta">Meta (opcional)</label><input id="h-meta" name="meta" data-pesos inputmode="decimal" value="${a.meta || ''}"></div>
    </div>
    <div class="campo"><label class="check"><input type="checkbox" name="descuento_nomina" ${a.descuento_nomina ? 'checked' : ''}>Se descuenta de mi nómina</label>
      <p class="ayuda">Márcalo para aportes como el FEC: bajan lo que te consignan. No lo marques en pensión (ya está en los descuentos de ley).</p></div>
    ${selectorColor(a.color || (editando ? null : PALETA[5]))}
    ${editando ? h`<div class="campo"><label class="check"><input type="checkbox" name="activa" ${a.activa ? 'checked' : ''}>Activo</label></div>` : ''}
    <div class="acciones">
      ${editando ? h`<button type="button" class="peligro izq" data-borrar>Borrar</button>` : ''}
      <button type="button" data-cerrar>Cancelar</button><button class="primario">${editando ? 'Guardar cambios' : 'Agregar ahorro'}</button>
    </div></form>`;
  const form = dlg.querySelector('form');
  mascaraPesos(form);
  conectarColor(form);
  const sync = () => form.querySelectorAll('[data-modo]').forEach((el) => { el.hidden = el.dataset.modo !== form.modo.value; });
  form.addEventListener('change', sync);
  sync();
  form.onsubmit = async (e) => {
    e.preventDefault();
    const pctVal = form.modo.value === 'pct' ? numero(form.pct.value) / 100 : null;
    const cuerpo = {
      nombre: form.nombre.value, tipo: form.tipo.value, entidad: form.entidad.value || null,
      saldo_inicial: numero(form.saldo_inicial.value), fecha_inicial: form.fecha_inicial.value,
      aporte_mensual: form.modo.value === 'fijo' ? numero(form.aporte_mensual.value) : 0,
      pct_salario: pctVal || null,
      meta: form.meta.value ? numero(form.meta.value) : null,
      descuento_nomina: form.descuento_nomina.checked,
      color: colorElegido(form),
    };
    if (editando) cuerpo.activa = form.activa.checked;
    try {
      if (editando) await api.put(`/ahorros/${a.id}`, cuerpo); else await api.post('/ahorros', cuerpo);
      cerrarDialogo(); aviso(editando ? 'Ahorro actualizado' : 'Ahorro agregado'); await refrescar();
    } catch (err) { aviso(err.message, true); }
  };
  dlg.querySelector('[data-borrar]')?.addEventListener('click', async () => {
    if (!(await confirmar(`¿Borrar ${a.nombre} y sus aportes?`))) return;
    try { await api.del(`/ahorros/${a.id}`); aviso('Ahorro borrado'); await refrescar(); } catch (err) { aviso(err.message, true); }
  });
}

function formAporte(dlg, a) {
  const d = estado.datos;
  dlg.innerHTML = h`<form novalidate>
    <h2>${a.nombre}</h2>
    <div class="campo chips" role="radiogroup" aria-label="Tipo">
      <label><input type="radio" name="sentido" value="1" checked><span>Aporte</span></label>
      <label><input type="radio" name="sentido" value="-1"><span>Retiro</span></label>
    </div>
    <div class="campo"><label for="ap-monto">Valor</label><input id="ap-monto" class="monto-grande" name="monto" data-pesos inputmode="decimal" autofocus></div>
    <div class="fila-campos">
      <div class="campo"><label for="ap-cuenta">Desde / hacia la cuenta</label><select id="ap-cuenta" name="cuenta_id">
        <option value="">Ninguna</option>${(d.cuentas || []).filter((c) => c.activa).map((c) => h`<option value="${c.id}">${c.nombre} (${pesos(c.saldo)})</option>`)}</select>
        <p class="ayuda">Si eliges una, también mueve su saldo.</p></div>
      <div class="campo"><label for="ap-fecha">Fecha</label><input id="ap-fecha" type="date" name="fecha" value="${hoyISO()}"></div>
    </div>
    <div class="campo"><label for="ap-nota">Nota</label><input id="ap-nota" name="nota" maxlength="200" placeholder="Opcional"></div>
    <div class="acciones"><button type="button" data-cerrar>Cancelar</button><button class="primario">Guardar</button></div></form>`;
  const form = dlg.querySelector('form');
  mascaraPesos(form);
  form.onsubmit = async (e) => {
    e.preventDefault();
    const monto = numero(form.monto.value) * Number(form.sentido.value);
    if (!monto) { aviso('Escribe un valor.', true); return; }
    try {
      await api.post(`/ahorros/${a.id}/aportes`, { monto, fecha: form.fecha.value, cuenta_id: Number(form.cuenta_id.value) || null, nota: form.nota.value || null });
      cerrarDialogo(); aviso(monto > 0 ? 'Aporte guardado' : 'Retiro guardado'); await refrescar();
    } catch (err) { aviso(err.message, true); }
  };
}

