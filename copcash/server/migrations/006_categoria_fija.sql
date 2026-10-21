-- Cada categoría es de gasto fijo (arriendo, almuerzos, aporte a la casa…) o variable (el día a día)
ALTER TABLE categorias ADD COLUMN IF NOT EXISTS fija BOOLEAN NOT NULL DEFAULT FALSE;

-- Punto de partida: fijas las categorías sin presupuesto variable que tienen gastos fijos asignados.
-- Se cambia en Ajustes.
UPDATE categorias c SET fija = TRUE
 WHERE c.presupuesto = 0
   AND EXISTS (SELECT 1 FROM gastos_recurrentes g WHERE g.categoria_id = c.id AND g.activo);
