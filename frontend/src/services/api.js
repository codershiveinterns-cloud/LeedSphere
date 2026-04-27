import axios from 'axios';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';

const api = axios.create({
  baseURL: 'http://localhost:5005/api',
  withCredentials: true,
});

/**
 * Resolve current Firebase user at request time.
 * Handles refresh boot races where `auth.currentUser` is briefly null.
 */
const waitForFirebaseUser = async (timeoutMs = 3000) => {
  if (auth.currentUser) return auth.currentUser;

  if (typeof auth.authStateReady === 'function') {
    try {
      await Promise.race([
        auth.authStateReady(),
        new Promise((resolve) => setTimeout(resolve, timeoutMs)),
      ]);
    } catch {
      // Fall through to onAuthStateChanged fallback.
    }
    if (auth.currentUser) return auth.currentUser;
  }

  return new Promise((resolve) => {
    let settled = false;
    let unsubscribe = null;

    const finish = (user) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (unsubscribe) unsubscribe();
      resolve(user || null);
    };

    const timer = setTimeout(() => finish(auth.currentUser || null), timeoutMs);
    unsubscribe = onAuthStateChanged(
      auth,
      (user) => finish(user),
      () => finish(null),
    );
  });
};

const getFirebaseIdToken = async (forceRefresh = false) => {
  const user = auth.currentUser || await waitForFirebaseUser();
  if (!user) return null;

  try {
    return await user.getIdToken(forceRefresh);
  } catch (err) {
    console.warn('[api] getIdToken failed:', err?.message || err);
    return null;
  }
};

/**
 * Attach Firebase ID token and active team/workspace context to every request.
 */
api.interceptors.request.use(async (config) => {
  const token = await getFirebaseIdToken();

  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
    console.debug('[api] attached Authorization header', {
      method: (config.method || 'get').toUpperCase(),
      url: config.url,
      tokenPreview: `${token.slice(0, 12)}...`,
    });
  } else {
    console.warn('[api] request has no Firebase token', {
      method: (config.method || 'get').toUpperCase(),
      url: config.url,
    });
  }

  try {
    const teamRaw = localStorage.getItem('team-storage');
    if (teamRaw) {
      const parsed = JSON.parse(teamRaw);
      const ct = parsed?.state?.currentTeam;
      if (ct?.teamId) {
        config.headers['X-Team-Id'] = ct.teamId;
        config.headers.teamId = ct.teamId;
      }
      if (ct?.workspaceId) {
        config.headers['X-Workspace-Id'] = ct.workspaceId;
        config.headers.workspaceId = ct.workspaceId;
      }
    }
  } catch {
    // ignore storage parse failures
  }

  return config;
});

/**
 * Handle 401 globally: force-refresh token once, then redirect to /login.
 */
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config || {};
    const currentUser = auth.currentUser || await waitForFirebaseUser();

    if (error.response?.status === 401 && !original._retried && currentUser) {
      original._retried = true;
      try {
        const fresh = await getFirebaseIdToken(true);
        if (!fresh) throw new Error('No token after force refresh');
        original.headers = { ...original.headers, Authorization: `Bearer ${fresh}` };
        return api.request(original);
      } catch {
        // fall through to redirect
      }
    }

    if (error.response?.status === 401) {
      console.warn('[api] 401 from backend', {
        method: (original.method || 'get').toUpperCase(),
        url: original.url,
      });
      if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/signup')) {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;
