// catalogo.js — Catálogo público de DISCORDIA.
// Los tonos no son una tabla aparte: cada tono es una fila de products con código BASE#TONO.
// Aquí se agrupan en una sola tarjeta con botones. Agregar un tono = crear un producto con ese código.

import { CONFIG } from './config.js';
import { fetchProducts } from './products.js';
import { volarAlCarrito, activarEstelaMouse, activarBotonBrillos } from './brillos.js?v=4';

const CLAVE_CARRITO = 'discordia-carrito';
const IMAGEN_VACIA = 'assets/default.png';
const NOMBRES_CATEGORIA = { LABI: 'Labios', OJOS: 'Ojos', CEJAS: 'Cejas', PIEL: 'Piel', SKIN: 'Cuidado de la piel', ACCE: 'Accesorios' };
const ORDEN_CATEGORIA = Object.values(NOMBRES_CATEGORIA);
const CODIGO_TONO = /^(.+?)\s*#\s*([\w.-]+)$/;
const SIN_DESCRIPCION = 'Pronto agregaremos más información de este producto.';

const $ = id => document.getElementById(id);
const fmt = n => '$' + Number(n).toLocaleString('es-CO', { maximumFractionDigits: 0 });
const normalizar = t => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

function el(tag, props = {}, ...hijos) {
  const nodo = document.createElement(tag);
  Object.assign(nodo, props);
  nodo.append(...hijos);
  return nodo;
}

function leerCarrito() {
  try { return JSON.parse(localStorage.getItem(CLAVE_CARRITO)) || {}; } catch { return {}; }
}

let grupos = [];
let carrito = leerCarrito();
let filtro = 'Todas';
let busqueda = '';
const seleccion = new Map();
let foco = null;
let enVuelo = 0;

function rutaImagen(ruta) {
  if (!ruta || ruta === IMAGEN_VACIA) return null;
  return /^(https?:)?\//.test(ruta) ? ruta : './' + ruta;
}

const urlImagen = p => rutaImagen(p.image);

function fotosDe(p) {
  let galeria = p.gallery;
  if (typeof galeria === 'string') {
    try { galeria = JSON.parse(galeria); } catch { galeria = []; }
  }
  // Algunas fotos quedaron guardadas como texto '["/ruta"]'; se desempacan aquí.
  const extras = (Array.isArray(galeria) ? galeria : []).flatMap(g => {
    if (typeof g !== 'string' || !g.startsWith('[')) return [g];
    try { return JSON.parse(g); } catch { return []; }
  });
  const rutas = [p.image, ...extras].map(rutaImagen).filter(Boolean);
  return [...new Set(rutas)];
}

function agrupar(productos) {
  const mapa = new Map();
  productos
    .filter(p => p.category && p.category !== 'N/A' && p.code !== '0001')
    .forEach(p => {
      const m = String(p.code || '').match(CODIGO_TONO);
      const clave = m ? p.category + '|' + m[1].trim().toUpperCase() : 'id|' + p.id;
      if (!mapa.has(clave)) mapa.set(clave, { clave, categoria: NOMBRES_CATEGORIA[p.category] || p.category, items: [] });
      mapa.get(clave).items.push({ ...p, price: Number(p.price), stock: Number(p.stock), tono: m ? m[2] : null });
    });

  return [...mapa.values()].map(g => {
    g.items.sort((a, b) => String(a.tono).localeCompare(String(b.tono), 'es', { numeric: true }));
    g.conTonos = g.items.length > 1;
    g.titulo = g.conTonos ? g.items[0].name.replace(/\s*#\s*[\w.-]+\s*$/, '') : g.items[0].name;
    g.texto = normalizar(g.titulo + ' ' + g.items.map(i => i.name + ' ' + i.code).join(' '));
    return g;
  });
}

function seleccionado(g) {
  const id = seleccion.get(g.clave);
  return g.items.find(i => i.id === id) || g.items.find(i => i.stock > 0) || g.items[0];
}

function categorias() {
  const hay = new Set(grupos.map(g => g.categoria));
  const conocidas = ORDEN_CATEGORIA.filter(c => hay.has(c));
  return ['Todas', ...conocidas, ...[...hay].filter(c => !ORDEN_CATEGORIA.includes(c))];
}

function pintarCategorias() {
  $('categorias').replaceChildren(...categorias().map(c => {
    const b = el('button', { type: 'button', textContent: c, className: c === filtro ? 'activa' : '' });
    b.setAttribute('aria-pressed', String(c === filtro));
    b.onclick = () => { filtro = c; pintarCategorias(); pintarCatalogo(); };
    return b;
  }));
}

function pintarFoto(contenedor, g, p) {
  const url = urlImagen(p);
  if (!url) { contenedor.replaceChildren('Foto próximamente'); return; }
  const img = el('img', { src: url, alt: g.titulo, loading: 'lazy' });
  img.onerror = () => contenedor.replaceChildren('Foto próximamente');
  contenedor.replaceChildren(img);
}

function tarjeta(g) {
  const foto = el('button', { type: 'button', className: 'foto', onclick: () => abrirDetalle(g, seleccionado(g)) });
  foto.setAttribute('aria-label', 'Ver detalles de ' + g.titulo);
  const precio = el('p', { className: 'precio' });
  const boton = el('button', { type: 'button', className: 'agregar' });
  const tarjetaNodo = el('article', { className: 'card' }, foto, el('h3', { textContent: g.titulo }), precio);
  let botonesTono = [];

  function actualizar() {
    const p = seleccionado(g);
    const hay = p.stock > 0;
    pintarFoto(foto, g, p);
    precio.textContent = fmt(p.price);
    tarjetaNodo.classList.toggle('sin-stock', !hay);
    boton.disabled = !hay;
    boton.textContent = hay ? 'Agregar' : 'Agotado';
    botonesTono.forEach(([b, item]) => {
      b.classList.toggle('activo', item.id === p.id);
      b.setAttribute('aria-pressed', String(item.id === p.id));
    });
  }

  if (g.conTonos) {
    botonesTono = g.items.map(item => {
      const b = el('button', { type: 'button', textContent: item.tono, disabled: item.stock <= 0 });
      b.setAttribute('aria-label', 'Tono ' + item.tono + (item.stock > 0 ? '' : ', agotado'));
      b.onclick = () => { seleccion.set(g.clave, item.id); actualizar(); };
      return [b, item];
    });
    const fila = el('div', { className: 'tonos' }, ...botonesTono.map(([b]) => b));
    fila.setAttribute('role', 'group');
    fila.setAttribute('aria-label', 'Tonos de ' + g.titulo);
    tarjetaNodo.append(fila);
  }

  boton.onclick = () => {
    const p = seleccionado(g);
    if ((carrito[p.id] || 0) >= p.stock) {
      boton.textContent = 'Máximo disponible';
      setTimeout(actualizar, 1200);
      return;
    }
    carrito[p.id] = (carrito[p.id] || 0) + 1;
    enVuelo += 1;
    guardarCarrito();
    volarAlCarrito(boton, $('abrirCarrito'), () => {
      enVuelo -= 1;
      pintarCarrito();
    });
  };

  tarjetaNodo.append(boton);
  actualizar();
  return tarjetaNodo;
}

function mostrarFotoDetalle(url, titulo) {
  const contenedor = $('detalleFoto');
  if (!url) { contenedor.replaceChildren('Foto próximamente'); return; }
  contenedor.replaceChildren(el('img', { src: url, alt: titulo }));
}

function abrirDetalle(g, p) {
  const titulo = g.conTonos ? g.titulo + ' · Tono ' + p.tono : g.titulo;
  const fotos = fotosDe(p);
  const descripcion = String(p.description || '').trim();

  $('detalleTitulo').textContent = titulo;
  $('detalleMarca').textContent = p.brand || '';
  $('detalleMarca').hidden = !p.brand;
  $('detallePrecio').textContent = fmt(p.price);
  $('detalleTexto').textContent = descripcion && !descripcion.startsWith('Pendiente de precio') ? descripcion : SIN_DESCRIPCION;
  mostrarFotoDetalle(fotos[0], titulo);

  $('detalleMiniaturas').replaceChildren(...(fotos.length > 1 ? fotos : []).map((url, i) => {
    const b = el('button', { type: 'button', onclick: () => mostrarFotoDetalle(url, titulo) }, el('img', { src: url, alt: '' }));
    b.setAttribute('aria-label', 'Ver foto ' + (i + 1));
    return b;
  }));
  $('detalle').showModal();
}

function pintarCatalogo() {
  const q = normalizar(busqueda);
  const secciones = (filtro === 'Todas' ? categorias().slice(1) : [filtro]).map(cat => {
    const lista = grupos.filter(g => g.categoria === cat && (!q || g.texto.includes(q)));
    if (!lista.length) return null;
    return el('section', {}, el('h2', { className: 'titulo-cat', textContent: cat }), el('div', { className: 'grid' }, ...lista.map(tarjeta)));
  }).filter(Boolean);

  $('catalogo').replaceChildren(...(secciones.length ? secciones : [el('p', { className: 'vacio', textContent: 'No encontramos productos con esa búsqueda.' })]));
}

function lineas() {
  const todos = grupos.flatMap(g => g.items.map(p => ({ g, p })));
  return Object.entries(carrito).flatMap(([id, cant]) => {
    const encontrado = todos.find(x => String(x.p.id) === id);
    if (!encontrado || encontrado.p.stock <= 0) return [];
    const { g, p } = encontrado;
    return [{ p, cant: Math.min(cant, p.stock), nombre: g.conTonos ? g.titulo + ' · Tono ' + p.tono : g.titulo }];
  });
}

function guardarCarrito() {
  try { localStorage.setItem(CLAVE_CARRITO, JSON.stringify(carrito)); } catch { /* el pedido sigue en memoria */ }
  pintarCarrito();
}

function cambiar(id, delta) {
  carrito[id] = (carrito[id] || 0) + delta;
  if (carrito[id] <= 0) delete carrito[id];
  guardarCarrito();
}

function pintarCarrito() {
  const ls = lineas();
  let total = 0;
  let unidades = 0;
  $('items').replaceChildren(...ls.map(({ p, cant, nombre }) => {
    total += p.price * cant;
    unidades += cant;
    const menos = el('button', { type: 'button', textContent: '−', onclick: () => cambiar(p.id, -1) });
    menos.setAttribute('aria-label', 'Quitar uno de ' + nombre);
    const mas = el('button', { type: 'button', textContent: '+', disabled: cant >= p.stock, onclick: () => cambiar(p.id, 1) });
    mas.setAttribute('aria-label', 'Agregar uno de ' + nombre);
    return el('li', {},
      el('div', {}, el('div', { className: 'linea-nombre', textContent: nombre }), el('div', { className: 'linea-precio', textContent: fmt(p.price * cant) })),
      el('div', { className: 'linea-botones' }, menos, el('span', { textContent: String(cant) }), mas));
  }));
  $('total').textContent = fmt(total);
  $('contador').textContent = String(Math.max(0, unidades - enVuelo));
  $('carritoVacio').hidden = ls.length > 0;
  $('enviar').disabled = ls.length === 0;
}

function abrirCarrito() {
  foco = document.activeElement;
  $('carrito').hidden = false;
  $('fondoCarrito').hidden = false;
  $('cerrarCarrito').focus();
}

function cerrarCarrito() {
  $('carrito').hidden = true;
  $('fondoCarrito').hidden = true;
  foco?.focus();
}

$('enviar').onclick = () => {
  const ls = lineas();
  if (!ls.length) return;
  let total = 0;
  const texto = ls.map(({ p, cant, nombre }) => {
    total += p.price * cant;
    return `• ${cant} x ${nombre} (${fmt(p.price * cant)})`;
  }).join('\n');
  const mensaje = `Hola Discordia, quiero pedir:\n\n${texto}\n\nTotal: ${fmt(total)}`;
  window.open(`https://wa.me/${CONFIG.WHATSAPP_PHONE}?text=${encodeURIComponent(mensaje)}`, '_blank', 'noopener');
};

$('abrirCarrito').onclick = abrirCarrito;
$('cerrarCarrito').onclick = cerrarCarrito;
$('fondoCarrito').onclick = cerrarCarrito;
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('carrito').hidden) cerrarCarrito(); });
$('cerrarDetalle').onclick = () => $('detalle').close();
$('detalle').addEventListener('click', e => { if (e.target === $('detalle')) $('detalle').close(); });
$('buscar').addEventListener('input', e => { busqueda = e.target.value; pintarCatalogo(); });

async function cargar() {
  const productos = await fetchProducts();
  grupos = agrupar(productos);
  if (!grupos.length) {
    $('catalogo').replaceChildren(el('p', { className: 'vacio', textContent: 'No pudimos cargar el catálogo. Intenta de nuevo en un momento.' }));
    return;
  }
  pintarCategorias();
  pintarCatalogo();
  pintarCarrito();
}

activarEstelaMouse();
activarBotonBrillos($('activarBrillos'));
cargar();
