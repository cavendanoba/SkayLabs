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

// Renderizamos el catálogo desde catalog.js en el contenedor con id "catalog"
renderCatalog("catalog");

// Aplicar configuración centralizada a enlaces de WhatsApp
document.querySelectorAll('a.contact-whatsapp, a[href*="wa.me/"], a[href*="whatsapp.com"]').forEach((link) => {
    link.href = `https://wa.me/${CONFIG.WHATSAPP_PHONE}`;
});

// Aplicar configuración centralizada al email visible de contacto
const emailNode = document.querySelector('[data-contact-email]');
if (emailNode) emailNode.textContent = CONFIG.ADMIN_EMAIL;
