import { renderCatalog } from '../catalog.js';

// Filters component: reads catalog via window.getCatalog() (catalog exposes it)
export function setupFilters() {
    const searchInput = document.getElementById('searchInput');
    const searchSpinner = document.getElementById('searchSpinner');
    const categoryContainer = document.getElementById('categoryFilters');
    const categoryContainerMobile = document.getElementById('categoryFiltersMobile');
    const priceMin = document.getElementById('priceMin');
    const priceMax = document.getElementById('priceMax');
    const priceMinMobile = document.getElementById('priceMinMobile');
    const priceMaxMobile = document.getElementById('priceMaxMobile');
    const priceRange1 = document.getElementById('priceRange1');
    const priceRange2 = document.getElementById('priceRange2');
    const priceRange3 = document.getElementById('priceRange3');
    const priceRange1Mobile = document.getElementById('priceRange1Mobile');
    const priceRange2Mobile = document.getElementById('priceRange2Mobile');
    const priceRange3Mobile = document.getElementById('priceRange3Mobile');

    // Crear lista de categorías únicas usando window.getCatalog()
    const catalog = (typeof window.getCatalog === 'function') ? window.getCatalog() : (window.__SKC_CATALOG__ || []);
    const categories = Array.from(new Set(catalog.map(p => p.category).filter(Boolean)));

    if (categoryContainer) {
        categoryContainer.innerHTML = `<button class="px-3 py-1 mr-2 mb-2 bg-gray-100 rounded active" data-cat="all">Todas</button>` +
            categories.map(c => `<button class="px-3 py-1 mr-2 mb-2 bg-gray-100 rounded" data-cat="${c}">${c}</button>`).join('');

        categoryContainer.addEventListener('click', (e) => {
            const btn = e.target.closest('button');
            if (!btn) return;
            categoryContainer.querySelectorAll('button').forEach(b => b.classList.remove('active', 'bg-yellow-200'));
            btn.classList.add('active', 'bg-yellow-200');
            applyFilters();
        });
    }

    if (categoryContainerMobile) {
        categoryContainerMobile.innerHTML = `<button class="px-3 py-1 mr-2 mb-2 bg-gray-100 rounded active" data-cat="all">Todas</button>` +
            categories.map(c => `<button class="px-3 py-1 mr-2 mb-2 bg-gray-100 rounded" data-cat="${c}">${c}</button>`).join('');

        categoryContainerMobile.addEventListener('click', (e) => {
            const btn = e.target.closest('button');
            if (!btn) return;
            categoryContainerMobile.querySelectorAll('button').forEach(b => b.classList.remove('active', 'bg-yellow-200'));
            btn.classList.add('active', 'bg-yellow-200');
            applyFilters();
        });
    }

    // Search
    if (searchInput) {
        let to;
        searchInput.addEventListener('input', () => {
            if (searchSpinner) searchSpinner.classList.remove('hidden');
            clearTimeout(to);
            to = setTimeout(() => {
                applyFilters();
                // Scroll to catalog after filtering
                const catalogSection = document.getElementById('productos');
                if (catalogSection) {
                    catalogSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 250);
        });
    }

    // Price inputs
    if (priceMin) priceMin.addEventListener('input', applyFilters);
    if (priceMax) priceMax.addEventListener('input', applyFilters);
    if (priceMinMobile) priceMinMobile.addEventListener('input', applyFilters);
    if (priceMaxMobile) priceMaxMobile.addEventListener('input', applyFilters);

    // Price range checkboxes
    function handlePriceRange(checkbox, min, max) {
        if (checkbox.checked) {
            // Desmarcar otros
            [priceRange1, priceRange2, priceRange3, priceRange1Mobile, priceRange2Mobile, priceRange3Mobile].forEach(cb => {
                if (cb && cb !== checkbox) cb.checked = false;
            });
            // Setear inputs
            if (priceMin) priceMin.value = min;
            if (priceMax) priceMax.value = max === Infinity ? '' : max;
            if (priceMinMobile) priceMinMobile.value = min;
            if (priceMaxMobile) priceMaxMobile.value = max === Infinity ? '' : max;
            applyFilters();
        } else {
            // Si se desmarca, limpiar
            if (priceMin) priceMin.value = '';
            if (priceMax) priceMax.value = '';
            if (priceMinMobile) priceMinMobile.value = '';
            if (priceMaxMobile) priceMaxMobile.value = '';
            applyFilters();
        }
    }

    if (priceRange1) priceRange1.addEventListener('change', () => handlePriceRange(priceRange1, 10000, 30000));
    if (priceRange2) priceRange2.addEventListener('change', () => handlePriceRange(priceRange2, 30000, 50000));
    if (priceRange3) priceRange3.addEventListener('change', () => handlePriceRange(priceRange3, 50000, Infinity));
    if (priceRange1Mobile) priceRange1Mobile.addEventListener('change', () => handlePriceRange(priceRange1Mobile, 10000, 30000));
    if (priceRange2Mobile) priceRange2Mobile.addEventListener('change', () => handlePriceRange(priceRange2Mobile, 30000, 50000));
    if (priceRange3Mobile) priceRange3Mobile.addEventListener('change', () => handlePriceRange(priceRange3Mobile, 50000, Infinity));

    function applyFilters() {
        const search = (searchInput && searchInput.value) || '';
        const activeBtn = (categoryContainer && categoryContainer.querySelector('button.active')) || (categoryContainerMobile && categoryContainerMobile.querySelector('button.active'));
        const category = activeBtn ? activeBtn.dataset.cat : 'all';

        const minVal = (priceMin && priceMin.value !== '') ? parseFloat(priceMin.value) : ((priceMinMobile && priceMinMobile.value !== '') ? parseFloat(priceMinMobile.value) : 0);
        const maxVal = (priceMax && priceMax.value !== '') ? parseFloat(priceMax.value) : ((priceMaxMobile && priceMaxMobile.value !== '') ? parseFloat(priceMaxMobile.value) : Infinity);

        renderCatalog('catalog', { search, category, priceMin: minVal, priceMax: maxVal });
        if (searchSpinner) searchSpinner.classList.add('hidden');
    }
}
