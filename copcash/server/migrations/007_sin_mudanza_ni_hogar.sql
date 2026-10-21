-- CopCash deja de manejar mudanza y hogar compartido: todo es personal y general.

-- Los gastos fijos que solo aplicaban "después de mudarme" quedan desactivados (se pueden reactivar en Ajustes)
UPDATE gastos_recurrentes SET activo = FALSE WHERE cuando = 'despues_mudanza';
UPDATE gastos_recurrentes SET cuando = 'siempre', es_hogar = FALSE;

-- Los escenarios pierden los supuestos de mudanza, porcentaje del hogar, cambio y aporte de pareja
UPDATE escenarios SET parametros = parametros - 'mudanza' - 'porcentaje_hogar' - 'cambio' - 'aporte_pareja';

-- Los gastos marcados como compartidos pasan a ser solo tuyos
UPDATE movimientos SET compartido = FALSE, hogar_id = NULL WHERE compartido OR hogar_id IS NOT NULL;
