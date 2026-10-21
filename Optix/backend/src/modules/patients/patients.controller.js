// backend/src/modules/patients/patients.controller.js
import patientsService from './patients.service.js';

export const patientsController = {
  list: async (req, res, next) => {
    try { res.json(await patientsService.list(req.query)); } catch (e) { next(e); }
  },
  create: async (req, res, next) => {
    try { res.status(201).json(await patientsService.create(req.validated.body)); } catch (e) { next(e); }
  },
  getById: async (req, res, next) => {
    try { res.json(await patientsService.getById(req.params.id)); } catch (e) { next(e); }
  },
  update: async (req, res, next) => {
    try { res.json(await patientsService.update(req.params.id, req.validated.body)); } catch (e) { next(e); }
  },
};

export default patientsController;
