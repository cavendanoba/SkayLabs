import { api, sesion } from './api.js';
import { h, crudo, abrirDialogo } from './ui.js';
import { estado, refrescar } from './estado.js';
import { vistaPeriodo } from './views/periodo.js';
import { formMovimiento } from './views/movimientos.js';
import { vistaDeudas } from './views/deudas.js';
import { vistaProyeccion } from './views/proyeccion.js';
import { vistaAjustes } from './views/ajustes.js';
import { vistaCuentas } from './views/cuentas.js';

const RUTAS = {
  '': vistaPeriodo,
  periodo: vistaPeriodo,
  movimientos: vistaPeriodo, // enlaces viejos
  deudas: vistaDeudas,
  cuentas: vistaCuentas,
  proyeccion: vistaProyeccion,
  ajustes: vistaAjustes,
};

const vista = document.getElementById('vista');
const nav = document.getElementById('nav');

// Tema guardado (claro/oscuro/sistema)
try {
  const t = localStorage.getItem('copcash_tema');
  if (t) document.documentElement.dataset.tema = t;
} catch { /* sin almacenamiento */ }

export async function render() {
  if (!sesion.token) { pintarEntrada(); return; }
  nav.hidden = false;
  document.body.classList.remove('sin-sesion');
  const [nombre, ...resto] = location.hash.replace(/^#\/?/, '').split('/');
  const fn = RUTAS[nombre] || vistaPeriodo;
  nav.querySelectorAll('a[data-ruta]').forEach((a) => {
    const ruta = ['periodo', 'movimientos'].includes(nombre) ? '' : RUTAS[nombre] ? nombre : '';
    const actual = (a.dataset.ruta === 'inicio' ? '' : a.dataset.ruta) === ruta;
    if (actual) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  });
  try {
    await refrescar();
    vista.onclick = vista.oninput = vista.onchange = vista.onsubmit = null;
    await fn(vista, resto);
  } catch (e) {
    if (e.status === 401) { sesion.salir(); return; }
    vista.innerHTML = h`<div class="alerta roja"><div><strong>No pude cargar esta pantalla.</strong><p>${e.message}</p></div></div>`;
  }
}

window.addEventListener('hashchange', () => { render(); vista.focus({ preventScroll: true }); window.scrollTo(0, 0); });
window.addEventListener('copcash:salir', () => { estado.datos = null; render(); });
window.addEventListener('copcash:cambio', () => render());

nav.addEventListener('click', (e) => {
  if (e.target.closest('[data-accion="registrar"]')) registrarGasto();
});

export function registrarGasto(valores = {}) {
  abrirDialogo((dlg) => formMovimiento(dlg, { tipo: 'gasto', ...valores }));
}

// Barras decorativas de la pantalla de entrada: un año con un bache en rojo y la recuperación
const PISTA_ENTRADA = [0.35, 0.55, 0.9, 1, 0.78, 0.5, 0.22, -0.18, 0.42, 0.3, 0.6, 0.85];
const MESES_ENTRADA = ['oct', 'nov', 'dic', 'ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep'];

function pistaEntrada() {
  const paso = 40; const alto = 150; const y0 = 112;
  const barras = PISTA_ENTRADA.map((v, i) => {
    const hgt = Math.abs(v) * 92;
    const y = v >= 0 ? y0 - hgt : y0;
    return `<rect x="${i * paso + 8}" y="${y}" width="${paso - 16}" height="${hgt}" rx="3" class="${v < 0 ? 'b-neg' : 'b-pos'}" style="animation-delay:${i * 45}ms"/>
      <text x="${i * paso + paso / 2}" y="${alto - 4}" text-anchor="middle">${MESES_ENTRADA[i]}</text>`;
  }).join('');
  return `<svg viewBox="0 0 ${PISTA_ENTRADA.length * paso} ${alto}" aria-hidden="true"><line x1="0" x2="${PISTA_ENTRADA.length * paso}" y1="${y0}" y2="${y0}"/>${barras}</svg>`;
}

function pintarEntrada(modo = 'login', error = '') {
  nav.hidden = true;
  document.body.classList.add('sin-sesion');
  const registro = modo === 'registro';
  vista.innerHTML = h`
    <section class="entrada">
      <div class="entrada-lado">
        <img class="entrada-marca" src="logo.svg" alt="CopCash" width="200" height="100">
        <h1 class="entrada-titulo">Del 1 al 30,<br>con la cuenta clara.</h1>
        <p class="entrada-texto">Lo que gastas hoy, lo que debes y cuánto te queda en cada pago, mes a mes.</p>
        <ul class="entrada-puntos">
          <li><strong>Tu periodo, tus fechas.</strong> Configuras el día de pago y el de corte; CopCash arma cada periodo con eso.</li>
          <li><strong>Deudas sin sorpresas.</strong> Tarjetas y créditos con su cuota, saldo e intereses, contados como gasto fijo.</li>
          <li><strong>Mira hacia adelante.</strong> Proyección de hasta 24 meses: sabes desde hoy en qué mes te falta plata.</li>
        </ul>
        <div class="entrada-pista">${crudo(pistaEntrada())}</div>
      </div>
      <div class="entrada-form">
        <form id="f-entrada" novalidate>
          <h2>${registro ? 'Crea tu cuenta' : 'Entra a tu cuenta'}</h2>
          <p class="suave" style="margin:4px 0 22px">${registro ? 'Lleva tus gastos, deudas y ahorros en un solo lugar.' : 'Con el correo y la clave que registraste.'}</p>
          ${registro ? h`<div class="campo"><label for="e-nombre">Tu nombre</label><input id="e-nombre" name="nombre" autocomplete="given-name" maxlength="80"></div>` : ''}
          <div class="campo"><label for="e-email">Correo</label><input id="e-email" name="email" type="email" autocomplete="email" inputmode="email" required autofocus></div>
          <div class="campo"><label for="e-pass">Contraseña</label>
            <div class="clave">
              <input id="e-pass" name="password" type="password" autocomplete="${registro ? 'new-password' : 'current-password'}" minlength="8" required>
              <button type="button" class="sutil" id="e-ver" aria-pressed="false">Mostrar</button>
            </div>
            ${registro ? h`<p class="ayuda">Mínimo 8 caracteres.</p>` : ''}</div>
          <p class="entrada-error" id="e-error" role="alert" ${error ? '' : 'hidden'}>${error}</p>
          <button class="primario entrada-boton" id="e-enviar">${registro ? 'Crear cuenta' : 'Entrar'}</button>
          <p class="entrada-cambio">${registro ? '¿Ya tienes cuenta?' : '¿Primera vez aquí?'}
            <button type="button" class="sutil" id="e-cambiar">${registro ? 'Entrar' : 'Crear una cuenta'}</button></p>
        </form>
      </div>
    </section>`;
  const form = vista.querySelector('#f-entrada');
  const err = vista.querySelector('#e-error');
  vista.querySelector('#e-cambiar').onclick = () => pintarEntrada(registro ? 'login' : 'registro');
  vista.querySelector('#e-ver').onclick = (e) => {
    const p = form.password;
    const ver = p.type === 'password';
    p.type = ver ? 'text' : 'password';
    e.target.textContent = ver ? 'Ocultar' : 'Mostrar';
    e.target.setAttribute('aria-pressed', String(ver));
  };
  form.onsubmit = async (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(form));
    if (!d.email || !d.password) { err.textContent = 'Escribe tu correo y tu contraseña.'; err.hidden = false; return; }
    const boton = vista.querySelector('#e-enviar');
    boton.disabled = true; boton.textContent = registro ? 'Creando…' : 'Entrando…';
    try {
      const r = await api.post(registro ? '/auth/registro' : '/auth/login', d);
      sesion.guardar(r.token);
      estado.datos = null;
      document.body.classList.remove('sin-sesion');
      if (!location.hash || location.hash === '#/') render(); else location.hash = '#/';
    } catch (ex) {
      err.textContent = ex.message; err.hidden = false;
      boton.disabled = false; boton.textContent = registro ? 'Crear cuenta' : 'Entrar';
      form.password.select();
    }
  };
}

render();
