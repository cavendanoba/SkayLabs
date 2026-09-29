// frontend/src/services/hx-records.service.js
import apiService from './api.service.js';

export const hxRecordsService = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiService.get(`/hx-records${qs ? '?' + qs : ''}`);
  },
  getById: (id) => apiService.get(`/hx-records/${id}`),
  create: (data) => apiService.post('/hx-records', data),
  update: (id, data) => apiService.put(`/hx-records/${id}`, data),
  finalize: (id) => apiService.post(`/hx-records/${id}/finalize`, {}),
};

export default hxRecordsService;
