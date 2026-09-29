// backend/src/modules/appointments/appointments.controller.js
import appointmentsService from './appointments.service.js';

export const appointmentsController = {
  list: async (req, res, next) => {
    try { res.json(await appointmentsService.list(req.query)); } catch (e) { next(e); }
  },
  create: async (req, res, next) => {
    try { res.status(201).json(await appointmentsService.create(req.validated.body)); } catch (e) { next(e); }
  },
  getById: async (req, res, next) => {
    try { res.json(await appointmentsService.getById(req.params.id)); } catch (e) { next(e); }
  },
  updateStatus: async (req, res, next) => {
    try { res.json(await appointmentsService.updateStatus(req.params.id, req.validated.body.status)); } catch (e) { next(e); }
  },
  reschedule: async (req, res, next) => {
    try { res.json(await appointmentsService.reschedule(req.params.id, req.validated.body)); } catch (e) { next(e); }
  },
  getAvailability: async (req, res, next) => {
    try { res.json(await appointmentsService.getAvailability(req.query.doctorId, req.query.date)); } catch (e) { next(e); }
  },
};

export default appointmentsController;
