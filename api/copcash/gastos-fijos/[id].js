// api/copcash/gastos-fijos/[id].js  — PUT update, DELETE
import { sql } from '../../db.js';
import { setCors, json, verifyToken, handleError, mapGastoFijo } from '../_helpers.js';

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { userId } = await verifyToken(req);
    const id = parseInt(req.query.id);
    if (isNaN(id)) return json(res, 400, { error: 'ID inválido' });

    if (req.method === 'PUT') {
      const { nombre, monto, categoria, diaVencimiento, activo } = req.body || {};
      const rows = await sql`
        UPDATE cc_gastos_fijos
        SET nombre=${nombre}, monto=${monto}, categoria_id=${categoria ?? null},
            dia_vencimiento=${diaVencimiento ?? null}, activo=${activo ?? true}
        WHERE id=${id} AND usuario_id=${userId}
        RETURNING *
      `;
      if (!rows.length) return json(res, 404, { error: 'Gasto fijo no encontrado' });
      return json(res, 200, mapGastoFijo(rows[0]));
    }

    if (req.method === 'DELETE') {
      await sql`DELETE FROM cc_gastos_fijos WHERE id=${id} AND usuario_id=${userId}`;
      return json(res, 200, { ok: true });
    }

    json(res, 405, { error: 'Method not allowed' });
  } catch (err) {
    handleError(res, err);
  }
}
