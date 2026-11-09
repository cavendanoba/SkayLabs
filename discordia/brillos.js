// brillos.js — Destellos del catálogo: el vuelo al carrito y la estela del mouse.
// Respeta a quienes tienen desactivadas las animaciones en su sistema,
// salvo que hayan elegido encender los brillos con el botón del catálogo.

const COLORES = ['#ffd76a', '#f5c518', '#ff9ed2', '#ffffff', '#ffb3de'];
const MAX_ESTELA = 40;
const DURACION_VUELO = 850;

const CLAVE_BRILLOS = 'discordia-brillos';

const sinAnimacion = window.matchMedia('(prefers-reduced-motion: reduce)');
let brillosElegidos = leerPreferencia();
const hayBrillos = () => !sinAnimacion.matches || brillosElegidos;

function leerPreferencia() {
  try { return localStorage.getItem(CLAVE_BRILLOS) === 'si'; } catch { return false; }
}

const capa = document.createElement('div');
capa.className = 'brillos';
capa.setAttribute('aria-hidden', 'true');
document.body.append(capa);

const azar = (min, max) => min + Math.random() * (max - min);
const colorAzar = () => COLORES[Math.floor(Math.random() * COLORES.length)];

function centro(elemento) {
  const r = elemento.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

function particula(tamano, color, tipo = Math.random() < 0.65 ? 'destello' : 'chispa') {
  const nodo = document.createElement('span');
  nodo.className = tipo;
  nodo.style.width = nodo.style.height = tamano + 'px';
  nodo.style.background = color;
  if (tipo === 'chispa') nodo.style.boxShadow = `0 0 ${tamano * 1.5}px ${color}`;
  capa.append(nodo);
  return nodo;
}

const transformar = (x, y, escala, giro) => `translate(${x}px, ${y}px) translate(-50%, -50%) scale(${escala}) rotate(${giro}deg)`;

function animar(nodo, cuadros, opciones, alTerminar) {
  const animacion = nodo.animate(cuadros, { fill: 'both', ...opciones });
  animacion.onfinish = () => { nodo.remove(); alTerminar?.(); };
}

function estallido(punto, cantidad) {
  for (let i = 0; i < cantidad; i += 1) {
    const angulo = azar(0, Math.PI * 2);
    const distancia = azar(24, 62);
    animar(particula(azar(6, 13), colorAzar()), [
      { transform: transformar(punto.x, punto.y, 0.4, 0), opacity: 1 },
      { transform: transformar(punto.x + Math.cos(angulo) * distancia, punto.y + Math.sin(angulo) * distancia, 0, azar(120, 300)), opacity: 0 },
    ], { duration: azar(420, 700), easing: 'cubic-bezier(.15,.7,.3,1)' });
  }
}

function cuadrosRuta(a, b, alturaArco, { desvio = 0, escala, giro, opacidad }) {
  const control = { x: (a.x + b.x) / 2 + desvio, y: alturaArco };
  const cuadros = [];
  for (let i = 0; i <= 18; i += 1) {
    const t = i / 18;
    const u = t * t * (3 - 2 * t);
    const v = 1 - u;
    cuadros.push({
      transform: transformar(
        v * v * a.x + 2 * v * u * control.x + u * u * b.x + desvio * Math.sin(t * Math.PI) * 0.3,
        v * v * a.y + 2 * v * u * control.y + u * u * b.y,
        escala(t),
        giro * t,
      ),
      opacity: opacidad(t),
    });
  }
  return cuadros;
}

// Lanza el brillo desde `origen` hasta `destino` y llama a `alLlegar` una sola vez.
export function volarAlCarrito(origen, destino, alLlegar) {
  if (!hayBrillos()) { alLlegar(); return; }

  let llego = false;
  const llegar = () => {
    if (llego) return;
    llego = true;
    alLlegar();
    if (document.hidden) return;
    estallido(centro(destino), 12);
    destino.animate(
      [{ transform: 'scale(1)' }, { transform: 'scale(1.18)' }, { transform: 'scale(1)' }],
      { duration: 320, easing: 'ease-out' },
    );
  };

  const a = centro(origen);
  const b = centro(destino);
  const alturaArco = Math.max(20, Math.min(a.y, b.y) - azar(70, 150));

  animar(particula(30, '#ffd76a', 'destello'), cuadrosRuta(a, b, alturaArco, {
    escala: t => 0.7 + Math.sin(t * Math.PI) * 0.7,
    giro: 540,
    opacidad: () => 1,
  }), { duration: DURACION_VUELO }, llegar);
  setTimeout(llegar, DURACION_VUELO + 250);

  for (let i = 0; i < 14; i += 1) {
    animar(particula(azar(5, 12), colorAzar()), cuadrosRuta(a, b, alturaArco, {
      desvio: azar(-46, 46),
      escala: t => 1 - t * 0.5,
      giro: azar(-360, 360),
      opacidad: t => (t < 0.8 ? 1 : (1 - t) * 5),
    }), { duration: DURACION_VUELO, delay: i * 32 });
  }
}

// El botón solo aparece a quienes tienen las animaciones desactivadas en su sistema.
export function activarBotonBrillos(boton) {
  const pintar = () => {
    boton.hidden = !sinAnimacion.matches;
    boton.textContent = brillosElegidos ? 'Apagar brillos' : 'Activar brillos ✨';
  };
  boton.onclick = () => {
    brillosElegidos = !brillosElegidos;
    try { localStorage.setItem(CLAVE_BRILLOS, brillosElegidos ? 'si' : 'no'); } catch { /* aplica solo a esta visita */ }
    pintar();
  };
  sinAnimacion.addEventListener('change', pintar);
  pintar();
}

export function activarEstelaMouse() {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  let ultimo = { x: 0, y: 0, tiempo: 0 };
  let activas = 0;

  window.addEventListener('pointermove', evento => {
    if (!hayBrillos() || evento.pointerType !== 'mouse' || activas >= MAX_ESTELA) return;
    const ahora = performance.now();
    if (ahora - ultimo.tiempo < 28 || Math.hypot(evento.clientX - ultimo.x, evento.clientY - ultimo.y) < 16) return;
    ultimo = { x: evento.clientX, y: evento.clientY, tiempo: ahora };

    activas += 1;
    const x = evento.clientX + azar(-8, 8);
    const y = evento.clientY + azar(-8, 8);
    animar(particula(azar(6, 15), colorAzar()), [
      { transform: transformar(x, y, 0.3, 0), opacity: 0.95 },
      { transform: transformar(x + azar(-10, 10), y + 8, 1, 90), opacity: 0.9, offset: 0.25 },
      { transform: transformar(x + azar(-22, 22), y + azar(26, 58), 0, azar(180, 360)), opacity: 0 },
    ], { duration: azar(550, 950), easing: 'ease-out' }, () => { activas -= 1; });
  }, { passive: true });
}
