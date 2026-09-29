// frontend/src/services/api.service.js

const API_URL = 'http://localhost:3001/api/v1';

export const apiService = {
  async request(endpoint, options = {}) {
    const url = `${API_URL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const token = localStorage.getItem('accessToken');
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    try {
      let response = await fetch(url, {
        ...options,
        headers,
      });

      // Si 401, intentar refresh
      if (response.status === 401 && token) {
        const refreshed = await this.refreshToken();
        if (refreshed) {
          // Reintentar la solicitud original
          response = await fetch(url, {
            ...options,
            headers: {
              ...headers,
              Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
            },
          });
        }
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw {
          status: response.status,
          ...errorData,
        };
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  },

  post(endpoint, body) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  put(endpoint, body) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },

  patch(endpoint, body) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  },

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  },

  async refreshToken() {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) return false;

      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) return false;

      const data = await response.json();
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      return true;
    } catch (error) {
      return false;
    }
  },
};

export default apiService;
