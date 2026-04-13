// api/copcash/tarjetas.js  — GET list, POST create
import { sql } from '../db.js';
import { setCors, json, verifyToken, handleError, mapTarjeta, mapCompra } from './_helpers.js';

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { userId } = await verifyToken(req);

    if (req.method === 'GET') {
      const tarjetas = await sql`
        SELECT * FROM cc_tarjetas WHERE usuario_id = ${userId} ORDER BY id
      `;

      if (tarjetas.length === 0) return json(res, 200, []);

      const ids = tarjetas.map(t => t.id);
      const compras = await sql`
        SELECT * FROM cc_compras_cuotas WHERE tarjeta_id = ANY(${ids}) ORDER BY id
      `;

      const result = tarjetas.map(t =>
        mapTarjeta(t, compras.filter(c => c.tarjeta_id === t.id))
      );
      return json(res, 200, result);
    }

    if (req.method === 'POST') {
      const {
        nombre, banco, limiteCrediticio, tasaInteresAnual,
        fechaCierre, fechaPago
      } = req.body || {};
      if (!nombre) return json(res, 400, { error: 'nombre es requerido' });

      const [row] = await sql`
        INSERT INTO cc_tarjetas
          (usuario_id, nombre, banco, limite_crediticio, tasa_interes_anual,
           fecha_cierre, fecha_pago, saldo_periodos_anteriores, interes_acumulado, pagos_realizados)
        VALUES
          (${userId}, ${nombre}, ${banco ?? null}, ${limiteCrediticio ?? 0},
           ${tasaInteresAnual ?? 0}, ${fechaCierre ?? null}, ${fechaPago ?? null},
           0, 0, '[]'::jsonb)
        RETURNING *
      `;
      return json(res, 201, mapTarjeta(row, []));
    }

    json(res, 405, { error: 'Method not allowed' });
  } catch (err) {
    handleError(res, err);
  }
}
