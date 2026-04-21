// api/copcash/gastos-variables/[id].js  — PUT update, DELETE
import { sql } from '../../db.js';
import { setCors, json, verifyToken, handleError, mapGastoVariable } from '../_helpers.js';

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { userId } = await verifyToken(req);
    const id = parseInt(req.query.id);
    if (isNaN(id)) return json(res, 400, { error: 'ID inválido' });

    if (req.method === 'PUT') {
      const { nombre, monto, fecha, categoria, pagado } = req.body || {};
      const rows = await sql`
        UPDATE cc_gastos_variables
        SET nombre=${nombre}, monto=${monto}, fecha=${fecha ?? null},
            categoria_id=${categoria ?? null}, pagado=${pagado ?? false}
        WHERE id=${id} AND usuario_id=${userId}
        RETURNING *
      `;
      if (!rows.length) return json(res, 404, { error: 'Gasto variable no encontrado' });
      return json(res, 200, mapGastoVariable(rows[0]));
    }

    if (req.method === 'DELETE') {
      await sql`DELETE FROM cc_gastos_variables WHERE id=${id} AND usuario_id=${userId}`;
      return json(res, 200, { ok: true });
    }

    json(res, 405, { error: 'Method not allowed' });
  } catch (err) {
    handleError(res, err);
  }
}
