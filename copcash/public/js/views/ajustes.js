import { api, sesion } from '../api.js';
import { h, pesos, aviso, numero, confirmar, mascaraPesos, diaMes } from '../ui.js';
import { calcularNomina, aporteAhorro, periodoDeFecha, rangoPeriodo } from '../motor.js';
import { estado, cargar, proyeccion } from '../estado.js';

const SECCIONES = { nomina: 'Nómina', gastos: 'Gastos fijos y variables', cuenta: 'Cuenta y apariencia' };

export async function vistaAjustes(raiz, [seccion = 'nomina'] = []) {
  if (!SECCIONES[seccion]) seccion = 'nomina';
  const d = estado.datos;

  raiz.innerHTML = h`
    <header class="cabecera"><div><h1>Ajustes</h1><p class="sub">${d.usuario.email}</p></div></header>
    <nav class="pestanas" aria-label="Secciones de ajustes">
      ${Object.entries(SECCIONES).map(([k, v]) => h`<a href="#/ajustes/${k}" aria-current="${k === seccion ? 'page' : 'false'}">${v}</a>`)}
    </nav>
    <div id="ajustes-cuerpo"></div>`;
  const cuerpo = raiz.querySelector('#ajustes-cuerpo');
  if (seccion === 'nomina') seccionNomina(raiz, cuerpo);
  if (seccion === 'gastos') seccionGastos(raiz, cuerpo);
  if (seccion === 'cuenta') seccionCuenta(raiz, cuerpo);
}

// ───────────── nómina ─────────────

function seccionNomina(raiz, cuerpo) {
  const d = estado.datos;
  const p = d.perfil;
  const pctTxt = (v) => String(+(v * 100).toFixed(2)).replace('.', ',');
  cuerpo.innerHTML = h`
    <form id="f-perfil" novalidate class="rejilla dos">
      <div class="pila">
        <section class="bloque">
          <h2>Tu salario</h2>
          <p class="chico suave" style="margin-bottom:12px">Con el salario básico se calcula todo lo demás: lo que te descuentan, lo que entra a pensión y cesantías y las primas.</p>
          <div class="fila-campos">
            <div class="campo"><label for="a-nombre">Tu nombre</label><input id="a-nombre" name="nombre" value="${d.usuario.nombre || ''}" maxlength="80"></div>
            <div class="campo"><label for="a-dia">Día de pago</label><input id="a-dia" name="dia_pago" type="number" min="1" max="28" value="${p.dia_pago}"><p class="ayuda">El día que te consignan el salario.</p></div>
          </div>
          <div class="fila-campos">
            <div class="campo"><label for="a-corte">Día de corte</label><input id="a-corte" name="dia_corte" type="number" min="1" max="28" value="${p.dia_corte ?? p.dia_pago}">
              <p class="ayuda">Aquí se cierran los gastos del mes. Cada periodo va de este día al día anterior del mes siguiente.</p></div>
            <div class="campo"><span class="chico" style="font-weight:600;display:block;margin-bottom:6px">Tu periodo actual</span><p class="periodo-ejemplo" id="periodo-ejemplo"></p></div>
          </div>
          <div class="fila-campos">
            <div class="campo"><label for="a-bruto">Salario básico</label><input id="a-bruto" name="salario_bruto" data-pesos inputmode="decimal" value="${p.salario_bruto}"></div>
            <div class="campo"><label for="a-aux">Auxilios fijos</label><input id="a-aux" name="auxilios" data-pesos inputmode="decimal" value="${p.auxilios || 0}"><p class="ayuda">Lo que te pagan aparte del básico.</p></div>
          </div>
          <div class="fila-campos">
            <div class="campo"><label for="a-otras">Otras deducciones</label><input id="a-otras" name="otras_deducciones" data-pesos inputmode="decimal" value="${p.otras_deducciones || 0}"><p class="ayuda">Pólizas u otros descuentos fijos.</p></div>
            <div class="campo"><label for="a-ret">Retención en la fuente</label><input id="a-ret" name="retencion" data-pesos inputmode="decimal" value="${p.retencion || 0}"></div>
          </div>
        </section>

        <section class="bloque">
          <h2>Primas y prestaciones</h2>
          <div class="fila-campos" style="margin-top:6px">
            <div class="campo"><label class="check"><input type="checkbox" name="prima_legal" ${p.prima_legal ? 'checked' : ''}>Recibo prima legal (junio y diciembre)</label></div>
            <div class="campo"><label class="check"><input type="checkbox" name="intereses_cesantias" ${p.intereses_cesantias ? 'checked' : ''}>Recibo intereses de cesantías (enero)</label></div>
          </div>
          <div class="campo" style="max-width:260px"><label for="a-extra">Prima extralegal de diciembre (% del básico)</label><input id="a-extra" name="prima_extralegal_pct" type="number" min="0" max="200" step="1" value="${Math.round(p.prima_extralegal_pct * 100)}"><p class="ayuda">0 si no tienes.</p></div>
          <details class="supuesto"><summary>Porcentajes de ley</summary><div class="contenido fila-campos">
            <div class="campo"><label for="a-salud">Salud (%)</label><input id="a-salud" name="pct_salud" inputmode="decimal" value="${pctTxt(p.pct_salud)}"></div>
            <div class="campo"><label for="a-pension">Pensión (%)</label><input id="a-pension" name="pct_pension" inputmode="decimal" value="${pctTxt(p.pct_pension)}"></div>
            <div class="campo"><label for="a-min">Salario mínimo</label><input id="a-min" name="salario_minimo" data-pesos inputmode="decimal" value="${p.salario_minimo}"><p class="ayuda">Desde 4 mínimos se descuenta el fondo de solidaridad.</p></div>
          </div></details>
        </section>
        <div class="acciones" style="margin-top:0"><button class="primario">Guardar nómina</button></div>
      </div>

      <div class="pila">
        <section class="bloque" id="desprendible"></section>
        <section class="bloque" id="prestaciones"></section>
      </div>
    </form>`;

  mascaraPesos(cuerpo);
  const f = cuerpo.querySelector('#f-perfil');
  const pintar = () => {
    const pf = { ...p, ...leerPerfil(f) };
    const corte = Math.min(28, Math.max(1, pf.dia_corte));
    const [ini, fin] = rangoPeriodo(periodoDeFecha(d.hoy, corte), corte);
    f.querySelector('#periodo-ejemplo').textContent = `Del ${diaMes(ini)} al ${diaMes(fin)}`;
    const n = calcularNomina(pf, { deudas: d.deudas, ahorros: d.ahorros || [] });
    const fila = (t, v, clase = '') => h`<tr class="${clase}"><td>${t}</td><td>${v < 0 ? `−${pesos(-v)}` : pesos(v)}</td></tr>`;
    f.querySelector('#desprendible').innerHTML = h`
      <h2>Así queda cada pago</h2>
      <div class="tabla-env" style="margin-top:10px"><table class="desprendible"><tbody>
        ${fila('Salario básico', n.bruto)}
        ${n.auxilios ? fila('Auxilios', n.auxilios) : ''}
        ${fila(`Salud (${pctTxt(pf.pct_salud)} %)`, -n.salud, 'det')}
        ${fila(`Pensión (${pctTxt(pf.pct_pension)} %)`, -n.pension, 'det')}
        ${n.fsp ? fila('Fondo de solidaridad', -n.fsp, 'det') : ''}
        ${n.retencion ? fila('Retención en la fuente', -n.retencion, 'det') : ''}
        ${n.otras ? fila('Otras deducciones', -n.otras, 'det') : ''}
        ${n.ahorrosNomina.map((x) => fila(`Ahorro: ${x.nombre}`, -x.monto, 'det'))}
        ${n.creditosNomina.map((x) => fila(`Crédito: ${x.nombre}`, -x.monto, 'det'))}
        ${fila('Te consignan', n.neto, 'total')}
      </tbody></table></div>
      <p class="chico suave" style="margin-top:8px">Los ahorros y créditos por nómina salen de <a href="#/cuentas">Cuentas</a> y <a href="#/deudas">Deudas</a>.</p>`;

    // Lo que el sistema calcula solo a partir del básico
    const pension = (d.ahorros || []).find((a) => a.tipo === 'pension' && a.activa);
    const cesantias = (d.ahorros || []).find((a) => a.tipo === 'cesantias' && a.activa);
    const alFondo = pension ? aporteAhorro(pension, pf) : n.bruto * 0.16;
    const cesMes = cesantias ? aporteAhorro(cesantias, pf) : n.bruto / 12;
    const prima = pf.prima_legal ? n.bruto / 2 : 0;
    const extra = n.bruto * pf.prima_extralegal_pct;
    const intereses = pf.intereses_cesantias ? n.bruto * 0.12 : 0;
    const año = [
      ['Enero', 'Intereses de cesantías', intereses, 'A tu cuenta'],
      ['Febrero', 'Cesantías del año', cesMes * 12, 'Al fondo, no las puedes usar'],
      ['Junio', 'Prima legal', prima, 'A tu cuenta'],
      ['Diciembre', 'Prima legal', prima, 'A tu cuenta'],
      ['Diciembre', 'Prima extralegal', extra, 'A tu cuenta'],
    ].filter((x) => x[2] > 0);
    const libre = año.filter((x) => x[3] === 'A tu cuenta').reduce((s, x) => s + x[2], 0);
    f.querySelector('#prestaciones').innerHTML = h`
      <h2>Lo que se calcula solo</h2>
      <dl class="fondos-cifras" style="margin:12px 0">
        <div><dt>A tu pensión cada mes</dt><dd>${pesos(alFondo)}</dd></div>
        <div><dt>Cesantías que se causan al mes</dt><dd>${pesos(cesMes)}</dd></div>
      </dl>
      <p class="chico suave">La pensión es el ${pctTxt(alFondo / (n.bruto || 1))} % del básico: tu ${pctTxt(pf.pct_pension)} % más lo que pone la empresa.</p>
      <h3 style="margin:16px 0 6px">En el año</h3>
      ${año.length ? h`<ul class="calendario-pagos">${año.map(([mes, que, v, dest]) => h`<li>
          <span class="cp-mes">${mes}</span><span class="cp-que"><strong>${que}</strong><span class="chico suave">${dest}</span></span><span class="cp-valor">${pesos(v)}</span></li>`)}</ul>
        <p class="chico" style="margin-top:8px">Extra que te llega al año: <strong>${pesos(libre)}</strong>.</p>`
        : h`<p class="chico suave">No recibes primas ni intereses con lo que marcaste.</p>`}`;
  };
  f.addEventListener('input', pintar);
  f.addEventListener('change', pintar);
  pintar();

  f.onsubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put('/usuario', { nombre: f.nombre.value });
      await api.put('/perfil', leerPerfil(f));
      await cargar(); aviso('Nómina guardada'); vistaAjustes(raiz, ['nomina']);
    } catch (err) { aviso(err.message, true); }
  };
}

function leerPerfil(f) {
  return {
    dia_pago: Number(f.dia_pago.value) || 20,
    dia_corte: Number(f.dia_corte.value) || Number(f.dia_pago.value) || 20,
    salario_bruto: numero(f.salario_bruto.value),
    auxilios: numero(f.auxilios.value),
    otras_deducciones: numero(f.otras_deducciones.value),
    retencion: numero(f.retencion.value),
    pct_salud: numero(f.pct_salud.value) / 100,
    pct_pension: numero(f.pct_pension.value) / 100,
    salario_minimo: numero(f.salario_minimo.value),
    prima_legal: f.prima_legal.checked,
    intereses_cesantias: f.intereses_cesantias.checked,
    prima_extralegal_pct: numero(f.prima_extralegal_pct.value) / 100,
  };
}

// ───────────── gastos fijos y variables ─────────────

function seccionGastos(raiz, cuerpo) {
  const d = estado.datos;
  const cats = d.categorias;
  const deCat = (id) => d.recurrentes.filter((g) => g.categoria_id === id);
  const sinCat = d.recurrentes.filter((g) => !g.categoria_id || !cats.some((c) => c.id === g.categoria_id));
  const sumaRec = (lista) => lista.filter((g) => g.activo).reduce((s, g) => s + Number(g.monto), 0);
  const fijas = cats.filter((c) => c.fija);
  const variables = cats.filter((c) => !c.fija);
  // Las cuotas de deudas también son gasto fijo (las de nómina ya salen de tu pago)
  const cuotas = proyeccion({ meses: 1 }).periodos[0]?.grupos.deudas || [];
  const totalCuotas = cuotas.reduce((s, c) => s + c.monto, 0);
  const totalFijo = fijas.reduce((s, c) => s + sumaRec(deCat(c.id)), 0) + sumaRec(sinCat) + totalCuotas;
  const totalVar = variables.reduce((s, c) => s + Number(c.presupuesto) + sumaRec(deCat(c.id)), 0);

  const filaGasto = (g) => h`
    <div class="gasto-fila ${g.activo ? '' : 'inactivo'}" data-fila="recurrentes" data-id="${g.id}">
      <input name="nombre" value="${g.nombre}" maxlength="80" aria-label="Nombre del gasto">
      <input name="monto" data-pesos inputmode="decimal" value="${g.monto}" aria-label="${`Valor de ${g.nombre}`}">
      <label class="check" title="Activo"><input type="checkbox" name="activo" ${g.activo ? 'checked' : ''}><span class="solo-movil">Activo</span></label>
      <select name="categoria_id" aria-label="${`Categoría de ${g.nombre}`}" class="gasto-cat">
        <option value="">Sin categoría</option>${cats.map((c) => h`<option value="${c.id}" ${c.id === g.categoria_id ? 'selected' : ''}>${c.icono} ${c.nombre}</option>`)}</select>
      <button type="button" class="peligro" data-borrar aria-label="${`Borrar ${g.nombre}`}">✕</button>
    </div>`;

  const cabCat = (c, extra) => h`
    <div class="cat-cab" data-fila="categorias" data-id="${c.id}">
      <input name="icono" value="${c.icono}" maxlength="8" aria-label="Ícono" class="cat-ico">
      <input name="nombre" value="${c.nombre}" maxlength="60" aria-label="Nombre de la categoría" class="cat-nombre">
      ${extra}
      <button type="button" class="sutil" data-mover="${c.id}" data-a="${c.fija ? 'false' : 'true'}" title="${c.fija ? 'Pasar a variables' : 'Pasar a fijos'}">${c.fija ? '→ Variable' : '← Fijo'}</button>
      <button type="button" class="peligro" data-borrar aria-label="${`Borrar ${c.nombre}`}">✕</button>
    </div>`;

  cuerpo.innerHTML = h`
    <p class="chico suave" style="margin:0 0 14px">Los <strong>fijos</strong> son lo que pagas igual cada periodo (arriendo, almuerzos, servicios). Los <strong>variables</strong> son tu gasto del día a día, con un presupuesto por categoría. Así se separan en Periodo y en la Proyección.</p>
    <div class="rejilla dos gastos-col">
      <section class="bloque">
        <div class="bloque-cab"><div><h2>Gastos fijos</h2><p class="chico suave">${pesos(totalFijo)} por periodo</p></div>
          <button class="sutil" data-nueva-cat="true">+ Categoría fija</button></div>
        ${cuotas.length ? h`<div class="cat-caja">
          <div class="cat-cab"><span class="cat-ico">💳</span><strong>Cuotas de deudas</strong><span class="cat-total">${pesos(totalCuotas)}</span></div>
          <ul class="cuotas-fijas">${cuotas.map((c) => h`<li><span>${c.nombre}</span><span>${pesos(c.monto)}</span></li>`)}</ul>
          <p class="chico suave" style="margin:6px 0 0 12px">Se cambian en <a href="#/deudas">Deudas</a>. Las que te descuentan por nómina no están aquí porque ya salen de tu pago.</p>
        </div>` : ''}
        ${fijas.map((c) => h`<div class="cat-caja">
          ${cabCat(c, h`<span class="cat-total">${pesos(sumaRec(deCat(c.id)))}</span>`)}
          <div class="gastos-lista">${deCat(c.id).map(filaGasto)}</div>
          <button type="button" class="sutil agregar-gasto" data-nuevo-gasto="${c.id}">+ Agregar gasto</button>
        </div>`)}
        ${sinCat.length ? h`<div class="cat-caja"><div class="cat-cab"><span class="cat-ico">•</span><strong>Sin categoría</strong><span class="cat-total">${pesos(sumaRec(sinCat))}</span></div>
          <div class="gastos-lista">${sinCat.map(filaGasto)}</div></div>` : ''}
        ${!fijas.length && !sinCat.length ? h`<p class="vacio">Pasa a fijos las categorías de lo que pagas igual cada mes.</p>` : ''}
      </section>

      <section class="bloque">
        <div class="bloque-cab"><div><h2>Gastos variables</h2><p class="chico suave">${pesos(totalVar)} de presupuesto por periodo</p></div>
          <button class="sutil" data-nueva-cat="false">+ Categoría variable</button></div>
        ${variables.map((c) => h`<div class="cat-caja">
          ${cabCat(c, h`<input name="presupuesto" data-pesos inputmode="decimal" value="${c.presupuesto}" aria-label="${`Presupuesto de ${c.nombre}`}" class="cat-presu">`)}
          ${deCat(c.id).length ? h`<p class="chico suave" style="margin:6px 0 2px">También entran cada periodo:</p>
            <div class="gastos-lista">${deCat(c.id).map(filaGasto)}</div>` : ''}
        </div>`)}
      </section>
    </div>`;

  mascaraPesos(cuerpo);
  const recargar = async () => { await cargar(); vistaAjustes(raiz, ['gastos']); };

  // Edición en línea: cada cambio guarda esa fila
  cuerpo.onchange = async (e) => {
    const fila = e.target.closest('[data-fila]');
    if (!fila || !e.target.name) return;
    const el = e.target;
    let v = el.type === 'checkbox' ? el.checked : el.value;
    if (el.dataset.pesos !== undefined) v = numero(v);
    if (el.name.endsWith('_id')) v = v ? Number(v) : null;
    try {
      await api.put(`/${fila.dataset.fila}/${fila.dataset.id}`, { [el.name]: v });
      aviso('Guardado');
      // lo que cambia totales o agrupación se vuelve a pintar
      if (['monto', 'activo', 'categoria_id', 'presupuesto'].includes(el.name)) await recargar(); else await cargar();
    } catch (err) { aviso(err.message, true); }
  };

  cuerpo.onclick = async (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    try {
      if (b.dataset.mover) { await api.put(`/categorias/${b.dataset.mover}`, { fija: b.dataset.a === 'true' }); aviso('Categoría movida'); await recargar(); return; }
      if (b.dataset.nuevaCat) {
        const fija = b.dataset.nuevaCat === 'true';
        await api.post('/categorias', { nombre: `Nueva categoría ${cats.length + 1}`, icono: '•', presupuesto: 0, fija, orden: cats.length });
        await recargar(); return;
      }
      if (b.dataset.nuevoGasto) {
        await api.post('/recurrentes', { nombre: 'Nuevo gasto fijo', monto: 0, categoria_id: Number(b.dataset.nuevoGasto), orden: d.recurrentes.length });
        await recargar(); return;
      }
      if (b.dataset.borrar !== undefined) {
        const fila = b.closest('[data-fila]');
        const nombre = fila.querySelector('[name="nombre"]').value;
        const esCat = fila.dataset.fila === 'categorias';
        const aviso2 = esCat && deCat(Number(fila.dataset.id)).length ? ' Sus gastos fijos quedan sin categoría.' : '';
        if (!(await confirmar(`¿Borrar “${nombre}”?${aviso2}`))) return;
        await api.del(`/${fila.dataset.fila}/${fila.dataset.id}`); aviso('Borrado'); await recargar();
      }
    } catch (err) { aviso(err.message, true); }
  };
}

// ───────────── cuenta y apariencia ─────────────

async function seccionCuenta(raiz, cuerpo) {
  let tema = '';
  try { tema = localStorage.getItem('copcash_tema') || ''; } catch { /* nada */ }
  let info = null;
  try { info = await api.get('/auth/sesion'); } catch { /* se muestra sin fechas */ }
  const fecha = (iso) => (iso ? new Date(iso).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' }) : '—');
  cuerpo.innerHTML = h`
    <div class="rejilla dos">
      <div class="pila">
        <section class="bloque">
          <h2>Sesión</h2>
          <dl class="fondos-cifras" style="margin:10px 0 14px">
            <div><dt>Cuenta</dt><dd style="font-size:1rem">${estado.datos.usuario.email}</dd></div>
            <div><dt>Último ingreso</dt><dd style="font-size:1rem">${fecha(info?.ultimo_ingreso)}</dd></div>
          </dl>
          <p class="chico suave" style="margin-bottom:12px">La sesión se mantiene abierta mientras uses la app y se cierra sola tras 14 días sin entrar.</p>
          <div class="acciones" style="justify-content:flex-start;margin:0">
            <button data-salir>Cerrar sesión aquí</button>
            <button class="peligro" data-salir-todo>Cerrar sesión en todos los dispositivos</button>
          </div>
        </section>
        <section class="bloque">
          <h2>Apariencia</h2>
          <div class="campo" style="max-width:240px;margin-top:10px"><label for="a-tema">Tema</label>
            <select id="a-tema"><option value="" ${!tema ? 'selected' : ''}>Como el sistema</option><option value="claro" ${tema === 'claro' ? 'selected' : ''}>Claro</option><option value="oscuro" ${tema === 'oscuro' ? 'selected' : ''}>Oscuro</option></select></div>
        </section>
      </div>
      <form class="bloque" id="f-clave" novalidate>
        <h2>Cambiar contraseña</h2>
        <p class="chico suave" style="margin:6px 0 12px">Al cambiarla se cierra la sesión en los demás dispositivos.</p>
        <input type="text" name="usuario" autocomplete="username" value="${estado.datos.usuario.email}" hidden>
        <div class="campo"><label for="c-actual">Contraseña actual</label><input id="c-actual" name="actual" type="password" autocomplete="current-password" required></div>
        <div class="campo"><label for="c-nueva">Contraseña nueva</label><input id="c-nueva" name="nueva" type="password" autocomplete="new-password" minlength="8" required><p class="ayuda">Mínimo 8 caracteres.</p></div>
        <div class="campo"><label for="c-repite">Repite la nueva</label><input id="c-repite" name="repite" type="password" autocomplete="new-password" required></div>
        <div class="acciones"><button class="primario">Cambiar contraseña</button></div>
      </form>
    </div>`;
  cuerpo.querySelector('#a-tema').onchange = (e) => {
    const v = e.target.value;
    if (v) document.documentElement.dataset.tema = v; else delete document.documentElement.dataset.tema;
    try { if (v) localStorage.setItem('copcash_tema', v); else localStorage.removeItem('copcash_tema'); } catch { /* nada */ }
  };
  cuerpo.querySelector('[data-salir]').onclick = () => sesion.salir();
  cuerpo.querySelector('[data-salir-todo]').onclick = async () => {
    if (!(await confirmar('Se cerrará la sesión en todos tus dispositivos, también en este. ¿Seguir?', 'Cerrar todas'))) return;
    try { await api.post('/auth/salir-todo'); } catch { /* igual salimos */ }
    sesion.salir();
  };
  const f = cuerpo.querySelector('#f-clave');
  f.onsubmit = async (e) => {
    e.preventDefault();
    if (f.nueva.value.length < 8) { aviso('La contraseña nueva debe tener al menos 8 caracteres.', true); return; }
    if (f.nueva.value !== f.repite.value) { aviso('Las contraseñas nuevas no coinciden.', true); return; }
    try {
      const r = await api.put('/auth/clave', { actual: f.actual.value, nueva: f.nueva.value });
      sesion.guardar(r.token);
      f.reset(); aviso('Contraseña cambiada. Los demás dispositivos deberán entrar de nuevo.');
    } catch (err) { aviso(err.message, true); }
  };
  void raiz;
}
