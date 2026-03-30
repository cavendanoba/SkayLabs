/**
 * App - Punto de entrada principal
 */
import { Model } from "./model.js";
import { View } from "./view.js";
import { Controller } from "./controller.js";

// Inicializar aplicación
document.addEventListener("DOMContentLoaded", () => {
  Model.init();
  Controller.init();
});
