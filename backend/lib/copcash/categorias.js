// api/copcash/categorias.js  — GET list, POST create
import { sql } from '../db.js';
import { setCors, json, verifyToken, handleError, mapCategoria } from './_helpers.js';

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { userId } = await verifyToken(req);

    if (req.method === 'GET') {
      const rows = await sql`
        SELECT * FROM cc_categorias WHERE usuario_id = ${userId} ORDER BY id
      `;
      return json(res, 200, rows.map(mapCategoria));
    }

    if (req.method === 'POST') {
      const { nombre, icon, presupuesto, color } = req.body || {};
      if (!nombre) return json(res, 400, { error: 'nombre es requerido' });

      const [row] = await sql`
        INSERT INTO cc_categorias (usuario_id, nombre, icon, presupuesto, color)
        VALUES (${userId}, ${nombre}, ${icon ?? null}, ${presupuesto ?? 0}, ${color ?? null})
        RETURNING *
      `;
      return json(res, 201, mapCategoria(row));
    }

    json(res, 405, { error: 'Method not allowed' });
  } catch (err) {
    handleError(res, err);
  }
}
