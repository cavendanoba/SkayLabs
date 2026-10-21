-- Color para distinguir cada deuda en la interfaz (#RRGGBB)
ALTER TABLE deudas ADD COLUMN IF NOT EXISTS color TEXT CHECK (color IS NULL OR color ~ '^#[0-9A-Fa-f]{6}$');
