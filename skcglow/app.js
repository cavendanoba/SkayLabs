import { renderCatalog } from './catalog.js';
import { setupFilters } from './components/filters.js';

AOS.init({
    duration: 900,
    once: true
});

// Typed.js hero text
new Typed("#typed", {
    strings: [
        "Traemos los productos que más buscas",
        "A los mejores precios de Bogotá",
        "Belleza, estilo y calidad ✨"
    ],
    typeSpeed: 50,
    backSpeed: 30,
    loop: true
});

// Renderizado e inicialización se realizan en DOMContentLoaded

// Inicializar filtros y renderizar catálogo
document.addEventListener('DOMContentLoaded', () => {
    try {
        setupFilters();
        renderCatalog('catalog');
    } catch (e) {
        console.error('Error inicializando catalogo:', e);
    }

    // Register Service Worker for PWA
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/skcglow/sw.js')
            .then(() => console.log('Service Worker registered'))
            .catch(err => console.log('Service Worker registration failed', err));
    }
    // Mobile nav toggle
    const mobileBtn = document.getElementById('mobileMenuBtn');
    const mobileNav = document.getElementById('mobileNav');
    if (mobileBtn && mobileNav) {
        mobileBtn.addEventListener('click', () => {
            mobileNav.classList.toggle('hidden');
        });
    }

    // Mobile filters toggle
    const toggleFilters = document.getElementById('toggleFilters');
    const mobileFiltersModal = document.getElementById('mobileFiltersModal');
    const closeMobileFilters = document.getElementById('closeMobileFilters');
    if (toggleFilters && mobileFiltersModal) {
        toggleFilters.addEventListener('click', () => {
            mobileFiltersModal.classList.remove('hidden');
        });
    }
    if (closeMobileFilters) {
        closeMobileFilters.addEventListener('click', () => {
            mobileFiltersModal.classList.add('hidden');
        });
    }
    if (mobileFiltersModal) {
        mobileFiltersModal.addEventListener('click', (e) => {
            if (e.target === mobileFiltersModal) {
                mobileFiltersModal.classList.add('hidden');
            }
        });
    }

    // Load more button
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const loadMoreContainer = document.getElementById('loadMoreContainer');
    if (loadMoreBtn && loadingSpinner && loadMoreContainer) {
        loadMoreBtn.addEventListener('click', () => {
            loadMoreContainer.classList.add('hidden');
            loadingSpinner.classList.remove('hidden');
            // Simular carga de más productos
            setTimeout(() => {
                // Aquí se podría extender el catálogo o recargar con más items
                // Por simplicidad, solo ocultar spinner
                loadingSpinner.classList.add('hidden');
                loadMoreContainer.classList.remove('hidden');
            }, 2000);
        });
    }

    // Theme toggle
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark');
            themeToggle.textContent = document.body.classList.contains('dark') ? '☀️' : '🌙';
        });
    }

    // Parallax effect for hero
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const hero = document.querySelector('.hero-section');
        if (hero) {
            hero.style.transform = `translateY(${scrolled * 0.3}px)`;
        }
    });

    // Mouse sparkle / star effect
    (function setupSparkles() {
        let last = 0;
        const throttle = 35; // ms between sparks
        const colors = ['#fff6e6', '#ffd1e6', '#ffe3b3', '#ffc4a6'];

        function createSpark(x, y) {
            const span = document.createElement('div');
            span.className = 'sparkle';
            span.style.left = x + 'px';
            span.style.top = y + 'px';
            const color = colors[Math.floor(Math.random() * colors.length)];
            span.innerHTML = `
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2 L13.5 8 L20 9.2 L14.5 13.2 L15.6 19.7 L12 16.7 L8.4 19.7 L9.5 13.2 L4 9.2 L10.5 8 L12 2 Z" fill="${color}" />
                </svg>
            `;

            document.body.appendChild(span);

            // Remove after animation completes
            setTimeout(() => {
                span.remove();
            }, 950);
        }

        window.addEventListener('mousemove', (e) => {
            const now = Date.now();
            if (now - last < throttle) return;
            last = now;
            // slightly randomize position for scattered effect
            const rx = e.clientX + (Math.random() * 12 - 6);
            const ry = e.clientY + (Math.random() * 12 - 6);
            createSpark(rx, ry);
            // occasional extra small spark
            if (Math.random() > 0.75) createSpark(rx + 6, ry - 6);
        });
    })();
});
