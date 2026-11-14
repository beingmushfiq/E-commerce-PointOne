import axios from 'axios';
import { getGuestSessionId } from './session';

const getApiBaseUrl = (): string => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return 'https://api.centerpoint.devcenterpoint.com/api/v1';
  }
  return 'http://localhost:8000/api/v1';
};

const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  // Always attach immutable guest session ID
  config.headers['X-Session-ID'] = getGuestSessionId();

  // If request already has an Authorization header, don't overwrite it
  if (!config.headers.Authorization) {
    const url = config.url || '';
    let token: string | null = null;

    if (url.startsWith('/platform/')) {
      token = localStorage.getItem('cp_platform_token') || localStorage.getItem('mcp_token');
    } else if (
      url.startsWith('/admin/') ||
      url.startsWith('/inventory/') ||
      url.startsWith('/accounting/') ||
      url.startsWith('/cms/admin/') ||
      url.startsWith('/fulfillment/book')
    ) {
      token = localStorage.getItem('cp_staff_token');
    } else if (url.startsWith('/customer/')) {
      token = localStorage.getItem('cp_customer_token');
    }

    // Fallback to legacy or active generic token
    if (!token) {
      token =
        localStorage.getItem('token') ||
        localStorage.getItem('auth_token') ||
        localStorage.getItem('cp_staff_token') ||
        localStorage.getItem('cp_platform_token');
    }

    if (token && !token.startsWith('mock_')) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const url = error.config?.url || '';
      if (url.includes('/auth/me') || url.includes('/auth/logout')) {
        localStorage.removeItem('cp_staff_token');
        localStorage.removeItem('token');
        localStorage.removeItem('auth_token');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
