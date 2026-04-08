// products.js
// ---------------------------------------------
// Catálogo de productos desde la API (PostgreSQL)
// Ya no usamos un array estático — los datos vienen de la BD
// en tiempo real, lo que significa que cualquier cambio en
// precios, stock o productos se refleja automáticamente.
// ---------------------------------------------

export async function fetchProducts() {
  try {
    const response = await fetch('/api/discordia-data');

    if (!response.ok) {
      throw new Error(`Error al obtener productos: ${response.status}`);
    }

    const json = await response.json();

    // La API devuelve { ok: true, data: { catalog: [...] } }
    // Nosotros solo necesitamos el array catalog
    return json.data.catalog;

  } catch (error) {
    console.error('No se pudo cargar el catálogo desde la API:', error);
    // Si la API falla, retornamos array vacío para no romper la UI
    return [];
  }
}