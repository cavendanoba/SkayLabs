import { h, corto } from '../ui.js';
import { nombreMes } from '../motor.js';

/**
 * "Pista de ahorro": cuánto llevas ahorrado al final de cada periodo.
 * Verde por encima de cero, rojo por debajo; la comparación es un contorno violeta.
 * Se dibuja con HTML/CSS para que llene el ancho disponible sin agrandar el texto.
 */
export function pista(periodos, comparar = null) {
  const n = periodos.length;
  if (!n) return h``;
  const vals = periodos.map((p) => p.totales.acumulado);
  const comp = comparar ? comparar.map((p) => p.totales.acumulado) : [];
  const max = Math.max(0, ...vals, ...comp);
  const min = Math.min(0, ...vals, ...comp);
  const rango = max - min || 1;
  const cero = (max / rango) * 100; // % desde arriba donde va la línea de cero
  const pct = (v) => (Math.abs(v) / rango) * 100;

  const etiqueta = `Plata acumulada por periodo: ${periodos.map((p) => `${nombreMes(p.clave)} ${corto(p.totales.acumulado)}`).join(', ')}`;
  return h`<div class="pista" role="img" aria-label="${etiqueta}" style="--cero:${cero}%">
    <div class="pista-area">
      <div class="pista-cero"></div>
      ${periodos.map((p, i) => {
        const v = p.totales.acumulado;
        const alto = Math.max(0.8, pct(v));
        const pos = v >= 0 ? `bottom:${100 - cero}%` : `top:${cero}%`;
        const cv = comparar?.[i]?.totales.acumulado;
        return h`<div class="pista-col" title="${`${p.etiqueta}: ${corto(v)}${cv != null ? ` (comparado: ${corto(cv)})` : ''}`}">
          ${cv != null ? h`<span class="pista-comp" style="${cv >= 0 ? `bottom:${100 - cero}%` : `top:${cero}%`};height:${Math.max(0.8, pct(cv))}%"></span>` : ''}
          <span class="pista-barra ${v < 0 ? 'neg' : ''}" style="${pos};height:${alto}%">
            <span class="pista-valor">${corto(v)}</span>
          </span>
        </div>`;
      })}
    </div>
    <div class="pista-meses">
      ${periodos.map((p, i) => {
        const [mes, anio] = nombreMes(p.clave).split(' ');
        return h`<span>${mes}${mes === 'ene' || i === 0 ? h`<small>${anio}</small>` : ''}</span>`;
      })}
    </div>
  </div>`;
}
