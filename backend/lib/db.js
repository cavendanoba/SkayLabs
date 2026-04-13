import { neon } from '@neondatabase/serverless';

// Conexión única para los endpoints de CopCash.
export const sql = neon(process.env.DATABASE_URL);
