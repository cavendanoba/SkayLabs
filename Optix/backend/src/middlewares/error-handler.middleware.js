// backend/src/middlewares/error-handler.middleware.js
export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Error interno del servidor';
  const code = err.code || 'INTERNAL_SERVER_ERROR';

  res.status(statusCode).json({
    error: message,
    code,
    details: process.env.NODE_ENV === 'development' ? err.stack : {},
  });
};

export default errorHandler;
