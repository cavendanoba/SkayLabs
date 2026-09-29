// backend/src/modules/transactions/transactions.router.js
import express from 'express';
import transactionsController from './transactions.controller.js';
import validate from '../../middlewares/validate.middleware.js';
import auth from '../../middlewares/auth.middleware.js';
import requireRole from '../../middlewares/roles.middleware.js';
import { createTransactionSchema } from './transactions.schema.js';

const router = express.Router();

router.use(auth, requireRole('ADMIN', 'DOCTOR', 'RECEPTIONIST'));

router.get('/summary', transactionsController.getSummary);
router.get('/', transactionsController.list);
router.post('/', validate(createTransactionSchema), transactionsController.create);
router.get('/:id', transactionsController.getById);

export default router;
