// api/copcash/gastos-variables.js  — GET list, POST create
import { sql } from '../db.js';
import { setCors, json, verifyToken, handleError, mapGastoVariable } from './_helpers.js';

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { userId } = await verifyToken(req);

    if (req.method === 'GET') {
      const rows = await sql`
        SELECT * FROM cc_gastos_variables WHERE usuario_id = ${userId} ORDER BY fecha DESC, id DESC
      `;
      return json(res, 200, rows.map(mapGastoVariable));
    }

    if (req.method === 'POST') {
      const { nombre, monto, fecha, categoria, pagado } = req.body || {};
      if (!nombre || monto == null) return json(res, 400, { error: 'nombre y monto son requeridos' });

      const [row] = await sql`
        INSERT INTO cc_gastos_variables (usuario_id, nombre, monto, fecha, categoria_id, pagado)
        VALUES (${userId}, ${nombre}, ${monto}, ${fecha ?? null}, ${categoria ?? null}, ${pagado ?? false})
        RETURNING *
      `;
      return json(res, 201, mapGastoVariable(row));
    }

    json(res, 405, { error: 'Method not allowed' });
  } catch (err) {
    handleError(res, err);
  }
}
