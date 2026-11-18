// discordia/modules/ui.js
// Utilidades compartidas por las vistas del panel admin.

// ── UTILIDADES ────────────────────────────────────────────────
export function esc(v) {
  return String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

const VERSION_FOTOS = '2';
export function foto(src) {
  if (!src || /default\.png/.test(src)) return './assets/default.png';
  if (/^(https?:|\/api\/)/.test(src)) return src;
  return `${src.startsWith('/') ? src : './' + src}?v=${VERSION_FOTOS}`;
}

export function toast(msg, error = false) {
  const t = document.createElement('div');
  t.className = 'toast' + (error ? ' err' : '');
  t.setAttribute('role', 'status');
  t.textContent = String(msg).replace(/^[✓✔]\s*/, '');
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3200);
}

export const NOMBRES_CATEGORIA = {
  LABI: 'Labios', OJOS: 'Ojos', CEJAS: 'Cejas', PIEL: 'Piel', SKIN: 'Cuidado de la piel', ACCE: 'Accesorios'
};
export const COLOR_CATEGORIA = { LABI: 'var(--c1)', OJOS: 'var(--c2)', PIEL: 'var(--c3)', CEJAS: 'var(--c4)', SKIN: 'var(--c5)', ACCE: 'var(--c6)' };
export const nombreCategoria = c => NOMBRES_CATEGORIA[c] || c || 'Sin categoría';

// "Otro" (0001) es un comodín interno de ventas; no cuenta como producto del catálogo.
export const esProductoReal = p => p && p.code !== '0001';
export const sinFoto = p => !p.image || /default\.png/.test(p.image);

// ── ÍCONOS ────────────────────────────────────────────────────
export const svg = d => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
export const ICONOS = {
  dashboard: svg('<rect x="3" y="3" width="7" height="9" rx="2"/><rect x="14" y="3" width="7" height="5" rx="2"/><rect x="14" y="12" width="7" height="9" rx="2"/><rect x="3" y="16" width="7" height="5" rx="2"/>'),
  catalog:   svg('<path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8Z"/><circle cx="7.5" cy="7.5" r="1.5"/>'),
  sales:     svg('<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18M16 10a4 4 0 0 1-8 0"/>'),
  debts:     svg('<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h4"/>'),
  customers: svg('<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>'),
  search:    svg('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>'),
  plus:      svg('<path d="M12 5v14M5 12h14"/>'),
  edit:      svg('<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>'),
  off:       svg('<circle cx="12" cy="12" r="9"/><path d="m5.7 5.7 12.6 12.6"/>'),
  on:        svg('<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>'),
  offers:    svg('<path d="M19 5 5 19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>'),
  phone:     svg('<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2Z"/>'),
};


// Un producto está en oferta cuando su precio de referencia ("antes") es mayor que el precio.
export const enOferta = p => Number(p.price) > 0 && Number(p.reference_price) > Number(p.price);
export const pctOferta = p => enOferta(p) ? Math.round((1 - Number(p.price) / Number(p.reference_price)) * 100) : 0;
