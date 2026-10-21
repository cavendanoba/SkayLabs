-- Sesiones revocables: cada token lleva la versión de sesión del usuario.
-- Cambiar la contraseña o "cerrar sesión en todos los dispositivos" sube la versión y anula los tokens anteriores.
ALTER TABLE users ADD COLUMN IF NOT EXISTS sesion_version INTEGER NOT NULL DEFAULT 1;
ALTER TABLE users ADD COLUMN IF NOT EXISTS ultimo_ingreso TIMESTAMPTZ;
