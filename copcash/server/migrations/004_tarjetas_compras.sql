-- Fase 2: fechas y cupo de las tarjetas; compras con cuotas editables.
ALTER TABLE deudas
  ADD COLUMN IF NOT EXISTS dia_corte SMALLINT CHECK (dia_corte BETWEEN 1 AND 31),
  ADD COLUMN IF NOT EXISTS dia_pago SMALLINT CHECK (dia_pago BETWEEN 1 AND 31),
  ADD COLUMN IF NOT EXISTS cupo NUMERIC(14,2) CHECK (cupo IS NULL OR cupo >= 0),
  ADD COLUMN IF NOT EXISTS cuota_manejo NUMERIC(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ultimo_corte_pagado DATE;

-- En una compra con tarjeta: valor de cada cuota (si el banco cobra intereses) y cuántas ya se pagaron
ALTER TABLE movimientos
  ADD COLUMN IF NOT EXISTS cuota_valor NUMERIC(14,2) CHECK (cuota_valor IS NULL OR cuota_valor >= 0),
  ADD COLUMN IF NOT EXISTS cuotas_pagadas SMALLINT NOT NULL DEFAULT 0 CHECK (cuotas_pagadas >= 0);

CREATE INDEX IF NOT EXISTS movimientos_deuda ON movimientos(deuda_id, fecha) WHERE deuda_id IS NOT NULL;
