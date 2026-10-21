// backend/src/modules/auth/auth.router.js
import express from 'express';
import authController from './auth.controller.js';
import validateRequest from '../../middlewares/validate.middleware.js';
import authMiddleware from '../../middlewares/auth.middleware.js';
import { loginSchema, refreshSchema } from './auth.schema.js';

const router = express.Router();

router.post('/login', validateRequest(loginSchema), authController.login);
router.post('/refresh', validateRequest(refreshSchema), authController.refresh);
router.post('/logout', authMiddleware, authController.logout);
router.get('/me', authMiddleware, authController.getMe);

export default router;
