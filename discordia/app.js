// app.js — Bootstrap de Discordia
// Compatible con el nuevo index.html refactorizado

import { getCatalog, renderCatalog, initCatalog, setFilters } from './catalog.js';
import { CONFIG } from './config.js';

// ── CONFIGURACIÓN DE CONTACTO ─────────────────────────────
document.querySelectorAll('[data-contact-email]').forEach(n => {
  n.textContent = CONFIG.ADMIN_EMAIL;
});
document.querySelectorAll('.contact-whatsapp').forEach(n => {
  n.setAttribute('href', `https://wa.me/${CONFIG.WHATSAPP_PHONE}`);
});

// ── HERO PRODUCT PREVIEW ──────────────────────────────────
function renderHeroProductPreview() {
  const container = document.getElementById('heroProductPreview');
  if (!container) return;

  const items = getCatalog().filter(p => p.stock > 0).slice(0, 4);
  container.innerHTML = '';

  if (!items.length) {
    container.innerHTML = `
      <div class="col-span-full bg-white/20 backdrop-blur-sm rounded-2xl p-5 text-center text-white/70 text-sm">
        Cargando productos...
      </div>
    `;
    return;
  }

  items.forEach(product => {
    const card = document.createElement('a');
    card.href = '#catalogo';
    card.className = 'flex-none w-[72%] sm:w-[48%] lg:w-auto snap-start bg-white/95 backdrop-blur-sm rounded-2xl border border-white/50 overflow-hidden shadow-lg hover:shadow-xl transition hover:-translate-y-1 block';
    card.innerHTML = `
      <div class="aspect-square bg-gradient-to-br from-[#fdf2f7] to-[#fff5f8] overflow-hidden">
        <img src="${product.image || './assets/default.png'}"
          alt="${product.name}"
          class="w-full h-full object-cover hover:scale-105 transition duration-300"
          onerror="this.src='./assets/default.png'; this.onerror=null;">
      </div>
      <div class="p-3">
        <p class="font-bold text-xs text-[#6d165a] line-clamp-2 min-h-[2rem] leading-snug">${product.name}</p>
        <div class="flex items-center justify-between mt-2">
          <p class="font-extrabold text-base text-[#a0346e]">$${product.price.toLocaleString('es-CO')}</p>
          <span class="text-[10px] text-gray-400">Stock: ${product.stock}</span>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

// ── CATEGORY PILLS DINÁMICAS ──────────────────────────────
// Las genera basándose en las categorías reales de la BD
function buildCategoryPills() {
  const container = document.getElementById('categoryPills');
  if (!container) return;

  const catalog = getCatalog();
  const cats = Array.from(new Set(catalog.map(p => p.category).filter(Boolean))).sort();

  // Mantener el botón "Todas" y agregar el resto
  container.innerHTML = `
    <button onclick="filterByCategory('all')" data-cat="all"
      class="cat-pill px-4 py-2 rounded-full text-sm font-semibold border border-[#ecd9ff] bg-[#ecd9ff] text-white transition">
      Todas
    </button>
    ${cats.map(cat => `
      <button onclick="filterByCategory('${cat}')" data-cat="${cat}"
        class="cat-pill px-4 py-2 rounded-full text-sm font-semibold border border-gray-200 bg-white text-gray-700 hover:border-[#ecd9ff] hover:text-[#6d165a] transition">
        ${cat}
      </button>
    `).join('')}
  `;
}

// ── INICIALIZACIÓN PRINCIPAL ──────────────────────────────
// Orden: init BD → render hero → pills → catálogo
initCatalog().then(() => {
  renderHeroProductPreview();
  buildCategoryPills();
  renderCatalog('catalog');
});
