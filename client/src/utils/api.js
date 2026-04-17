import axios from 'axios';

const api = axios.create({
  baseURL: 'https://aerodynamics-backendv2.onrender.com/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Helper: converts DB image paths like "/drones/motor.png" to work on GitHub Pages
export function assetUrl(path) {
  if (!path) return '';
  const base = import.meta.env.BASE_URL || '/';
  // Remove leading slash from path to avoid double slashes
  const clean = path.startsWith('/') ? path.slice(1) : path;
  return base + clean;
}

export default api;
