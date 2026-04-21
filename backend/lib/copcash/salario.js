// api/copcash/salario.js  — GET, PUT
import { sql } from '../db.js';
import { setCors, json, verifyToken, handleError, mapSalario } from './_helpers.js';

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { userId } = await verifyToken(req);

    // GET — traer salario del usuario
    if (req.method === 'GET') {
      const rows = await sql`SELECT * FROM cc_salario WHERE usuario_id = ${userId}`;
      return json(res, 200, rows.length ? mapSalario(rows[0]) : null);
    }

    // PUT — crear o actualizar (upsert)
    if (req.method === 'PUT') {
      const { monto, diaCobro, descripcion } = req.body || {};
      if (monto == null) return json(res, 400, { error: 'monto es requerido' });

      const [row] = await sql`
        INSERT INTO cc_salario (usuario_id, monto, dia_cobro, descripcion)
        VALUES (${userId}, ${monto}, ${diaCobro ?? 1}, ${descripcion ?? null})
        ON CONFLICT (usuario_id) DO UPDATE
          SET monto       = EXCLUDED.monto,
              dia_cobro   = EXCLUDED.dia_cobro,
              descripcion = EXCLUDED.descripcion
        RETURNING *
      `;
      return json(res, 200, mapSalario(row));
    }

    json(res, 405, { error: 'Method not allowed' });
  } catch (err) {
    handleError(res, err);
  }
}
