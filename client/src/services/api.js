import axios from 'axios';

// in dev this falls back to localhost; in prod Vercel injects VITE_API_URL
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',
});

// attach the jwt on every request if we have one
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
