// api/copcash/tarjetas/[id]/compras/[compraId].js  — PUT update, DELETE
import { sql } from '../../../../db.js';
import { setCors, json, verifyToken, handleError, mapCompra } from '../../../_helpers.js';

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { userId } = await verifyToken(req);
    const tarjetaId = parseInt(req.query.id);
    const compraId  = parseInt(req.query.compraId);
    if (isNaN(tarjetaId) || isNaN(compraId)) {
      return json(res, 400, { error: 'IDs inválidos' });
    }

    // Verificar que la tarjeta pertenece al usuario
    const [tarjeta] = await sql`
      SELECT id FROM cc_tarjetas WHERE id=${tarjetaId} AND usuario_id=${userId}
    `;
    if (!tarjeta) return json(res, 404, { error: 'Tarjeta no encontrada' });

    if (req.method === 'PUT') {
      const {
        nombre, montoTotal, cuotasTotal, cuotasPagadas,
        monto_cuota_fija, cuotaActual, fechaPrimeraCompra, activa
      } = req.body || {};

      const rows = await sql`
        UPDATE cc_compras_cuotas
        SET nombre=${nombre}, monto_total=${montoTotal}, cuotas_total=${cuotasTotal},
            cuotas_pagadas=${cuotasPagadas ?? 0}, cuota_actual=${cuotaActual ?? 1},
            monto_cuota_fija=${monto_cuota_fija}, fecha_primera_compra=${fechaPrimeraCompra ?? null},
            activa=${activa ?? true}
        WHERE id=${compraId} AND tarjeta_id=${tarjetaId}
        RETURNING *
      `;
      if (!rows.length) return json(res, 404, { error: 'Compra no encontrada' });
      return json(res, 200, mapCompra(rows[0]));
    }

    if (req.method === 'DELETE') {
      await sql`DELETE FROM cc_compras_cuotas WHERE id=${compraId} AND tarjeta_id=${tarjetaId}`;
      return json(res, 200, { ok: true });
    }

    json(res, 405, { error: 'Method not allowed' });
  } catch (err) {
    handleError(res, err);
  }
}
