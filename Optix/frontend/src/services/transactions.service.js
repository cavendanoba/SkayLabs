// frontend/src/services/transactions.service.js
import apiService from './api.service.js';

export const transactionsService = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiService.get(`/transactions${qs ? '?' + qs : ''}`);
  },
  getById: (id) => apiService.get(`/transactions/${id}`),
  create: (data) => apiService.post('/transactions', data),
  getSummary: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiService.get(`/transactions/summary${qs ? '?' + qs : ''}`);
  },
};

export default transactionsService;
