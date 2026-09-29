// backend/src/modules/appointments/appointments.schema.js
import { z } from 'zod';

export const createAppointmentSchema = z.object({
  body: z.object({
    patientId: z.string().min(1, 'Paciente requerido'),
    doctorId: z.string().min(1, 'Médico requerido'),
    appointmentType: z.enum(['FIRST_VISIT', 'FOLLOW_UP', 'URGENT', 'PROCEDURE', 'EXAM']),
    dateTime: z.string().refine((d) => !isNaN(Date.parse(d)), { message: 'Fecha inválida' }),
    duration: z.number().default(30),
    reason: z.string().optional(),
    notes: z.string().optional(),
  }),
});

export const updateStatusSchema = z.object({
  params: z.object({ id: z.string() }),
  body: z.object({
    status: z.enum(['SCHEDULED','CONFIRMED','WAITING','IN_PROGRESS','COMPLETED','CANCELLED','NO_SHOW']),
  }),
});

export const rescheduleSchema = z.object({
  params: z.object({ id: z.string() }),
  body: z.object({
    dateTime: z.string().refine((d) => !isNaN(Date.parse(d)), { message: 'Fecha inválida' }),
    duration: z.number().optional(),
    notes: z.string().optional(),
  }),
});

export const listAppointmentsSchema = z.object({
  query: z.object({
    date: z.string().optional(),
    doctorId: z.string().optional(),
    status: z.string().optional(),
    patientId: z.string().optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
});

export default { createAppointmentSchema, updateStatusSchema, rescheduleSchema, listAppointmentsSchema };
