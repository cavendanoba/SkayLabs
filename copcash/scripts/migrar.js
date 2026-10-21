// Crea o actualiza las tablas (también lo hace el servidor al arrancar).
import '../server/entorno.js';
import { migrar, pool } from '../server/db.js';

await migrar();
console.log('Base de datos al día.');
await pool.end();
