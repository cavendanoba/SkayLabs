// backend/src/modules/dashboard/dashboard.controller.js
import dashboardService from './dashboard.service.js';

export const dashboardController = {
  getToday: async (req, res, next) => {
    try {
      const data = await dashboardService.getToday();
      res.json(data);
    } catch (e) { next(e); }
  },

  getSummary: async (req, res, next) => {
    try {
      const data = await dashboardService.getSummary();
      res.json(data);
    } catch (e) { next(e); }
  },

  getTopDiagnoses: async (req, res, next) => {
    try {
      const limit = req.query.limit || 10;
      const data = await dashboardService.getTopDiagnoses(limit);
      res.json(data);
    } catch (e) { next(e); }
  },
};

export default dashboardController;
