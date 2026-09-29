// frontend/src/services/dashboard.service.js
import apiService from './api.service.js';

export const dashboardService = {
  getToday: () => apiService.get('/dashboard/today'),
  getSummary: () => apiService.get('/dashboard/summary'),
  getTopDiagnoses: (limit = 10) => apiService.get(`/dashboard/top-diagnoses?limit=${limit}`),
};

export default dashboardService;
