-- Fase 1: cuentas con saldo, ahorros y nómina calculada desde el salario básico.

CREATE TABLE IF NOT EXISTS cuentas (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'ahorros' CHECK (tipo IN ('ahorros','corriente','billetera','efectivo','otra')),
  entidad TEXT,
  saldo NUMERIC(14,2) NOT NULL DEFAULT 0,
  color TEXT CHECK (color IS NULL OR color ~ '^#[0-9A-Fa-f]{6}$'),
  activa BOOLEAN NOT NULL DEFAULT TRUE,
  orden SMALLINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ahorros: pensión, cesantías, cooperativa (FEC) u otros
CREATE TABLE IF NOT EXISTS ahorros (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('pension','cesantias','cooperativa','otro')),
  entidad TEXT,
  -- Saldo que tenías en la fecha inicial
  saldo_inicial NUMERIC(14,2) NOT NULL DEFAULT 0,
  fecha_inicial DATE NOT NULL DEFAULT CURRENT_DATE,
  -- Aporte fijo por periodo (cooperativa) o porcentaje del básico (pensión 16 %); si hay porcentaje, manda el porcentaje
  aporte_mensual NUMERIC(14,2) NOT NULL DEFAULT 0,
  pct_salario NUMERIC(6,4),
  -- Se descuenta de tu nómina (baja lo que te consignan)
  descuento_nomina BOOLEAN NOT NULL DEFAULT FALSE,
  meta NUMERIC(14,2),
  color TEXT CHECK (color IS NULL OR color ~ '^#[0-9A-Fa-f]{6}$'),
  activa BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Aportes o retiros manuales a un ahorro
CREATE TABLE IF NOT EXISTS ahorro_aportes (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ahorro_id BIGINT NOT NULL REFERENCES ahorros(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  monto NUMERIC(14,2) NOT NULL CHECK (monto <> 0),
  cuenta_id BIGINT REFERENCES cuentas(id) ON DELETE SET NULL,
  nota TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Nómina: lo que hace falta para calcular lo que te consignan
ALTER TABLE perfiles
  ADD COLUMN IF NOT EXISTS salario_minimo NUMERIC(14,2) NOT NULL DEFAULT 1750905,
  ADD COLUMN IF NOT EXISTS auxilios NUMERIC(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS otras_deducciones NUMERIC(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS retencion NUMERIC(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pct_salud NUMERIC(6,4) NOT NULL DEFAULT 0.04,
  ADD COLUMN IF NOT EXISTS pct_pension NUMERIC(6,4) NOT NULL DEFAULT 0.04;

-- Conservar lo que te consignan a quien venía usando "neto sin créditos": la diferencia queda como otras deducciones
UPDATE perfiles
   SET otras_deducciones = GREATEST(0, ROUND(salario_bruto * (1 - pct_salud - pct_pension) - salario_neto_base))
 WHERE salario_neto_base > 0 AND otras_deducciones = 0;

-- Movimientos: de qué cuenta sale o a cuál entra
ALTER TABLE movimientos ADD COLUMN IF NOT EXISTS cuenta_id BIGINT REFERENCES cuentas(id) ON DELETE SET NULL;

-- Pasar los medios de pago a cuentas (débito, efectivo, otros) y tarjetas (deudas)
INSERT INTO cuentas (user_id, nombre, tipo, saldo, orden)
SELECT mp.user_id, mp.nombre, CASE mp.tipo WHEN 'efectivo' THEN 'efectivo' WHEN 'debito' THEN 'ahorros' ELSE 'otra' END, 0, mp.id
  FROM medios_pago mp
 WHERE mp.tipo <> 'credito'
   AND NOT EXISTS (SELECT 1 FROM cuentas c WHERE c.user_id = mp.user_id AND c.nombre = mp.nombre);

UPDATE movimientos m SET cuenta_id = c.id
  FROM medios_pago mp JOIN cuentas c ON c.user_id = mp.user_id AND c.nombre = mp.nombre
 WHERE m.medio_pago_id = mp.id AND mp.tipo <> 'credito' AND m.cuenta_id IS NULL;

-- En un gasto, deuda_id pasa a significar "pagado con esta tarjeta"
UPDATE movimientos m SET deuda_id = mp.deuda_id
  FROM medios_pago mp
 WHERE m.medio_pago_id = mp.id AND mp.tipo = 'credito' AND mp.deuda_id IS NOT NULL
   AND m.tipo = 'gasto' AND m.deuda_id IS NULL;

CREATE INDEX IF NOT EXISTS ahorro_aportes_ahorro ON ahorro_aportes(ahorro_id, fecha);
