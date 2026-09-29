// backend/src/modules/hx-records/hx-records.router.js
import express from 'express';
import hxRecordsController from './hx-records.controller.js';
import validate from '../../middlewares/validate.middleware.js';
import auth from '../../middlewares/auth.middleware.js';
import requireRole from '../../middlewares/roles.middleware.js';
import { createHxRecordSchema, updateHxRecordSchema } from './hx-records.schema.js';

const router = express.Router();

router.use(auth, requireRole('ADMIN', 'DOCTOR'));

router.get('/', hxRecordsController.list);
router.post('/', validate(createHxRecordSchema), hxRecordsController.create);
router.get('/:id', hxRecordsController.getById);
router.put('/:id', validate(updateHxRecordSchema), hxRecordsController.update);
router.post('/:id/finalize', hxRecordsController.finalize);

export default router;
