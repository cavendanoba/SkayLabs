// backend/src/modules/hx-records/hx-records.schema.js
import { z } from 'zod';

const ophthalmologySchema = z.object({
  visualAcuityOD: z.string().optional(),
  visualAcuityOS: z.string().optional(),
  visualAcuityScOD: z.string().optional(),
  visualAcuityScOS: z.string().optional(),
  refractionOD: z.string().optional(),
  refractionOS: z.string().optional(),
  addition: z.string().optional(),
  refractionNotes: z.string().optional(),
  // null permite borrar un valor ya guardado (autoguardado)
  intraocularPressureOD: z.number().nullable().optional(),
  intraocularPressureOS: z.number().nullable().optional(),
  biomicroscopyOD: z.string().optional(),
  biomicroscopyOS: z.string().optional(),
  fundusOD: z.string().optional(),
  fundusOS: z.string().optional(),
  plan: z.string().optional(),
}).optional();

export const createHxRecordSchema = z.object({
  body: z.object({
    appointmentId: z.string().optional().nullable(),
    patientId: z.string().min(1, 'Paciente requerido'),
    doctorId: z.string().min(1, 'Médico requerido'),
    chiefComplaint: z.string().optional(),
    medicalHistory: z.string().optional(),
    surgicalHistory: z.string().optional(),
    allergies: z.string().optional(),
    medications: z.string().optional(),
    ophthalmology: ophthalmologySchema,
    diagnoses: z.array(z.object({ cie10Code: z.string(), isPrimary: z.boolean().default(false) })).optional(),
    prescriptions: z.array(z.object({
      medicationName: z.string(),
      dosage: z.string().optional(),
      frequency: z.string().optional(),
      duration: z.string().optional(),
      instructions: z.string().optional(),
    })).optional(),
  }),
});

export const updateHxRecordSchema = z.object({
  params: z.object({ id: z.string() }),
  body: z.object({
    chiefComplaint: z.string().optional(),
    medicalHistory: z.string().optional(),
    surgicalHistory: z.string().optional(),
    allergies: z.string().optional(),
    medications: z.string().optional(),
    ophthalmology: ophthalmologySchema,
    diagnoses: z.array(z.object({ cie10Code: z.string(), isPrimary: z.boolean().default(false) })).optional(),
    prescriptions: z.array(z.object({
      medicationName: z.string(),
      dosage: z.string().optional(),
      frequency: z.string().optional(),
      duration: z.string().optional(),
      instructions: z.string().optional(),
    })).optional(),
  }),
});

export default { createHxRecordSchema, updateHxRecordSchema };
