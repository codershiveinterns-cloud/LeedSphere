/**
 * Public alias for the shared axios instance.
 *
 * Why two files? `services/api.js` is the historical home of the instance
 * (with the Firebase ID-token request interceptor and 401-retry response
 * interceptor). New code should `import axiosInstance from '@/lib/axios'`
 * — this file just re-exports the same singleton so the two import paths
 * never diverge.
 *
 * Usage:
 *   import axiosInstance from '@/lib/axios';
 *   const res = await axiosInstance.get('/teams');   // → ${API_BASE_URL}/api/teams
 */
import api from '../services/api';

export default api;
