-- Día en que se cierra cada periodo de gastos, separado del día en que te pagan.
-- Arranca igual al día de pago, que era como se calculaba hasta ahora.
ALTER TABLE perfiles ADD COLUMN IF NOT EXISTS dia_corte SMALLINT CHECK (dia_corte BETWEEN 1 AND 28);
UPDATE perfiles SET dia_corte = LEAST(28, GREATEST(1, COALESCE(dia_pago, 20))) WHERE dia_corte IS NULL;
ALTER TABLE perfiles ALTER COLUMN dia_corte SET DEFAULT 20, ALTER COLUMN dia_corte SET NOT NULL;
