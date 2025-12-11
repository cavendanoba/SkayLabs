import { renderCatalog } from './catalog.js';

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
