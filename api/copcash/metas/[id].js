// api/copcash/metas/[id].js  — PUT update, DELETE
import { sql } from '../../db.js';
import { setCors, json, verifyToken, handleError, mapMeta } from '../_helpers.js';

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { userId } = await verifyToken(req);
    const id = parseInt(req.query.id);
    if (isNaN(id)) return json(res, 400, { error: 'ID inválido' });

    if (req.method === 'PUT') {
      const {
        nombre, montoObjetivo, montoActual,
        fechaObjetivo, aporteAutomatico, aporteAutomaticoMonto
      } = req.body || {};

      const rows = await sql`
        UPDATE cc_metas
        SET nombre=${nombre}, monto_objetivo=${montoObjetivo ?? 0},
            monto_actual=${montoActual ?? 0}, fecha_objetivo=${fechaObjetivo ?? null},
            aporte_automatico=${aporteAutomatico ?? false},
            aporte_automatico_monto=${aporteAutomaticoMonto ?? 0}
        WHERE id=${id} AND usuario_id=${userId}
        RETURNING *
      `;
      if (!rows.length) return json(res, 404, { error: 'Meta no encontrada' });
      return json(res, 200, mapMeta(rows[0]));
    }

    if (req.method === 'DELETE') {
      await sql`DELETE FROM cc_metas WHERE id=${id} AND usuario_id=${userId}`;
      return json(res, 200, { ok: true });
    }

    json(res, 405, { error: 'Method not allowed' });
  } catch (err) {
    handleError(res, err);
  }
}
