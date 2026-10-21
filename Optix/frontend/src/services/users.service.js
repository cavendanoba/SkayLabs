// frontend/src/services/users.service.js
import apiService from './api.service.js';

export const usersService = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiService.get(`/users${qs ? '?' + qs : ''}`);
  },
  getById: (id) => apiService.get(`/users/${id}`),
  create: (data) => apiService.post('/users', data),
  update: (id, data) => apiService.put(`/users/${id}`, data),
  updateStatus: (id, active) => apiService.patch(`/users/${id}/status`, { active }),
};

export default usersService;
