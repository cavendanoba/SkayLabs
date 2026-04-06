// api/copcash/gastos-fijos.js  — GET list, POST create
import { sql } from '../db.js';
import { setCors, json, verifyToken, handleError, mapGastoFijo } from './_helpers.js';

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { userId } = await verifyToken(req);

    if (req.method === 'GET') {
      const rows = await sql`
        SELECT * FROM cc_gastos_fijos WHERE usuario_id = ${userId} ORDER BY id
      `;
      return json(res, 200, rows.map(mapGastoFijo));
    }

    if (req.method === 'POST') {
      const { nombre, monto, categoria, diaVencimiento, activo } = req.body || {};
      if (!nombre || monto == null) return json(res, 400, { error: 'nombre y monto son requeridos' });

      const [row] = await sql`
        INSERT INTO cc_gastos_fijos (usuario_id, nombre, monto, categoria_id, dia_vencimiento, activo)
        VALUES (${userId}, ${nombre}, ${monto}, ${categoria ?? null}, ${diaVencimiento ?? null}, ${activo ?? true})
        RETURNING *
      `;
      return json(res, 201, mapGastoFijo(row));
    }

    json(res, 405, { error: 'Method not allowed' });
  } catch (err) {
    handleError(res, err);
  }
}
