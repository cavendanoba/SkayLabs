// api/copcash/metas.js  — GET list, POST create
import { sql } from '../db.js';
import { setCors, json, verifyToken, handleError, mapMeta } from './_helpers.js';

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { userId } = await verifyToken(req);

    if (req.method === 'GET') {
      const rows = await sql`
        SELECT * FROM cc_metas WHERE usuario_id = ${userId} ORDER BY id
      `;
      return json(res, 200, rows.map(mapMeta));
    }

    if (req.method === 'POST') {
      const {
        nombre, montoObjetivo, montoActual,
        fechaObjetivo, aporteAutomatico, aporteAutomaticoMonto
      } = req.body || {};
      if (!nombre) return json(res, 400, { error: 'nombre es requerido' });

      const [row] = await sql`
        INSERT INTO cc_metas
          (usuario_id, nombre, monto_objetivo, monto_actual,
           fecha_objetivo, aporte_automatico, aporte_automatico_monto)
        VALUES
          (${userId}, ${nombre}, ${montoObjetivo ?? 0}, ${montoActual ?? 0},
           ${fechaObjetivo ?? null}, ${aporteAutomatico ?? false},
           ${aporteAutomaticoMonto ?? 0})
        RETURNING *
      `;
      return json(res, 201, mapMeta(row));
    }

    json(res, 405, { error: 'Method not allowed' });
  } catch (err) {
    handleError(res, err);
  }
}
