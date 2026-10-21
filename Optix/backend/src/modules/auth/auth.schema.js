// backend/src/modules/auth/auth.schema.js
import { z } from 'zod';

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(6, 'Contraseña requerida'),
  }),
});

export const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string('Refresh token requerido'),
  }),
});

export default { loginSchema, refreshSchema };
