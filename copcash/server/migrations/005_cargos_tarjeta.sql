-- Cobros fijos de cada tarjeta (cuota de manejo, seguros…), editables por el usuario
ALTER TABLE deudas ADD COLUMN IF NOT EXISTS cargos JSONB NOT NULL DEFAULT '[]'::jsonb;

-- Lo que hubiera en cuota_manejo pasa a ser el primer cargo
UPDATE deudas SET cargos = jsonb_build_array(jsonb_build_object('nombre', 'Cuota de manejo', 'valor', cuota_manejo)), cuota_manejo = 0
 WHERE cuota_manejo > 0 AND cargos = '[]'::jsonb;
