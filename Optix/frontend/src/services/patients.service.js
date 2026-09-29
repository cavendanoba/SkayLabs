// frontend/src/services/patients.service.js
import apiService from './api.service.js';

export const patientsService = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiService.get(`/patients${qs ? '?' + qs : ''}`);
  },
  getById: (id) => apiService.get(`/patients/${id}`),
  create: (data) => apiService.post('/patients', data),
  update: (id, data) => apiService.put(`/patients/${id}`, data),
};

export default patientsService;
