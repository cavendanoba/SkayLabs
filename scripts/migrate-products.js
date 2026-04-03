// Este script se encarga de migrar los productos desde el archivo JSON a la base de datos PostgreSQL usando Neon. 
// Asegúrate de tener la variable de entorno DATABASE_URL configurada correctamente antes de ejecutar este script.

// Para ejecutar este script, debo usar el comando: node scripts/migrate-products.js

// scripts/migrate-products.js
import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';

const sql = neon(process.env.DATABASE_URL);

const products = JSON.parse(
    readFileSync('./discordia/data/products.json', 'utf8') // El segundo argumento 'utf8' es importante para asegurarnos de que el archivo se lea correctamente como texto, especialmente si contiene caracteres especiales.
);

console.log(`Migrando ${products.length} productos...`);

for (const p of products) { // Usamos la función sql para insertar cada producto en la base de datos. La cláusula ON CONFLICT (id) DO NOTHING asegura que si un producto con el mismo ID ya existe, no se inserte de nuevo, evitando así duplicados.
    await sql`
    INSERT INTO products (id, name, price, stock, category, image, description)
    VALUES (${p.id}, ${p.name}, ${p.price}, ${p.stock}, ${p.category}, ${p.image}, ${p.description})
    ON CONFLICT (id) DO NOTHING
  `;
    console.log(`✅ ${p.id}. ${p.name}`);
}

console.log('\n🎉 Migración completa');
process.exit(0); // Salimos del proceso después de completar la migración