import { neon } from '@neondatabase/serverless';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL no está definida. Verifica la variable de entorno en Vercel o en tu entorno local.');
}

// Conexión única para los endpoints de CopCash.
export const sql = neon(connectionString);
