// backend/src/modules/users/users.controller.js
import usersService from './users.service.js';

export const usersController = {
  list: async (req, res, next) => {
    try { res.json(await usersService.list()); } catch (e) { next(e); }
  },
  create: async (req, res, next) => {
    try { res.status(201).json(await usersService.create(req.validated.body)); } catch (e) { next(e); }
  },
  getById: async (req, res, next) => {
    try { res.json(await usersService.getById(req.params.id)); } catch (e) { next(e); }
  },
  update: async (req, res, next) => {
    try { res.json(await usersService.update(req.params.id, req.validated.body)); } catch (e) { next(e); }
  },
  updateStatus: async (req, res, next) => {
    try { res.json(await usersService.updateStatus(req.params.id, req.validated.body.active)); } catch (e) { next(e); }
  },
};

export default usersController;
