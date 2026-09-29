// backend/src/modules/patients/patients.router.js
import express from 'express';
import patientsController from './patients.controller.js';
import validate from '../../middlewares/validate.middleware.js';
import auth from '../../middlewares/auth.middleware.js';
import requireRole from '../../middlewares/roles.middleware.js';
import { createPatientSchema, updatePatientSchema } from './patients.schema.js';

const router = express.Router();

router.use(auth, requireRole('ADMIN', 'DOCTOR', 'RECEPTIONIST'));

router.get('/', patientsController.list);
router.post('/', validate(createPatientSchema), patientsController.create);
router.get('/:id', patientsController.getById);
router.put('/:id', validate(updatePatientSchema), patientsController.update);

export default router;
