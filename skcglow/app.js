import { renderCatalog } from './catalog.js';
import { CONFIG } from './config.js';

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

