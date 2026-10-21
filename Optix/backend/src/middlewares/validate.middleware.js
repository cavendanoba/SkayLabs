// backend/src/middlewares/validate.middleware.js
import { z } from 'zod';

export const validateRequest = (schema) => {
  return (req, res, next) => {
    try {
      const data = {
        body: req.body,
        params: req.params,
        query: req.query,
      };

      const parsed = schema.parse(data);
      req.validated = parsed;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Datos inválidos',
          code: 'VALIDATION_ERROR',
          details: error.errors,
        });
      }

      return res.status(400).json({
        error: 'Error de validación',
        code: 'VALIDATION_ERROR',
      });
    }
  };
};

export default validateRequest;
