// api/copcash/tarjetas/[id].js  — PUT update, DELETE
import { sql } from '../../db.js';
import { setCors, json, verifyToken, handleError, mapTarjeta } from '../_helpers.js';

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { userId } = await verifyToken(req);
    const id = parseInt(req.query.id);
    if (isNaN(id)) return json(res, 400, { error: 'ID inválido' });

    if (req.method === 'PUT') {
      const {
        nombre, banco, limiteCrediticio, tasaInteresAnual,
        fechaCierre, fechaPago, saldoPeriodosAnteriores,
        interesAcumulado, pagos_realizados
      } = req.body || {};

      // pagos_realizados llega como array JS, lo almacenamos como JSONB
      const pagosJSON = JSON.stringify(pagos_realizados ?? []);

      const rows = await sql`
        UPDATE cc_tarjetas
        SET nombre                    = ${nombre},
            banco                     = ${banco ?? null},
            limite_crediticio         = ${limiteCrediticio ?? 0},
            tasa_interes_anual        = ${tasaInteresAnual ?? 0},
            fecha_cierre              = ${fechaCierre ?? null},
            fecha_pago                = ${fechaPago ?? null},
            saldo_periodos_anteriores = ${saldoPeriodosAnteriores ?? 0},
            interes_acumulado         = ${interesAcumulado ?? 0},
            pagos_realizados          = ${pagosJSON}::jsonb
        WHERE id=${id} AND usuario_id=${userId}
        RETURNING *
      `;
      if (!rows.length) return json(res, 404, { error: 'Tarjeta no encontrada' });

      // Devolver también las compras
      const compras = await sql`SELECT * FROM cc_compras_cuotas WHERE tarjeta_id=${id} ORDER BY id`;
      return json(res, 200, mapTarjeta(rows[0], compras));
    }

    if (req.method === 'DELETE') {
      // Las compras se eliminan en cascada por la FK
      await sql`DELETE FROM cc_tarjetas WHERE id=${id} AND usuario_id=${userId}`;
      return json(res, 200, { ok: true });
    }

    json(res, 405, { error: 'Method not allowed' });
  } catch (err) {
    handleError(res, err);
  }
}
