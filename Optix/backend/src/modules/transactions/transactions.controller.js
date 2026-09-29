// backend/src/modules/transactions/transactions.controller.js
import transactionsService from './transactions.service.js';

export const transactionsController = {
  list: async (req, res, next) => {
    try {
      const result = await transactionsService.list(req.query);
      res.json(result);
    } catch (e) { next(e); }
  },

  create: async (req, res, next) => {
    try {
      const transaction = await transactionsService.create(req.validated.body);
      res.status(201).json(transaction);
    } catch (e) { next(e); }
  },

  getById: async (req, res, next) => {
    try {
      const transaction = await transactionsService.getById(req.params.id);
      res.json(transaction);
    } catch (e) { next(e); }
  },

  getSummary: async (req, res, next) => {
    try {
      const summary = await transactionsService.getSummary(req.query);
      res.json(summary);
    } catch (e) { next(e); }
  },
};

export default transactionsController;
