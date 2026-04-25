import { create } from 'zustand';
import api from '../services/api';
import useCurrentTeamStore from './useCurrentTeamStore';
import useAppStore from './useAppStore';

/**
 * We do NOT store a role on `user`. Roles are per-team and live on
 * `useCurrentTeamStore.currentTeam.role`. The login flow fetches the user's
 * TeamMember records via /auth/me/teams and returns them so the caller can
 * route appropriately (0/1/N teams → create / auto-select / picker).
 */

const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('user')) || null,
  isAuthenticated: !!localStorage.getItem('user'),
  isLoading: false,
  error: null,

  // Loads the user's TeamMember records from the server.
  // Returns [{ teamId, role, team, designation, joinedAt }, ...]
  fetchMyTeams: async () => {
    const res = await api.get('/auth/me/teams');
    return res.data?.memberships || [];
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      // Defensive: wipe any in-memory state from a previous user session
      // BEFORE we start fetching as the new user. Without this the new
      // user briefly sees the previous user's workspaces/teams.
      useAppStore.getState().reset();
      useCurrentTeamStore.getState().clear();

      const res = await api.post('/auth/login', { email, password });
      const user = res.data;
      set({ user, isAuthenticated: true, isLoading: false });
      localStorage.setItem('user', JSON.stringify(user));

      // Immediately fetch teams so the caller can decide routing.
      let memberships = [];
      try {
        const res2 = await api.get('/auth/me/teams');
        memberships = res2.data?.memberships || [];
      } catch { /* non-fatal; caller will handle empty list */ }

      return { user, memberships };
    } catch (error) {
      const msg = error.response?.data?.message || 'Login failed';
      set({ error: msg, isLoading: false });
      throw new Error(msg);
    }
  },

  register: async (name, email, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/auth/register', { name, email, password });
      const user = res.data;
      set({ user, isAuthenticated: true, isLoading: false });
      localStorage.setItem('user', JSON.stringify(user));
      // A freshly-registered user has no teams yet. Returning an empty list
      // signals the caller to send them to onboarding.
      return { user, memberships: [] };
    } catch (error) {
      const msg = error.response?.data?.message || 'Registration failed';
      set({ error: msg, isLoading: false });
      throw new Error(msg);
    }
  },

  logout: () => {
    set({ user: null, isAuthenticated: false });
    localStorage.removeItem('user');
    localStorage.removeItem('starredTeams');
    localStorage.removeItem('recentItems');
    // Clear every user-scoped slice so the next login starts from a clean
    // slate. Without these the new user momentarily sees the previous
    // user's workspaces/teams from in-memory state.
    useCurrentTeamStore.getState().clear();
    useAppStore.getState().reset();
  },
}));

export default useAuthStore;
