// backend/src/modules/users/users.schema.js
import { z } from 'zod';

export const createUserSchema = z.object({
  body: z.object({
    email: z.string().email('Email inválido'),
    name: z.string().min(2, 'Nombre requerido'),
    password: z.string().min(8, 'Mínimo 8 caracteres'),
    role: z.enum(['ADMIN', 'DOCTOR', 'RECEPTIONIST', 'PATIENT']).default('RECEPTIONIST'),
    phoneNumber: z.string().optional(),
    specialty: z.string().optional(),
    licenseNumber: z.string().optional(),
  }),
});

export const updateUserSchema = z.object({
  params: z.object({ id: z.string() }),
  body: z.object({
    name: z.string().min(2).optional(),
    phoneNumber: z.string().optional(),
    specialty: z.string().optional(),
    licenseNumber: z.string().optional(),
  }),
});

export const updateStatusSchema = z.object({
  params: z.object({ id: z.string() }),
  body: z.object({ active: z.boolean() }),
});

export default { createUserSchema, updateUserSchema, updateStatusSchema };
