// api/copcash/ingresos-extra.js  — GET list, POST create
import { sql } from '../db.js';
import { setCors, json, verifyToken, handleError, mapIngresoExtra } from './_helpers.js';

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { userId } = await verifyToken(req);

    if (req.method === 'GET') {
      const rows = await sql`
        SELECT * FROM cc_ingresos_extra WHERE usuario_id = ${userId} ORDER BY fecha DESC, id DESC
      `;
      return json(res, 200, rows.map(mapIngresoExtra));
    }

    if (req.method === 'POST') {
      const { nombre, monto, fecha, categoria, completado } = req.body || {};
      if (!nombre || monto == null) return json(res, 400, { error: 'nombre y monto son requeridos' });

      const [row] = await sql`
        INSERT INTO cc_ingresos_extra (usuario_id, nombre, monto, fecha, categoria_id, completado)
        VALUES (${userId}, ${nombre}, ${monto}, ${fecha ?? null}, ${categoria ?? null}, ${completado ?? false})
        RETURNING *
      `;
      return json(res, 201, mapIngresoExtra(row));
    }

    json(res, 405, { error: 'Method not allowed' });
  } catch (err) {
    handleError(res, err);
  }
}
