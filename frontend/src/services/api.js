import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5005/', // New port without /api since the new backend routes are mounted on root
  withCredentials: true,
});

export default api;
