// Este script se encarga de migrar los productos desde el archivo JSON a la base de datos PostgreSQL usando Neon. 
// Asegúrate de tener la variable de entorno DATABASE_URL configurada correctamente antes de ejecutar este script.

// Para ejecutar este script, debo usar el comando: node scripts/migrate-products.js

import { neon } from '@neondatabase/serverless';
import products from '../discordia/data/products.json' assert { type: 'json' };

const sql = neon(process.env.DATABASE_URL);

for (const p of products) { // Recorremos cada producto del JSON y lo insertamos en la base de datos
  await sql`
    INSERT INTO products (id, name, price, stock, category, image, description)
    VALUES (${p.id}, ${p.name}, ${p.price}, ${p.stock},
            ${p.category}, ${p.image}, ${p.description})
    ON CONFLICT (id) DO NOTHING // Evita insertar productos con IDs duplicados
  `;
  console.log('Insertado:', p.name);
}
console.log('Migración completa');
process.exit(0); // Salimos del proceso después de completar la migración