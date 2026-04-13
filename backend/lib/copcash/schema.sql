-- ================================================================
-- CopCash — Schema completo para Neon PostgreSQL
-- Ejecutar en la consola SQL de Neon (neon.tech → SQL Editor)
-- Usar CREATE TABLE IF NOT EXISTS para no romper tablas existentes
-- ================================================================

-- Extensión para UUIDs (opcional, usamos SERIAL en esta versión)
-- CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------
-- USUARIOS
-- Si ya existe cc_usuarios, verificar que tenga estas columnas:
--   id, email, password_hash, nombre, created_at
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cc_usuarios (
  id            SERIAL PRIMARY KEY,
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  nombre        TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- ----------------------------------------------------------------
-- SALARIO (una fila por usuario — upsert en el endpoint)
-- NUEVA tabla
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cc_salario (
  id          SERIAL PRIMARY KEY,
  usuario_id  INTEGER NOT NULL REFERENCES cc_usuarios(id) ON DELETE CASCADE,
  monto       NUMERIC(12,2) NOT NULL DEFAULT 0,
  dia_cobro   INTEGER DEFAULT 1,
  descripcion TEXT,
  UNIQUE(usuario_id)
);

-- ----------------------------------------------------------------
-- CATEGORÍAS
-- Si ya existe, agregar usuario_id si falta:
--   ALTER TABLE cc_categorias ADD COLUMN IF NOT EXISTS usuario_id INTEGER REFERENCES cc_usuarios(id);
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cc_categorias (
  id          SERIAL PRIMARY KEY,
  usuario_id  INTEGER NOT NULL REFERENCES cc_usuarios(id) ON DELETE CASCADE,
  nombre      TEXT NOT NULL,
  icon        TEXT,
  presupuesto NUMERIC(12,2) DEFAULT 0,
  color       TEXT
);

-- ----------------------------------------------------------------
-- GASTOS FIJOS
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cc_gastos_fijos (
  id               SERIAL PRIMARY KEY,
  usuario_id       INTEGER NOT NULL REFERENCES cc_usuarios(id) ON DELETE CASCADE,
  nombre           TEXT NOT NULL,
  monto            NUMERIC(12,2) NOT NULL,
  categoria_id     INTEGER REFERENCES cc_categorias(id) ON DELETE SET NULL,
  dia_vencimiento  INTEGER,
  activo           BOOLEAN DEFAULT true
);

-- ----------------------------------------------------------------
-- GASTOS VARIABLES
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cc_gastos_variables (
  id           SERIAL PRIMARY KEY,
  usuario_id   INTEGER NOT NULL REFERENCES cc_usuarios(id) ON DELETE CASCADE,
  nombre       TEXT NOT NULL,
  monto        NUMERIC(12,2) NOT NULL,
  fecha        DATE,
  categoria_id INTEGER REFERENCES cc_categorias(id) ON DELETE SET NULL,
  pagado       BOOLEAN DEFAULT false
);

-- ----------------------------------------------------------------
-- INGRESOS EXTRA  (tabla nueva)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cc_ingresos_extra (
  id           SERIAL PRIMARY KEY,
  usuario_id   INTEGER NOT NULL REFERENCES cc_usuarios(id) ON DELETE CASCADE,
  nombre       TEXT NOT NULL,
  monto        NUMERIC(12,2) NOT NULL,
  fecha        DATE,
  categoria_id INTEGER REFERENCES cc_categorias(id) ON DELETE SET NULL,
  completado   BOOLEAN DEFAULT false
);

-- ----------------------------------------------------------------
-- TARJETAS DE CRÉDITO
-- pagos_realizados: histórico guardado como JSONB (simple, no requiere
--   tabla extra y el frontend espera el arreglo completo en cada fetch)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cc_tarjetas (
  id                        SERIAL PRIMARY KEY,
  usuario_id                INTEGER NOT NULL REFERENCES cc_usuarios(id) ON DELETE CASCADE,
  nombre                    TEXT NOT NULL,
  banco                     TEXT,
  limite_crediticio         NUMERIC(12,2) DEFAULT 0,
  tasa_interes_anual        NUMERIC(7,4) DEFAULT 0,
  fecha_cierre              INTEGER,
  fecha_pago                INTEGER,
  saldo_periodos_anteriores NUMERIC(12,2) DEFAULT 0,
  interes_acumulado         NUMERIC(12,2) DEFAULT 0,
  pagos_realizados          JSONB DEFAULT '[]'::jsonb
);

-- ----------------------------------------------------------------
-- COMPRAS A CUOTAS (hijas de tarjetas)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cc_compras_cuotas (
  id                  SERIAL PRIMARY KEY,
  tarjeta_id          INTEGER NOT NULL REFERENCES cc_tarjetas(id) ON DELETE CASCADE,
  nombre              TEXT NOT NULL,
  monto_total         NUMERIC(12,2),
  cuotas_total        INTEGER,
  cuotas_pagadas      INTEGER DEFAULT 0,
  cuota_actual        INTEGER DEFAULT 1,
  monto_cuota_fija    NUMERIC(12,2),
  fecha_primera_compra DATE,
  activa              BOOLEAN DEFAULT true
);

-- ----------------------------------------------------------------
-- METAS DE AHORRO
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cc_metas (
  id                     SERIAL PRIMARY KEY,
  usuario_id             INTEGER NOT NULL REFERENCES cc_usuarios(id) ON DELETE CASCADE,
  nombre                 TEXT NOT NULL,
  monto_objetivo         NUMERIC(12,2) DEFAULT 0,
  monto_actual           NUMERIC(12,2) DEFAULT 0,
  fecha_objetivo         DATE,
  aporte_automatico      BOOLEAN DEFAULT false,
  aporte_automatico_monto NUMERIC(12,2) DEFAULT 0
);

-- ================================================================
-- ÍNDICES (mejora de rendimiento por usuario)
-- ================================================================
CREATE INDEX IF NOT EXISTS idx_categorias_usuario   ON cc_categorias(usuario_id);
CREATE INDEX IF NOT EXISTS idx_gastos_fijos_usuario  ON cc_gastos_fijos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_gastos_var_usuario    ON cc_gastos_variables(usuario_id);
CREATE INDEX IF NOT EXISTS idx_ingresos_usuario      ON cc_ingresos_extra(usuario_id);
CREATE INDEX IF NOT EXISTS idx_tarjetas_usuario      ON cc_tarjetas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_compras_tarjeta       ON cc_compras_cuotas(tarjeta_id);
CREATE INDEX IF NOT EXISTS idx_metas_usuario         ON cc_metas(usuario_id);
