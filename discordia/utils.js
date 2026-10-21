// discordia/utils.js
// Utilidades compartidas para Discordia

/**
 * Formatea un número como precio en pesos colombianos sin decimales
 * Ejemplo: 15000 → "15.000"
 */
export function formatPrice(value) {
  const num = Number(value) || 0;
  return num.toLocaleString('es-CO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
}

/**
 * Formatea un número como precio con el símbolo $
 * Ejemplo: 15000 → "$15.000"
 */
export function formatCurrency(value) {
  return `$${formatPrice(value)}`;
}
