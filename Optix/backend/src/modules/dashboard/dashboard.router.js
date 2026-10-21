// backend/src/modules/dashboard/dashboard.router.js
import express from 'express';
import dashboardController from './dashboard.controller.js';
import auth from '../../middlewares/auth.middleware.js';
import requireRole from '../../middlewares/roles.middleware.js';

const router = express.Router();

router.use(auth, requireRole('ADMIN', 'DOCTOR', 'RECEPTIONIST'));

router.get('/today', dashboardController.getToday);
router.get('/summary', dashboardController.getSummary);
router.get('/top-diagnoses', dashboardController.getTopDiagnoses);

export default router;
