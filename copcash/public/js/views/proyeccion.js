// Proyección: cuánto te sobra o te falta cada periodo con lo que tienes configurado.
// No tiene supuestos propios: todo sale de Ajustes (nómina, gastos fijos y variables), Deudas y Cuentas.
import { h, pesos } from '../ui.js';
import { proyeccionDesdeHoy } from '../estado.js';
import { nombreMes } from '../motor.js';
import { pista } from './pista.js';

// Las cuotas de deudas son gasto fijo: van dentro de esa sección
const SECCIONES = [
  ['fijos', 'Gastos fijos', ['fijos', 'deudas']],
  ['variables', 'Gasto variable (presupuesto)', ['variables']],
];
const HORIZONTES = [6, 12, 18, 24];

let meses = 12;
let detalle = true;

export async function vistaProyeccion(raiz) {
  const r = await proyeccionDesdeHoy({ meses });
  const ps = r.periodos;
  const fin = ps[ps.length - 1]?.totales.acumulado ?? 0;
  const primero = ps[0];
  const a0 = r.arranque;
  const arrancas = a0.total;
  const porPagar = a0.cuotasPorPagar + a0.presupuestoPorGastar;

  // filas por concepto (unión de nombres a lo largo de los periodos)
  const filasDe = (grupo) => {
    const nombres = [];
    ps.forEach((p) => p.grupos[grupo].forEach((x) => { if (!nombres.includes(x.nombre)) nombres.push(x.nombre); }));
    return nombres.map((n) => ({ nombre: n, valores: ps.map((p) => p.grupos[grupo].filter((x) => x.nombre === n).reduce((s, x) => s + x.monto, 0)) }));
  };
  const celda = (v, neg = false) => h`<td class="${v === 0 ? 'cero' : (neg || v < 0) ? 'neg' : ''}">${v === 0 ? '–' : pesos(v)}</td>`;
  const descuentos = [];
  ps.forEach((p) => p.grupos.ingresos[0].detalle.forEach((x) => { if (!descuentos.includes(x.nombre)) descuentos.push(x.nombre); }));

  // De dónde sale cada número (primer periodo)
  const fuente = [
    ['Te consignan', primero?.grupos.ingresos[0].monto ?? 0, '#/ajustes/nomina', 'Ajustes › Nómina'],
    ['Gastos fijos', (primero?.totales.fijos ?? 0) + (primero?.totales.deudas ?? 0), '#/ajustes/gastos', 'Ajustes › Gastos', `incluye ${pesos(primero?.totales.deudas ?? 0)} de cuotas`],
    ['Presupuesto variable', primero?.totales.variables ?? 0, '#/ajustes/gastos', 'Ajustes › Gastos'],
  ];
  const libreMes = primero ? primero.totales.resultado : 0;

  raiz.innerHTML = h`
    <header class="cabecera">
      <div><h1>Proyección</h1><p class="sub">Cuánto te sobra o te falta cada periodo con lo que tienes configurado.</p></div>
      <label class="campo" style="margin:0;min-width:150px"><span class="chico" style="font-weight:600">Ver</span>
        <select id="horizonte">${HORIZONTES.map((n) => h`<option value="${n}" ${n === meses ? 'selected' : ''}>${n} meses</option>`)}</select></label>
    </header>

    <div class="pila">
      ${r.primerRojo
        ? h`<div class="alerta roja"><div><strong>Te quedas sin plata con el pago de ${nombreMes(r.primerRojo)}.</strong>
            <p class="chico">El punto más bajo es ${pesos(r.minimo)}. En ${meses} meses terminas en ${pesos(fin)}.</p></div></div>`
        : h`<div class="alerta verde"><div><strong>Con lo que tienes configurado, te alcanza.</strong>
            <p class="chico">Lo más bajo que llegas es ${pesos(r.minimo)}. En ${meses} meses tendrías ${pesos(fin)}.</p></div></div>`}

      ${r.alertas.length ? h`<div class="alerta roja"><div><strong>Revisa ${r.alertas.length === 1 ? 'esta deuda' : 'estas deudas'}: el último pago no cuadra con la cuota.</strong>
          ${r.alertas.map((x) => h`<p class="chico">${x.nombre}: en ${nombreMes(x.clave)} se proyecta un pago de ${pesos(x.pago)} y la cuota es ${pesos(x.cuota)}. Con ${x.restantes ?? '—'} cuotas de ${pesos(x.cuota)} no alcanza a pagar el saldo de ${pesos(x.saldo)}: revisa el saldo y las cuotas que faltan en <a href="#/deudas">Deudas</a>.</p>`)}</div></div>` : ''}

      <section class="bloque">
        <div class="bloque-cab"><h2>De dónde sale</h2><span class="chico suave">Primer periodo: ${primero ? nombreMes(primero.clave) : '—'}</span></div>
        <dl class="fuentes">
          <div><dt>Arrancas con</dt><dd class="${arrancas < 0 ? 'neg' : ''}">${pesos(arrancas)}</dd><span class="chico suave">${pesos(a0.disponible)} en cuentas menos ${pesos(porPagar)} que faltan por pagar antes del próximo pago</span><a class="chico" href="#/cuentas">Cuentas</a></div>
          ${fuente.map(([t, v, href, donde, nota]) => h`<div><dt>${t}</dt><dd>${pesos(v)}</dd>${nota ? h`<span class="chico suave">${nota}</span>` : ''}<a class="chico" href="${href}">${donde}</a></div>`)}
          <div class="destacado"><dt>${libreMes < 0 ? 'Te falta' : 'Te sobra'} ese periodo</dt><dd class="${libreMes < 0 ? 'neg' : ''}">${pesos(libreMes)}</dd><span class="chico suave">${primero && primero.grupos.ingresos.length > 1 ? 'con primas' : 'sin primas'}</span></div>
        </dl>
        <p class="chico suave" style="margin-top:10px">Lo que falta por pagar este periodo son las cuotas que aún no registras como pagadas y lo que queda del presupuesto de cada categoría (fijos y variables). Para cambiar la proyección cambia tus datos: el salario y las primas en Ajustes, lo que gastas en Ajustes › Gastos, tus créditos en Deudas y lo que tienes hoy en Cuentas. Las cuotas que te descuentan por nómina ya están restadas de lo que te consignan.</p>
      </section>

      <section class="bloque">
        <div class="bloque-cab"><h2>Tu plata mes a mes</h2></div>
        ${pista(ps)}
        <div class="leyenda"><span><i style="background:var(--verde)"></i>Disponible</span><span><i style="background:var(--rojo)"></i>Faltante</span></div>
      </section>

      <section class="bloque" style="padding:0;border:0;background:none">
        <div class="bloque-cab"><h2>Detalle por periodo</h2><label class="check chico"><input type="checkbox" id="ver-detalle" ${detalle ? 'checked' : ''}>Ver cada concepto</label></div>
        <div class="tabla-env"><table>
          <thead><tr><th>Concepto</th>${ps.map((p) => h`<th>${nombreMes(p.clave)}</th>`)}</tr></thead>
          <tbody>
            <tr class="seccion"><td>Entra</td>${ps.map(() => h`<td></td>`)}</tr>
            ${detalle ? filasDe('ingresos').map((f) => h`<tr class="det"><td>${f.nombre}</td>${f.valores.map((v) => celda(v))}</tr>`) : ''}
            ${detalle ? descuentos.map((n) => h`<tr class="det"><td>· descuenta ${n}</td>${ps.map((p) => {
              const v = p.grupos.ingresos[0].detalle.filter((x) => x.nombre === n).reduce((s, x) => s + x.monto, 0);
              return h`<td class="${v ? 'suave' : 'cero'}">${v ? `(${pesos(v)})` : '–'}</td>`;
            })}</tr>`) : ''}
            <tr class="subtotal"><td>Total que entra</td>${ps.map((p) => celda(p.totales.entra))}</tr>
            ${SECCIONES.map(([, titulo, grupos]) => h`
              <tr class="seccion"><td>${titulo}</td>${ps.map(() => h`<td></td>`)}</tr>
              ${detalle ? grupos.map((g) => filasDe(g).map((f) => h`<tr class="det"><td title="${f.nombre}">${g === 'deudas' ? `Cuota ${f.nombre}` : f.nombre}</td>${f.valores.map((v) => celda(v))}</tr>`)) : ''}
              <tr class="subtotal"><td>Subtotal</td>${ps.map((p) => celda(grupos.reduce((s2, g) => s2 + p.totales[g], 0)))}</tr>`)}
            <tr class="total"><td>Sale</td>${ps.map((p) => celda(p.totales.sale))}</tr>
            <tr class="total"><td>Te sobra o te falta</td>${ps.map((p) => celda(p.totales.resultado))}</tr>
            <tr class="acum"><td>Plata acumulada</td>${ps.map((p) => celda(p.totales.acumulado))}</tr>
          </tbody>
        </table></div>
      </section>
    </div>`;

  raiz.querySelector('#horizonte').onchange = (e) => { meses = Number(e.target.value); vistaProyeccion(raiz); };
  raiz.querySelector('#ver-detalle').onchange = (e) => { detalle = e.target.checked; vistaProyeccion(raiz); };
}
