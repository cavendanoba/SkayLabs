// backend/src/modules/patients/patients.schema.js
import { z } from 'zod';

export const createPatientSchema = z.object({
  body: z.object({
    firstName: z.string().min(1, 'Nombre requerido'),
    lastName: z.string().min(1, 'Apellido requerido'),
    email: z.string().email('Email inválido').optional().or(z.literal('')),
    phoneNumber: z.string().optional(),
    document: z.string().min(3, 'Documento requerido'),
    documentType: z.enum(['CC', 'CE', 'PA', 'RC', 'TI', 'NIT']),
    birthDate: z.string().optional(),
    gender: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    neighborhood: z.string().optional(),
    emergencyName: z.string().optional(),
    emergencyPhone: z.string().optional(),
  }),
});

export const updatePatientSchema = z.object({
  params: z.object({ id: z.string() }),
  body: z.object({
    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
    email: z.string().email().optional().or(z.literal('')),
    phoneNumber: z.string().optional(),
    birthDate: z.string().optional(),
    gender: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    neighborhood: z.string().optional(),
    emergencyName: z.string().optional(),
    emergencyPhone: z.string().optional(),
  }),
});

export const listPatientsSchema = z.object({
  query: z.object({
    search: z.string().optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
});

export default { createPatientSchema, updatePatientSchema, listPatientsSchema };
