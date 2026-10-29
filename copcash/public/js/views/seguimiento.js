// Real vs plan: cómo va el gasto real del periodo frente a lo configurado, a dónde llegas si sigues
// a este ritmo y qué puedes ajustar. Todo sale de los movimientos registrados y de Ajustes.
import { api } from '../api.js';
import { h, pesos, diaMes } from '../ui.js';
import { estado, periodoActual, diaCorte, presupuestoPorCategoria, proyeccionDesdeHoy } from '../estado.js';
import { rangoPeriodo, sumarMeses, periodoDeFecha, nombreMes } from '../motor.js';
import { pista } from './pista.js';

const PERIODOS_ATRAS = 3;   // periodos cerrados que se miran para el promedio
const HORMIGA = 20000;      // un gasto por debajo de esto cuenta como "gasto hormiga"
const MESES = 12;

const pctTxt = (x) => `${Math.round(x * 100)} %`;
const fechaISO = (m) => String(m.fecha).slice(0, 10);
const promedio = (l) => (l.length ? l.reduce((s, x) => s + x, 0) / l.length : null);

export async function vistaSeguimiento(raiz) {
  const d = estado.datos;
  const corte = diaCorte();
  const actual = periodoActual();
  const claves = Array.from({ length: PERIODOS_ATRAS + 1 }, (_, i) => sumarMeses(actual, i - PERIODOS_ATRAS));
  const [desdeTodo] = rangoPeriodo(claves[0], corte);
  const [desde, hasta] = rangoPeriodo(actual, corte);
  const movs = await api.get(`/movimientos?desde=${desdeTodo}&hasta=${hasta}`);
  const gastos = movs.filter((m) => m.tipo === 'gasto');
  const movsActual = movs.filter((m) => fechaISO(m) >= desde);

  // ── días del periodo
  const hoy = new Date(`${d.hoy}T12:00:00`);
  const diasTotales = Math.round((new Date(`${hasta}T12:00:00`) - new Date(`${desde}T12:00:00`)) / 864e5) + 1;
  const diasPasados = Math.min(diasTotales, Math.max(1, Math.round((hoy - new Date(`${desde}T12:00:00`)) / 864e5) + 1));
  const diasRestantes = Math.max(1, diasTotales - diasPasados);
  const f = diasPasados / diasTotales;

  // ── gasto por periodo y categoría (null = sin categoría)
  const presu = presupuestoPorCategoria();
  const gastoPor = new Map(claves.map((c) => [c, new Map()]));
  for (const m of gastos) {
    const k = periodoDeFecha(fechaISO(m), corte);
    if (!gastoPor.has(k)) continue;
    const id = presu.has(m.categoria_id) ? m.categoria_id : null;
    const mapa = gastoPor.get(k);
    mapa.set(id, (mapa.get(id) || 0) + Number(m.monto));
  }
  // Solo cuentan para el promedio los periodos cerrados en los que registraste gastos
  const cerrados = claves.slice(0, -1).filter((k) => gastoPor.get(k).size > 0);

  if (!gastos.length) {
    raiz.innerHTML = h`
      <header class="cabecera"><div><h1>Real vs plan</h1><p class="sub">Cómo va tu gasto real frente a lo que configuraste.</p></div></header>
      <div class="bloque vacio"><p>Todavía no hay gastos registrados. Cuando registres los de este periodo verás aquí cómo vas frente al plan y a dónde llegas a este ritmo.</p>
      <button class="primario" id="seg-registrar">Registrar un gasto</button></div>`;
    raiz.querySelector('#seg-registrar').onclick = () => document.querySelector('#nav [data-accion="registrar"]').click();
    return;
  }

  // ── cada categoría: presupuesto, real, ritmo y cierre estimado
  const filas = [];
  const entradas = [...presu.entries(), [null, { cat: { id: null, nombre: 'Sin categoría', icono: '•', fija: false }, presupuesto: 0 }]];
  for (const [id, v] of entradas) {
    const gastado = gastoPor.get(actual).get(id) || 0;
    const historia = cerrados.map((k) => gastoPor.get(k).get(id) || 0);
    if (!v.presupuesto && !gastado && !historia.some((x) => x > 0)) continue;
    const prom = promedio(historia);
    let cierre;
    if (v.cat.fija) {
      // un gasto fijo se paga una vez: se cuenta completo, o lo real si ya lo superó
      cierre = Math.max(gastado, v.presupuesto);
    } else {
      // el ritmo de hoy pesa más a medida que avanza el periodo; al comienzo pesa la historia
      const ritmo = diasPasados >= 5 ? (gastado / diasPasados) * diasTotales : null;
      if (ritmo != null && prom != null) cierre = ritmo * f + prom * (1 - f);
      else if (ritmo != null) cierre = ritmo;
      else if (prom != null) cierre = prom;
      else cierre = Math.max(gastado, v.presupuesto);
      cierre = Math.max(cierre, gastado);
    }
    // gasto típico de un mes para proyectar los siguientes: lo que pasó + cómo va este
    const mensual = v.cat.fija ? Math.max(v.presupuesto, prom ?? 0) : promedio([...historia, cierre]);
    const esperado = v.cat.fija ? null : v.presupuesto * f;
    const estadoC = gastado > v.presupuesto && v.presupuesto > 0 ? 'pasado'
      : !v.presupuesto && gastado > 0 ? 'sin-presu'
      : cierre > v.presupuesto * 1.05 ? 'riesgo' : 'bien';
    filas.push({ id, cat: v.cat, presupuesto: v.presupuesto, gastado, esperado, cierre, mensual, prom, historia, estado: estadoC });
  }
  const variables = filas.filter((x) => !x.cat.fija);
  const fijas = filas.filter((x) => x.cat.fija);
  const suma = (l, k) => l.reduce((s, x) => s + (x[k] || 0), 0);
  const presuTotal = suma(filas, 'presupuesto');
  const gastadoTotal = suma(filas, 'gastado');
  const cierreTotal = suma(filas, 'cierre');
  const presuVar = suma(variables, 'presupuesto');
  const gastadoVar = suma(variables, 'gastado');
  const esperadoVar = presuVar * f;
  const cierreVar = suma(variables, 'cierre');
  const desfaseHoy = gastadoVar - esperadoVar;
  const desfaseCierre = cierreTotal - presuTotal;

  // ── proyección con el plan y a tu ritmo
  const catsRitmo = d.categorias.map((c) => {
    const fila = filas.find((x) => x.id === c.id);
    return !c.fija && fila ? { ...c, presupuesto: Math.round(fila.mensual) } : c;
  });
  const sinCat = filas.find((x) => x.id === null);
  if (sinCat && sinCat.mensual > 0) catsRitmo.push({ id: null, nombre: 'Sin categoría', activa: true, fija: false, presupuesto: Math.round(sinCat.mensual) });
  const [plan, ritmo] = await Promise.all([
    proyeccionDesdeHoy({ meses: MESES, movimientos: movsActual }),
    proyeccionDesdeHoy({ meses: MESES, categorias: catsRitmo, movimientos: movsActual }),
  ]);
  const finPlan = plan.periodos.at(-1)?.totales.acumulado ?? 0;
  const finRitmo = ritmo.periodos.at(-1)?.totales.acumulado ?? 0;
  const brecha = finRitmo - finPlan;

  const tips = consejos({ filas, variables, fijas, gastos, movsActual, desde, diasRestantes, f, cerrados, presuVar, cierreVar, plan, ritmo, gastadoVar });

  const tono = desfaseCierre > presuTotal * 0.05 ? 'roja' : desfaseCierre > 0 ? 'ambar' : 'verde';
  const titulo = desfaseCierre > 0
    ? `A este ritmo cierras el periodo ${pesos(desfaseCierre)} por encima de lo previsto.`
    : `Vas bien: a este ritmo cierras el periodo ${pesos(-desfaseCierre)} por debajo de lo previsto.`;

  const ESTADOS = { bien: ['Bien', 'nomina'], riesgo: ['En riesgo', 'riesgo'], pasado: ['Pasado', 'alerta-e'], 'sin-presu': ['Sin presupuesto', ''] };

  raiz.innerHTML = h`
    <header class="cabecera">
      <div><h1>Real vs plan</h1><p class="sub">Cómo va tu gasto real frente a lo que configuraste, y a dónde llegas si sigues así.</p></div>
      <span class="chico suave">Periodo ${diaMes(desde)} – ${diaMes(hasta)} · día ${diasPasados} de ${diasTotales}</span>
    </header>

    <div class="pila">
      <div class="alerta ${tono}"><div><strong>${titulo}</strong>
        <p class="chico">${desfaseHoy > 0
          ? `En gasto variable llevas ${pesos(gastadoVar)}; a esta altura del periodo lo previsto era ${pesos(esperadoVar)} (${pesos(desfaseHoy)} de más).`
          : `En gasto variable llevas ${pesos(gastadoVar)}; a esta altura del periodo lo previsto era ${pesos(esperadoVar)}.`}
          ${ritmo.primerRojo && !plan.primerRojo ? ` Si sigues así, te quedarías sin plata en ${nombreMes(ritmo.primerRojo)}.` : ''}</p></div></div>

      <section class="bloque">
        <div class="bloque-cab"><h2>Este periodo</h2></div>
        <dl class="fuentes">
          <div><dt>Previsto para el periodo</dt><dd>${pesos(presuTotal)}</dd><span class="chico suave">gastos fijos y variables, sin cuotas de deudas</span></div>
          <div><dt>Gastado hasta hoy</dt><dd>${pesos(gastadoTotal)}</dd><span class="chico suave">${pctTxt(presuTotal ? gastadoTotal / presuTotal : 0)} de lo previsto, con ${pctTxt(f)} del periodo</span></div>
          <div><dt>Al cierre, a este ritmo</dt><dd class="${desfaseCierre > 0 ? 'neg' : ''}">${pesos(cierreTotal)}</dd><span class="chico suave">${desfaseCierre > 0 ? `${pesos(desfaseCierre)} por encima` : `${pesos(-desfaseCierre)} por debajo`}</span></div>
          <div class="${presuVar - gastadoVar < 0 ? '' : 'destacado'}"><dt>Variable: puedes gastar al día</dt><dd class="${presuVar - gastadoVar < 0 ? 'neg' : ''}">${pesos(Math.max(0, presuVar - gastadoVar) / diasRestantes)}</dd><span class="chico suave">${presuVar - gastadoVar < 0 ? `ya te pasaste ${pesos(gastadoVar - presuVar)}` : `los ${diasRestantes} días que faltan`}</span></div>
        </dl>
      </section>

      <section class="bloque">
        <div class="bloque-cab"><h2>Por categoría</h2><span class="chico suave">La raya marca lo previsto a hoy</span></div>
        ${[['Gastos variables', variables], ['Gastos fijos', fijas]].filter(([, l]) => l.length).map(([t, l]) => h`
          <div class="fv-grupo"><div class="fv-cab"><span class="fv-nombre">${t}</span><span class="fv-total">${pesos(suma(l, 'gastado'))} <span class="chico suave">de ${pesos(suma(l, 'presupuesto'))}</span></span></div>
          ${l.sort((a, b) => (b.cierre - b.presupuesto) - (a.cierre - a.presupuesto)).map((x) => {
            const base = Math.max(x.presupuesto, x.cierre, 1);
            const [etq, cls] = ESTADOS[x.estado];
            return h`<div class="cat seg ${x.estado === 'pasado' ? 'pasado' : x.estado === 'riesgo' ? 'cerca' : ''}">
              <span class="ic" aria-hidden="true">${x.cat.icono || '•'}</span>
              <span>${x.cat.nombre} <span class="etiqueta ${cls}">${etq}</span></span>
              <span class="chico ${x.estado === 'pasado' ? 'neg' : 'suave'}">${pesos(x.gastado)}${x.presupuesto ? ` / ${pesos(x.presupuesto)}` : ''}</span>
              <span class="riel" aria-hidden="true">
                <span class="real" style="width:${Math.min(100, (x.gastado / base) * 100)}%"></span>
                <span class="cierre" style="width:${Math.min(100, (x.cierre / base) * 100)}%"></span>
                ${x.esperado != null && x.presupuesto ? h`<i class="hoy" style="left:${Math.min(100, (x.esperado / base) * 100)}%"></i>` : ''}
              </span>
              <span class="seg-nota chico suave">${x.cat.fija
                ? (x.gastado >= x.presupuesto ? 'Ya pagado' : `Falta ${pesos(x.presupuesto - x.gastado)}`)
                : `Al cierre ~${pesos(x.cierre)}${x.prom ? ` · promedio ${pesos(x.prom)}` : ''}`}</span>
            </div>`;
          })}</div>`)}
        <div class="leyenda"><span><i style="background:var(--verde)"></i>Gastado</span><span><i style="background:var(--verde);opacity:.3"></i>Estimado al cierre</span><span><i style="background:var(--tinta);width:2px"></i>Previsto a hoy</span></div>
      </section>

      <section class="bloque">
        <div class="bloque-cab"><h2>Qué puedes hacer</h2></div>
        ${tips.length ? h`<ul class="tips">${tips.map((t) => h`<li class="${t.tipo}"><strong>${t.titulo}</strong><p class="chico">${t.texto}</p></li>`)}</ul>`
          : h`<p class="chico suave">Vas en línea con tu plan. Sigue registrando tus gastos para que el seguimiento sea preciso.</p>`}
      </section>

      <section class="bloque">
        <div class="bloque-cab"><h2>Si sigues a este ritmo</h2><span class="chico suave">${MESES} meses</span></div>
        <p class="chico" style="margin-bottom:10px">${Math.abs(brecha) < 1000
          ? `Tu ritmo real coincide con el plan: en ${MESES} meses tendrías ${pesos(finRitmo)}.`
          : brecha < 0
            ? `A tu ritmo real, en ${MESES} meses tendrías ${pesos(finRitmo)}: ${pesos(-brecha)} menos que con el plan (${pesos(finPlan)}).`
            : `A tu ritmo real, en ${MESES} meses tendrías ${pesos(finRitmo)}: ${pesos(brecha)} más que con el plan (${pesos(finPlan)}).`}</p>
        ${pista(ritmo.periodos, plan.periodos)}
        <div class="leyenda"><span><i style="background:var(--verde)"></i>A tu ritmo</span><span><i style="border:2px dashed var(--violeta);background:none"></i>Plan (Proyección)</span><span><i style="background:var(--rojo)"></i>Faltante</span></div>
        <p class="chico suave" style="margin-top:8px">El ritmo usa tu gasto variable real: el promedio de los últimos periodos con gastos registrados y cómo va este. Los gastos fijos, las cuotas y la nómina son los mismos de la proyección.</p>
      </section>

      <section class="bloque" style="padding:0;border:0;background:none">
        <div class="bloque-cab"><h2>Periodos anteriores</h2></div>
        <div class="tabla-env"><table>
          <thead><tr><th>Periodo</th><th>Previsto</th><th>Real</th><th>Diferencia</th></tr></thead>
          <tbody>${claves.slice().reverse().map((k) => {
            const real = [...gastoPor.get(k).values()].reduce((s, x) => s + x, 0);
            if (k !== actual && !real) return '';
            const dif = real - presuTotal;
            return h`<tr><td>${nombreMes(k)}${k === actual ? ' (en curso)' : ''}</td><td>${pesos(presuTotal)}</td><td>${pesos(real)}</td>
              <td class="${dif > 0 && k !== actual ? 'neg' : ''}">${k === actual ? `~${pesos(Math.abs(cierreTotal - presuTotal))} de ${cierreTotal > presuTotal ? 'más' : 'menos'} (estimado)` : dif > 0 ? `${pesos(dif)} de más` : `${pesos(-dif)} de menos`}</td></tr>`;
          })}</tbody>
        </table></div>
        <p class="chico suave" style="margin-top:8px">El previsto es el presupuesto actual de tus categorías. Solo se muestran periodos en los que registraste gastos.</p>
      </section>
    </div>`;
}

/** Recomendaciones a partir de cómo vas. Cada una con un número concreto; las de más impacto primero. */
function consejos({ filas, variables, fijas, gastos, movsActual, desde, diasRestantes, f, cerrados, presuVar, cierreVar, plan, ritmo, gastadoVar }) {
  const out = [];
  const add = (impacto, tipo, titulo, texto) => out.push({ impacto, tipo, titulo, texto });

  if (ritmo.primerRojo && !plan.primerRojo) {
    add(1e12, 'rojo', `A este ritmo te quedas sin plata en ${nombreMes(ritmo.primerRojo)}`,
      'Con el plan te alcanza, pero tu gasto real es mayor. Los consejos de abajo dicen dónde recortar primero.');
  }

  // categorías variables que se van a pasar
  for (const x of variables.filter((v) => v.presupuesto > 0 && v.cierre > v.presupuesto * 1.05).sort((a, b) => (b.cierre - b.presupuesto) - (a.cierre - a.presupuesto)).slice(0, 2)) {
    const exceso = x.cierre - x.presupuesto;
    if (x.gastado >= x.presupuesto) {
      add(exceso, 'rojo', `${x.cat.nombre}: ya te pasaste ${pesos(x.gastado - x.presupuesto)}`,
        `Llevas ${pesos(x.gastado)} de ${pesos(x.presupuesto)}. Lo que gastes aquí hasta el corte sale de lo que te sobra del mes; intenta no sumar más en ${x.cat.nombre.toLowerCase()} estos ${diasRestantes} días.`);
    } else {
      add(exceso, 'ambar', `${x.cat.nombre}: a este ritmo cierras en ${pesos(x.cierre)}`,
        `Llevas ${pesos(x.gastado)} de ${pesos(x.presupuesto)} con ${pctTxt(f)} del periodo. Para no pasarte, gasta máximo ${pesos((x.presupuesto - x.gastado) / diasRestantes)} al día en esta categoría los ${diasRestantes} días que quedan.`);
    }
  }

  // total variable
  if (cierreVar > presuVar * 1.05 && presuVar > 0) {
    add(cierreVar - presuVar, 'ambar', `Recorta ${pesos((cierreVar - presuVar) / diasRestantes)} al día en gasto variable`,
      `A este ritmo el gasto variable cierra en ${pesos(cierreVar)} frente a ${pesos(presuVar)} previstos. Ese recorte diario te devuelve al plan.`);
  }

  // gastos hormiga
  const chicos = movsActual.filter((m) => m.tipo === 'gasto' && Number(m.monto) < HORMIGA);
  const sumaChicos = chicos.reduce((s, m) => s + Number(m.monto), 0);
  if (chicos.length >= 6 && sumaChicos > gastadoVar * 0.1) {
    add(sumaChicos / Math.max(f, 0.1) * 0.5, 'azul', `${chicos.length} gastos pequeños suman ${pesos(sumaChicos)}`,
      `Son compras de menos de ${pesos(HORMIGA)}. A este ritmo serían unos ${pesos(sumaChicos / Math.max(f, 0.1))} en el periodo. Son los más fáciles de recortar: reducir la mitad libera ${pesos(sumaChicos / Math.max(f, 0.1) / 2)}.`);
  }

  // fines de semana
  const variablesIds = new Set(variables.map((x) => x.id));
  const gVar = gastos.filter((m) => variablesIds.has(filas.some((x) => x.id === m.categoria_id) ? m.categoria_id : null));
  const totalVar = gVar.reduce((s, m) => s + Number(m.monto), 0);
  const finde = gVar.filter((m) => [0, 6].includes(new Date(`${fechaISO(m)}T12:00:00`).getDay())).reduce((s, m) => s + Number(m.monto), 0);
  if (totalVar > 0 && gVar.length >= 10 && finde / totalVar > 0.45) {
    add(finde * 0.2, 'azul', `El ${pctTxt(finde / totalVar)} de tu gasto variable es en fines de semana`,
      'Dos días concentran casi la mitad del gasto. Fijar un tope por fin de semana (y llevarlo en efectivo o en una cuenta aparte) es donde más rinde un recorte.');
  }

  // presupuestos que se pasan siempre
  for (const x of variables.filter((v) => v.presupuesto > 0 && cerrados.length >= 2)) {
    const veces = x.historia.filter((g) => g > x.presupuesto).length;
    if (veces >= 2) {
      add((x.prom - x.presupuesto) * 0.8, 'ambar', `${x.cat.nombre} se pasa casi siempre`,
        `En ${veces} de los últimos ${x.historia.length} periodos gastaste más de ${pesos(x.presupuesto)} (promedio ${pesos(x.prom)}). O lo recortas con un tope concreto, o subes el presupuesto a algo realista en Ajustes › Gastos para que la proyección no te engañe.`);
    }
  }

  // presupuestos que sobran
  for (const x of variables.filter((v) => v.presupuesto > 0 && cerrados.length >= 2 && v.prom != null && v.prom < v.presupuesto * 0.7)) {
    add((x.presupuesto - x.prom) * 0.5, 'verde', `En ${x.cat.nombre} te sobra presupuesto`,
      `Gastas en promedio ${pesos(x.prom)} de ${pesos(x.presupuesto)}. Podrías bajar ese presupuesto y mandar ${pesos(x.presupuesto - x.prom)} al mes a tu ahorro.`);
  }

  // gastos fijos que suben
  for (const x of fijas.filter((v) => v.presupuesto > 0 && v.prom != null && v.prom > v.presupuesto * 1.05)) {
    add(x.prom - x.presupuesto, 'ambar', `${x.cat.nombre} cuesta más de lo configurado`,
      `En promedio pagas ${pesos(x.prom)} y tienes ${pesos(x.presupuesto)} como gasto fijo. Actualiza el valor en Ajustes › Gastos para que la proyección sea real.`);
  }

  // sin categoría
  const sin = filas.find((x) => x.id === null);
  if (sin && sin.gastado > 0) {
    add(sin.gastado * 0.3, 'azul', `${pesos(sin.gastado)} sin categoría este periodo`,
      'Ponles categoría a esos gastos (tócalos en Periodo) para que el seguimiento y los consejos sean precisos.');
  }

  // con tarjeta
  const conTarjeta = movsActual.filter((m) => m.tipo === 'gasto' && m.deuda_id).reduce((s, m) => s + Number(m.monto), 0);
  const totalActual = movsActual.filter((m) => m.tipo === 'gasto').reduce((s, m) => s + Number(m.monto), 0);
  if (totalActual > 0 && conTarjeta / totalActual > 0.3) {
    add(conTarjeta * 0.2, 'azul', `${pctTxt(conTarjeta / totalActual)} de lo que gastaste fue con tarjeta`,
      `Son ${pesos(conTarjeta)} que no salen hoy de tu cuenta pero llegan en la próxima factura (y con intereses si son a cuotas). Si puedes, paga lo del día a día con débito.`);
  }

  // la categoría más pesada
  const mayor = variables.filter((x) => x.gastado > 0).sort((a, b) => b.gastado - a.gastado)[0];
  if (mayor && gastadoVar > 0 && mayor.gastado / gastadoVar > 0.4 && !out.some((t) => t.titulo.startsWith(mayor.cat.nombre))) {
    add(mayor.gastado * 0.1, 'azul', `${mayor.cat.nombre} es el ${pctTxt(mayor.gastado / gastadoVar)} de tu gasto variable`,
      `Un recorte del 10 % ahí son ${pesos(mayor.cierre * 0.1)} en el periodo, más que recortar varias categorías pequeñas.`);
  }

  return out.sort((a, b) => b.impacto - a.impacto).slice(0, 6);
}
