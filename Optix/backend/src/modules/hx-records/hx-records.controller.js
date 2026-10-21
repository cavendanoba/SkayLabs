// backend/src/modules/hx-records/hx-records.controller.js
import hxRecordsService from './hx-records.service.js';

export const hxRecordsController = {
  list: async (req, res, next) => {
    try { res.json(await hxRecordsService.list(req.query)); } catch (e) { next(e); }
  },
  create: async (req, res, next) => {
    try { res.status(201).json(await hxRecordsService.create(req.validated.body)); } catch (e) { next(e); }
  },
  getById: async (req, res, next) => {
    try { res.json(await hxRecordsService.getById(req.params.id)); } catch (e) { next(e); }
  },
  update: async (req, res, next) => {
    try { res.json(await hxRecordsService.update(req.params.id, req.validated.body)); } catch (e) { next(e); }
  },
  finalize: async (req, res, next) => {
    try { res.json(await hxRecordsService.finalize(req.params.id)); } catch (e) { next(e); }
  },
};

export default hxRecordsController;
