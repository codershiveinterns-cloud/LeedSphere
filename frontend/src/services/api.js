import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5005/api',
  withCredentials: true,
});

// Attach JWT token + current team id to every request.
api.interceptors.request.use((config) => {
  const stored = localStorage.getItem('user');
  if (stored) {
    try {
      const user = JSON.parse(stored);
      if (user?.token) {
        config.headers.Authorization = `Bearer ${user.token}`;
      }
    } catch {
      // invalid stored data
    }
  }

  // Send the active team + workspace ids with every request so backend
  // middleware can resolve role + scope queries. Reads directly from the
  // zustand `persist` blob to avoid a circular import with the store.
  //   team-storage shape: { state: { currentTeam: { teamId, role, workspaceId } }, version }
  try {
    const teamRaw = localStorage.getItem('team-storage');
    if (teamRaw) {
      const parsed = JSON.parse(teamRaw);
      const ct = parsed?.state?.currentTeam;
      if (ct?.teamId) {
        config.headers['X-Team-Id'] = ct.teamId;
        config.headers['teamId'] = ct.teamId; // spec-requested header name
      }
      if (ct?.workspaceId) {
        config.headers['X-Workspace-Id'] = ct.workspaceId;
        config.headers['workspaceId'] = ct.workspaceId;
      }
    }
  } catch {
    // ignore
  }

  return config;
});

// Handle 401 globally — logout on token expiry
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('user');
      // Only redirect if not already on auth pages
      if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
