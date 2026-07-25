import axios from 'axios';

// In dev, Vite proxies /api to the backend (see vite.config.ts).
// In production, set VITE_API_URL to the deployed Render backend URL.
export let baseURL = import.meta.env.VITE_API_URL || '/api';
if (baseURL !== '/api' && !baseURL.endsWith('/api')) {
  baseURL = baseURL.replace(/\/$/, '') + '/api';
}

export const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach the admin JWT (if present) to every outgoing request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('catalyst_admin_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// If the admin's token has expired, bounce them back to the login page.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && window.location.pathname.startsWith('/admin')) {
      localStorage.removeItem('catalyst_admin_token');
      if (window.location.pathname !== '/admin/login') {
        window.location.href = '/admin/login';
      }
    }
    return Promise.reject(error);
  }
);

// A separate instance for multipart/form-data (PDF + copyright form uploads).
export const apiUpload = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});

// Attach the admin JWT to file upload requests too.
apiUpload.interceptors.request.use((config) => {
  const token = localStorage.getItem('catalyst_admin_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Converts a relative upload path (e.g. `/uploads/news/abc.jpg`) to an
 * absolute URL that works in both development and production.
 *
 * - Dev: Vite proxies `/uploads` → `localhost:5000`, so the path is returned
 *   as-is (the proxy handles it).
 * - Production: `VITE_API_URL` is set to the backend origin (e.g.
 *   `https://api.example.com`), so we prepend it here.
 * - Already-absolute URLs (starting with `http`) are returned unchanged.
 */
const API_ORIGIN = (import.meta.env.VITE_API_URL || '').replace(/\/api$/, '');

export function getImageUrl(path: string | undefined | null): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  // Relative path like /uploads/...
  return API_ORIGIN ? `${API_ORIGIN}${path}` : path;
}
