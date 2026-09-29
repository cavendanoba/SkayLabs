// backend/server.js
import app from './src/app.js';
import env from './src/config/env.js';
import logger from './src/utils/logger.util.js';

const PORT = env.PORT;

const server = app.listen(PORT, () => {
  logger.success(`Servidor Optix corriendo en puerto ${PORT}`);
  logger.info(`Entorno: ${env.NODE_ENV}`);
  logger.info(`API: http://localhost:${PORT}/api/v${env.API_VERSION}`);
});

// Manejo de señales
process.on('SIGTERM', () => {
  logger.warn('SIGTERM recibido, cerrando servidor...');
  server.close(() => {
    logger.info('Servidor cerrado');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.warn('SIGINT recibido, cerrando servidor...');
  server.close(() => {
    logger.info('Servidor cerrado');
    process.exit(0);
  });
});

export default server;
