// api/copcash/tarjetas/[id]/compras.js  — POST (agregar compra a cuotas)
import { sql } from '../../../db.js';
import { setCors, json, verifyToken, handleError, mapCompra } from '../../_helpers.js';

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });

  try {
    const { userId } = await verifyToken(req);
    const tarjetaId = parseInt(req.query.id);
    if (isNaN(tarjetaId)) return json(res, 400, { error: 'ID de tarjeta inválido' });

    // Verificar que la tarjeta pertenece al usuario
    const [tarjeta] = await sql`
      SELECT id FROM cc_tarjetas WHERE id=${tarjetaId} AND usuario_id=${userId}
    `;
    if (!tarjeta) return json(res, 404, { error: 'Tarjeta no encontrada' });

    const {
      nombre, montoTotal, cuotasTotal, cuotasPagadas,
      monto_cuota_fija, cuotaActual, fechaPrimeraCompra, activa
    } = req.body || {};

    if (!nombre || montoTotal == null) {
      return json(res, 400, { error: 'nombre y montoTotal son requeridos' });
    }

    const [row] = await sql`
      INSERT INTO cc_compras_cuotas
        (tarjeta_id, nombre, monto_total, cuotas_total, cuotas_pagadas,
         cuota_actual, monto_cuota_fija, fecha_primera_compra, activa)
      VALUES
        (${tarjetaId}, ${nombre}, ${montoTotal}, ${cuotasTotal ?? 1},
         ${cuotasPagadas ?? 0}, ${cuotaActual ?? 1},
         ${monto_cuota_fija ?? montoTotal},
         ${fechaPrimeraCompra ?? null}, ${activa ?? true})
      RETURNING *
    `;
    return json(res, 201, mapCompra(row));
  } catch (err) {
    handleError(res, err);
  }
}
