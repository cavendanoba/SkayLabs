// frontend/src/services/auth.service.js

import apiService from './api.service.js';

export const authService = {
  async login(email, password) {
    const response = await apiService.post('/auth/login', { email, password });
    localStorage.setItem('accessToken', response.accessToken);
    localStorage.setItem('refreshToken', response.refreshToken);
    localStorage.setItem('user', JSON.stringify(response.user));
    return response.user;
  },

  async logout() {
    try {
      await apiService.post('/auth/logout', {});
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  },

  async getMe() {
    try {
      return await apiService.get('/auth/me');
    } catch (error) {
      throw error;
    }
  },

  getLocalUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  isAuthenticated() {
    return !!localStorage.getItem('accessToken');
  },

  getAccessToken() {
    return localStorage.getItem('accessToken');
  },
};

export default authService;
