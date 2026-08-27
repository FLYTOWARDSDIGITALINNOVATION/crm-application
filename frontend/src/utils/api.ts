import axios from 'axios';

const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

const api = axios.create({
  baseURL: isLocal ? 'http://localhost:5000/api' : '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add interceptor for auth token if needed
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (typeof FormData !== 'undefined' && config.data instanceof FormData && config.headers) {
    const headers = config.headers as any;

    if (typeof headers.delete === 'function') {
      headers.delete('Content-Type');
    }
  }
  return config;
});

// Add response interceptor to handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const isForceLogout = error.response.data?.isForceLogout;
      const msg = error.response.data?.message;
      
      if (isForceLogout || msg === 'You have been logged out by the Super Admin.') {
        window.dispatchEvent(
          new CustomEvent('show_force_logout_modal', {
            detail: { message: msg || 'You have been logged out by the Super Admin.' }
          })
        );
      } else {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
