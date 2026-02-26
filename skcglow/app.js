import { renderCatalog } from './catalog.js';
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

// Render del catálogo principal
renderCatalog('catalog');

