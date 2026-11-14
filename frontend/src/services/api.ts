import axios from 'axios';
import { getGuestSessionId } from './session';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1',
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

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export default api;
