// frontend/src/services/appointments.service.js
import apiService from './api.service.js';

export const appointmentsService = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiService.get(`/appointments${qs ? '?' + qs : ''}`);
  },
  getById: (id) => apiService.get(`/appointments/${id}`),
  create: (data) => apiService.post('/appointments', data),
  updateStatus: (id, status) => apiService.patch(`/appointments/${id}/status`, { status }),
  reschedule: (id, data) => apiService.put(`/appointments/${id}/reschedule`, data),
  getAvailability: (doctorId, date) =>
    apiService.get(`/appointments/availability?doctorId=${doctorId}&date=${date}`),
};

export default appointmentsService;
