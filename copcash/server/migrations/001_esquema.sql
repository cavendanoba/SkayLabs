-- CopCash v2: esquema normalizado.
-- No toca las tablas de la versión anterior (user_data, shared_resources): quedan como estaban.

CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  nombre TEXT,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Datos de nómina de cada persona
CREATE TABLE IF NOT EXISTS perfiles (
  user_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  dia_pago SMALLINT NOT NULL DEFAULT 20 CHECK (dia_pago BETWEEN 1 AND 28),
  salario_bruto NUMERIC(14,2) NOT NULL DEFAULT 0,
  -- Lo que te consignarían si no tuvieras créditos descontados por nómina.
  -- Cada crédito "por nómina" activo se resta de aquí en la proyección.
  salario_neto_base NUMERIC(14,2) NOT NULL DEFAULT 0,
  prima_legal BOOLEAN NOT NULL DEFAULT TRUE,
  prima_extralegal_pct NUMERIC(6,4) NOT NULL DEFAULT 0,
  intereses_cesantias BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Hogar: lo que se comparte con la pareja
CREATE TABLE IF NOT EXISTS hogares (
  id BIGSERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  creado_por BIGINT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hogar_miembros (
  hogar_id BIGINT NOT NULL REFERENCES hogares(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  porcentaje NUMERIC(5,2) NOT NULL DEFAULT 50 CHECK (porcentaje BETWEEN 0 AND 100),
  PRIMARY KEY (hogar_id, user_id)
);

CREATE TABLE IF NOT EXISTS invitaciones (
  id BIGSERIAL PRIMARY KEY,
  hogar_id BIGINT NOT NULL REFERENCES hogares(id) ON DELETE CASCADE,
  codigo TEXT NOT NULL UNIQUE,
  creado_por BIGINT REFERENCES users(id) ON DELETE CASCADE,
  expira_at TIMESTAMPTZ NOT NULL,
  usada_por BIGINT REFERENCES users(id) ON DELETE SET NULL,
  usada_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS categorias (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  icono TEXT NOT NULL DEFAULT '•',
  -- Presupuesto de gasto variable por periodo de pago (lo que esperas gastar día a día)
  presupuesto NUMERIC(14,2) NOT NULL DEFAULT 0,
  orden SMALLINT NOT NULL DEFAULT 0,
  activa BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE (user_id, nombre)
);

-- Tarjetas, créditos, Icetex, créditos por nómina...
CREATE TABLE IF NOT EXISTS deudas (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('tarjeta','credito','nomina','educativo','otro')),
  saldo NUMERIC(14,2) NOT NULL DEFAULT 0,
  -- Tasa mes vencido como fracción: 0.0125 = 1,25 % M.V.
  tasa_mensual NUMERIC(8,6) NOT NULL DEFAULT 0,
  cuota NUMERIC(14,2) NOT NULL DEFAULT 0,
  -- NULL = no termina (tarjeta rotativa, Icetex sin fecha)
  cuotas_restantes INTEGER CHECK (cuotas_restantes IS NULL OR cuotas_restantes >= 0),
  -- Tu parte de la cuota (Latam compartida = 65)
  mi_porcentaje NUMERIC(5,2) NOT NULL DEFAULT 100 CHECK (mi_porcentaje BETWEEN 0 AND 100),
  compartida BOOLEAN NOT NULL DEFAULT FALSE,
  descuento_nomina BOOLEAN NOT NULL DEFAULT FALSE,
  activa BOOLEAN NOT NULL DEFAULT TRUE,
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Cómo pagas: débito, efectivo o una tarjeta (ligada a su deuda)
CREATE TABLE IF NOT EXISTS medios_pago (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('debito','efectivo','credito','otro')),
  deuda_id BIGINT REFERENCES deudas(id) ON DELETE SET NULL,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE (user_id, nombre)
);

-- Gastos que se repiten cada periodo (arriendo, mercado, almuerzos, gasolina...)
CREATE TABLE IF NOT EXISTS gastos_recurrentes (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  categoria_id BIGINT REFERENCES categorias(id) ON DELETE SET NULL,
  monto NUMERIC(14,2) NOT NULL CHECK (monto >= 0),
  -- es_hogar: el monto es el total del hogar y tú pagas tu porcentaje del hogar
  es_hogar BOOLEAN NOT NULL DEFAULT FALSE,
  -- siempre | antes_mudanza | despues_mudanza
  cuando TEXT NOT NULL DEFAULT 'siempre' CHECK (cuando IN ('siempre','antes_mudanza','despues_mudanza')),
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  orden SMALLINT NOT NULL DEFAULT 0
);

-- Lo que de verdad pasó: cada gasto, ingreso o pago
CREATE TABLE IF NOT EXISTS movimientos (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  hogar_id BIGINT REFERENCES hogares(id) ON DELETE SET NULL,
  fecha DATE NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('gasto','ingreso','pago_deuda')),
  monto NUMERIC(14,2) NOT NULL CHECK (monto > 0),
  categoria_id BIGINT REFERENCES categorias(id) ON DELETE SET NULL,
  medio_pago_id BIGINT REFERENCES medios_pago(id) ON DELETE SET NULL,
  deuda_id BIGINT REFERENCES deudas(id) ON DELETE SET NULL,
  descripcion TEXT,
  cuotas SMALLINT NOT NULL DEFAULT 1 CHECK (cuotas BETWEEN 1 AND 72),
  -- Compartido con el hogar: se reparte según el porcentaje de cada miembro
  compartido BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS movimientos_user_fecha ON movimientos(user_id, fecha DESC);
CREATE INDEX IF NOT EXISTS movimientos_hogar_fecha ON movimientos(hogar_id, fecha DESC) WHERE compartido;

-- Escenarios de la proyección: supuestos que se pueden comparar
CREATE TABLE IF NOT EXISTS escenarios (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  parametros JSONB NOT NULL DEFAULT '{}',
  principal BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS escenarios_un_principal ON escenarios(user_id) WHERE principal;
