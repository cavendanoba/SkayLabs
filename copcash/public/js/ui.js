// Utilidades de interfaz: plantillas seguras, formato de pesos, avisos y diálogos.

class Seguro { constructor(s) { this.s = s; } toString() { return this.s; } }
export const crudo = (s) => new Seguro(String(s));

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ESC[c]);

function valor(v) {
  if (v instanceof Seguro) return v.s;
  if (Array.isArray(v)) return v.map(valor).join('');
  if (v === false || v === null || v === undefined) return '';
  return esc(v);
}

/** Plantilla que escapa todo lo interpolado salvo lo que ya viene de otra plantilla h``. */
export function h(partes, ...vals) {
  let s = partes[0];
  vals.forEach((v, i) => { s += valor(v) + partes[i + 1]; });
  return new Seguro(s);
}

const fmt = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 });
/** $1.234.567 (negativos con signo menos) */
export const pesos = (n) => `${n < 0 ? '−' : ''}$${fmt.format(Math.abs(Math.round(Number(n) || 0)))}`;
/** 1,2 M / 850 mil — para gráficos */
export function corto(n) {
  const a = Math.abs(n);
  const s = n < 0 ? '−' : '';
  if (a >= 1e6) return `${s}${(a / 1e6).toLocaleString('es-CO', { maximumFractionDigits: 1 })} M`;
  if (a >= 1e3) return `${s}${Math.round(a / 1e3)} mil`;
  return `${s}${Math.round(a)}`;
}
export const pct = (n, dec = 1) => `${(Number(n) * 100).toLocaleString('es-CO', { maximumFractionDigits: dec })} %`;

/** Convierte "1.234.567", "1234567", "1,5" en número */
export function numero(txt) {
  if (typeof txt === 'number') return txt;
  const s = String(txt || '').trim().replace(/\$/g, '').replace(/\s/g, '');
  if (!s) return 0;
  // 1.234.567,89 → 1234567.89 ; 1234,5 → 1234.5 ; 1.5 (decimal corto) → 1.5
  if (/,\d{1,2}$/.test(s)) return Number(s.replace(/\./g, '').replace(',', '.'));
  if (/^\d{1,3}(\.\d{3})+$/.test(s)) return Number(s.replace(/\./g, ''));
  return Number(s.replace(/,/g, ''));
}

export function hoyISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function diaMes(iso) {
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }).replace('.', '');
}

export function fechaCorta(iso) {
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' });
}

let temporizador;
export function aviso(texto, error = false) {
  const el = document.getElementById('aviso');
  el.textContent = texto;
  el.className = `ver${error ? ' error' : ''}`;
  clearTimeout(temporizador);
  temporizador = setTimeout(() => { el.className = ''; }, error ? 5000 : 2500);
}

/** Abre el diálogo único; `pintar(dlg)` llena el contenido. */
export function abrirDialogo(pintar) {
  const dlg = document.getElementById('dialogo');
  dlg.innerHTML = '';
  pintar(dlg);
  if (!dlg.open) dlg.showModal();
  const primero = dlg.querySelector('[autofocus], input, select, textarea, button');
  primero?.focus();
  return dlg;
}
export function cerrarDialogo() {
  const dlg = document.getElementById('dialogo');
  if (dlg.open) dlg.close();
}
document.getElementById('dialogo')?.addEventListener('click', (e) => {
  if (e.target.id === 'dialogo') cerrarDialogo(); // clic fuera
  if (e.target.closest('[data-cerrar]')) cerrarDialogo();
});

export function confirmar(texto, boton = 'Borrar') {
  return new Promise((resolve) => {
    abrirDialogo((dlg) => {
      dlg.innerHTML = h`<div class="cuerpo"><p>${texto}</p>
        <div class="acciones"><button type="button" data-no>Cancelar</button><button type="button" class="primario" data-si>${boton}</button></div></div>`;
      dlg.querySelector('[data-no]').onclick = () => { cerrarDialogo(); resolve(false); };
      dlg.querySelector('[data-si]').onclick = () => { cerrarDialogo(); resolve(true); };
    });
  });
}

/** Lee un formulario a objeto, convirtiendo campos marcados con data-num y data-bool. */
export function leerForm(form) {
  const out = {};
  for (const el of form.elements) {
    if (!el.name || el.disabled) continue;
    if (el.type === 'radio' && !el.checked) continue;
    if (el.type === 'checkbox') { out[el.name] = el.checked; continue; }
    let v = el.value;
    if (el.dataset.num !== undefined) v = v === '' ? null : numero(v);
    if (el.dataset.pct !== undefined) v = v === '' ? null : numero(v) / 100;
    out[el.name] = v === '' ? null : v;
  }
  return out;
}

/** Formatea un input de pesos mientras se escribe (1234567 → 1.234.567) */
export function mascaraPesos(raiz) {
  raiz.querySelectorAll('input[data-pesos]').forEach((inp) => {
    const f = () => {
      const n = numero(inp.value);
      if (inp.value && Number.isFinite(n)) inp.value = fmt.format(n);
    };
    inp.addEventListener('blur', f);
    f();
  });
}

export const PALETA = ['#1E6B52', '#2F5DA8', '#6A4FB3', '#B3372B', '#C2610C', '#0E7C86', '#8A3B6E', '#3D4A57', '#9A7B0F', '#4E7A1F'];

/** Selector de color: paleta + color libre. Usar con conectarColor(form) y leer con colorElegido(form). */
export function selectorColor(actual) {
  const libre = actual && !PALETA.includes(actual);
  return h`<fieldset class="campo colores"><legend>Color</legend>
    ${PALETA.map((c) => h`<label title="${c}"><input type="radio" name="color" value="${c}" ${actual === c ? 'checked' : ''}><span style="background:${c}"></span></label>`)}
    <label class="color-libre" title="Otro color"><input type="color" name="color_libre" value="${libre ? actual : '#1E6B52'}" ${libre ? crudo('data-activo') : ''} aria-label="Escoger otro color"></label>
  </fieldset>`;
}
export function conectarColor(form) {
  if (form.color_libre?.hasAttribute('data-activo')) form.dataset.colorLibre = '1';
  form.color_libre?.addEventListener('input', () => { form.dataset.colorLibre = '1'; form.querySelectorAll('input[name=color]').forEach((r) => { r.checked = false; }); });
  form.querySelectorAll('input[name=color]').forEach((r) => r.addEventListener('change', () => { delete form.dataset.colorLibre; }));
}
export function colorElegido(form) {
  if (form.dataset.colorLibre) return form.color_libre.value;
  return form.querySelector('input[name=color]:checked')?.value || null;
}
