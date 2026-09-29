// backend/src/modules/users/users.router.js
import express from 'express';
import usersController from './users.controller.js';
import validate from '../../middlewares/validate.middleware.js';
import auth from '../../middlewares/auth.middleware.js';
import requireRole from '../../middlewares/roles.middleware.js';
import { createUserSchema, updateUserSchema, updateStatusSchema } from './users.schema.js';

const router = express.Router();

router.use(auth, requireRole('ADMIN'));

router.get('/', usersController.list);
router.post('/', validate(createUserSchema), usersController.create);
router.get('/:id', usersController.getById);
router.put('/:id', validate(updateUserSchema), usersController.update);
router.patch('/:id/status', validate(updateStatusSchema), usersController.updateStatus);

export default router;
