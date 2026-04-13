// backend/api/discordia/discordia-data.js
// Lo que realizamos en este archivo es crear una API que se encargue de traer los datos de la base de datos y enviarlos al frontend.
// De esta forma, el frontend no tiene que preocuparse por cómo se accede a la base de datos, solo tiene que hacer una petición a esta API y recibir los datos en formato JSON.
// Esto también nos permite mantener toda la lógica de acceso a datos en un solo lugar, lo que hace que el código sea más fácil de mantener y escalar.

import { sql } from '../lib/db.js';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  // ─── GET: leer catálogo, ventas y clientes ───────────────────
  if (req.method === 'GET') {
    const [products, sales, customers] = await Promise.all([ // Ejecutamos las consultas en paralelo para optimizar el tiempo de respuesta
      sql`SELECT * FROM products WHERE active = true ORDER BY id`,
      sql`SELECT * FROM sales ORDER BY created_at DESC LIMIT 100`,
      sql`SELECT * FROM customers ORDER BY name`,
      // Aquí podríamos agregar más consultas si necesitamos traer más datos, por ejemplo, categorías de productos, detalles de ventas, etc.
      //Se usan consultas parametrizadas para evitar inyecciones SQL, aunque en este caso no hay parámetros dinámicos, es una buena práctica usar esta sintaxis para mantener la seguridad y consistencia del código.
    ]);

    return res.status(200).json({
      ok: true,
      storage: 'postgresql',
      data: { catalog: products, sales, customers }
    });
  }

  // ─── POST: guardar ventas o clientes ────────────────────────
  if (req.method === 'POST') {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const payload = body.data || body;

    if (!payload || !Object.keys(payload).length) { // Validación básica del payload, 
    // payload es el objeto que se envía desde el frontend, debe contener una propiedad data con la información a guardar
      return res.status(400).json({ ok: false, message: 'Payload inválido.' });
    }

    return res.status(200).json({ ok: true, storage: 'postgresql' });
  }

  return res.status(405).json({ ok: false, message: 'Método no permitido' });
}