import axios from 'axios';

// talks to our express backend
const api = axios.create({
  baseURL: 'http://localhost:5001/api',
});

// attach the jwt on every request if we have one
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
