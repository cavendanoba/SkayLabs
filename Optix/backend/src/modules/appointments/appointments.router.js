// backend/src/modules/appointments/appointments.router.js
import express from 'express';
import appointmentsController from './appointments.controller.js';
import validate from '../../middlewares/validate.middleware.js';
import auth from '../../middlewares/auth.middleware.js';
import requireRole from '../../middlewares/roles.middleware.js';
import { createAppointmentSchema, updateStatusSchema, rescheduleSchema } from './appointments.schema.js';

const router = express.Router();

router.use(auth, requireRole('ADMIN', 'DOCTOR', 'RECEPTIONIST'));

router.get('/availability', appointmentsController.getAvailability);
router.get('/', appointmentsController.list);
router.post('/', validate(createAppointmentSchema), appointmentsController.create);
router.get('/:id', appointmentsController.getById);
router.patch('/:id/status', validate(updateStatusSchema), appointmentsController.updateStatus);
router.put('/:id/reschedule', validate(rescheduleSchema), appointmentsController.reschedule);

export default router;
