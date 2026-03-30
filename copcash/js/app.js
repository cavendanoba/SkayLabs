/**
 * App - Punto de entrada principal
 */
import { Model } from "./model.js";
import { View } from "./view.js";
import { Controller } from "./controller.js";

// Inicializar aplicación
document.addEventListener("DOMContentLoaded", () => {
  try {
    Model.init();
    Controller.init();
  } catch (error) {
    console.error("Error al inicializar la app:", error);
    const root = document.getElementById("view-dashboard") || document.body;
    root.innerHTML = `
      <div class="glass rounded-xl border border-red-300 p-4 text-red-700 font-semibold">
        Ocurrio un error al cargar la aplicacion. Revisa la consola e intenta limpiar datos locales.
      </div>
    `;
  }
});
