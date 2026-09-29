// backend/src/modules/transactions/transactions.schema.js
import { z } from 'zod';

export const createTransactionSchema = z.object({
  body: z.object({
    patientId: z.string().optional(),
    type: z.enum(['INCOME', 'EXPENSE']),
    category: z.enum(['CONSULTATION','PROCEDURE','EXAM','RENT','SALARY','SUPPLIES','EQUIPMENT','OTHER']),
    amount: z.number().positive('El monto debe ser mayor a 0'),
    paymentMethod: z.enum(['CASH', 'TRANSFER', 'CARD', 'OTHER']),
    description: z.string().optional(),
  }),
});

export const listTransactionsSchema = z.object({
  query: z.object({
    type: z.enum(['INCOME','EXPENSE']).optional(),
    category: z.string().optional(),
    from: z.string().optional(),
    to: z.string().optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
});

export default { createTransactionSchema, listTransactionsSchema };
