import { getCatalog, renderCatalog } from './catalog.js';
import { CONFIG } from './config.js';

function ensureAosVisibilityFallback() {
    document.querySelectorAll('[data-aos]').forEach((el) => {
        el.classList.add('aos-animate');
        el.style.opacity = '1';
        el.style.transform = 'none';
    });
}

if (typeof window !== 'undefined' && window.AOS && typeof window.AOS.init === 'function') {
    window.AOS.init({
        duration: 900,
        once: true
    });
} else {
    ensureAosVisibilityFallback();
}

// Typed.js hero text
if (typeof window !== 'undefined' && typeof window.Typed === 'function') {
    new window.Typed('#typed', {
        strings: [
            'Belleza auténtica para tu rutina real',
            'Productos curados, precio justo y resultado visible',
            'DISCORDIA: maquillaje con identidad ✨'
        ],
        typeSpeed: 50,
        backSpeed: 30,
        loop: true
    });
} else {
    const typedNode = document.getElementById('typed');
    if (typedNode) {
        typedNode.textContent = 'Belleza auténtica para tu rutina real';
    }
}

// Mobile menu toggle
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const mobileMenu = document.getElementById('mobileMenu');
if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener('click', () => {
        mobileMenu.classList.toggle('hidden');
    });
    // Close menu when clicking on a link
    mobileMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            mobileMenu.classList.add('hidden');
        });
    });
}

// Configurar datos de contacto desde config
document.querySelectorAll('[data-contact-email]').forEach((node) => {
    node.textContent = CONFIG.ADMIN_EMAIL;
});

document.querySelectorAll('.contact-whatsapp').forEach((node) => {
    node.setAttribute('href', `https://wa.me/${CONFIG.WHATSAPP_PHONE}`);
});

function renderHeroProductPreview() {
    const previewContainer = document.getElementById('heroProductPreview');
    if (!previewContainer) return;

    const items = getCatalog().filter((item) => item.stock > 0).slice(0, 4);
    previewContainer.innerHTML = '';

    if (!items.length) {
        previewContainer.innerHTML = `
            <div class="col-span-full bg-white rounded-2xl border border-gray-200 p-5 text-center text-sm text-gray-600">
                Estamos actualizando productos, vuelve a intentar en unos minutos.
            </div>
        `;
        return;
    }

    items.forEach((product) => {
        const card = document.createElement('a');
        card.href = '#productos';
        card.className = 'flex-none w-[72%] sm:w-[48%] md:w-auto snap-start bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition block';
        card.innerHTML = `
            <div class="aspect-square bg-[#f9edf2] overflow-hidden">
                <img src="${product.image || './assets/default.png'}"
                    alt="${product.name}"
                    class="w-full h-full object-cover"
                    onerror="this.src='./assets/default.png'; this.onerror=null;">
            </div>
            <div class="p-3">
                <p class="font-bold text-xs md:text-sm text-[#6d165a] line-clamp-2 min-h-[2.2rem]">${product.name}</p>
                <div class="flex items-center justify-between mt-2">
                    <p class="font-extrabold text-lg text-[#a0346e]">$${product.price.toLocaleString()}</p>
                    <span class="text-[11px] text-gray-500">Stock: ${product.stock}</span>
                </div>
            </div>
        `;
        previewContainer.appendChild(card);
    });
}

renderHeroProductPreview();

// Render del catálogo principal
renderCatalog('catalog');

