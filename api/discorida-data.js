// Lo que realizamos en este archivo es crear una API que se encargue de traer los datos de la base de datos y enviarlos al frontend.
// De esta forma, el frontend no tiene que preocuparse por cómo se accede a la base de datos, solo tiene que hacer una petición a esta API y recibir los datos en formato JSON.
// Esto también nos permite mantener toda la lógica de acceso a datos en un solo lugar, lo que hace que el código sea más fácil de mantener y escalar.

import { sql } from './db.js';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'GET') {
    const [products, sales, customers] = await Promise.all([
      sql`SELECT * FROM products WHERE active = true ORDER BY id`,
      sql`SELECT * FROM sales ORDER BY created_at DESC LIMIT 100`,
      sql`SELECT * FROM customers ORDER BY name`,
    ]);
    return res.json({ ok: true, storage: 'postgresql',
      data: { catalog: products, sales, customers } });
  }

  if (req.method === 'POST') {
    const { catalog, sales, customers } = req.body;
    // Aquí irías procesando cada array según necesites
    return res.json({ ok: true, storage: 'postgresql' });
  }
}
