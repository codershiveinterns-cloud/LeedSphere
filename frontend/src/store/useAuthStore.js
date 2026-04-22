import { create } from 'zustand';
import api from '../services/api';

const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('user')) || null,
  isAuthenticated: !!localStorage.getItem('user'),
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const mockUser = {
        _id: Math.random().toString(36).substr(2, 9),
        name: email.split('@')[0],
        email: email
      };
      set({ user: mockUser, isAuthenticated: true, isLoading: false });
      localStorage.setItem('user', JSON.stringify(mockUser));
    } catch (error) {
      set({ error: 'Login failed', isLoading: false });
      throw error;
    }
  },

  register: async (name, email, password) => {
    set({ isLoading: true, error: null });
    try {
      const mockUser = {
        _id: Math.random().toString(36).substr(2, 9),
        name: name,
        email: email
      };
      set({ user: mockUser, isAuthenticated: true, isLoading: false });
      localStorage.setItem('user', JSON.stringify(mockUser));
    } catch (error) {
      set({ error: 'Registration failed', isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    set({ user: null, isAuthenticated: false });
    localStorage.removeItem('user');
  },
}));

export default useAuthStore;
