// Carga .env si existe (Node 20.12+ trae process.loadEnvFile; no hace falta dotenv)
try {
  process.loadEnvFile();
} catch (e) {
  if (e.code !== 'ENOENT') throw e;
}
