import { create } from 'zustand';
import api from '../services/api';

const HISTORY_KEY = 'search:recent';
const MAX_HISTORY = 6;

const emptyResults = { teams: [], channels: [], messages: [], notes: [], users: [] };

const loadHistory = () => {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr.slice(0, MAX_HISTORY) : [];
  } catch {
    return [];
  }
};

const saveHistory = (list) => {
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(list.slice(0, MAX_HISTORY))); }
  catch { /* ignore quota errors */ }
};

const useSearchStore = create((set, get) => ({
  isOpen: false,
  query: '',
  results: emptyResults,
  isSearching: false,
  recent: loadHistory(),

  // last query that returned `results` — used to ignore stale responses.
  _lastFetchId: 0,

  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false, query: '', results: emptyResults, isSearching: false }),
  toggle: () => set((s) => ({ isOpen: !s.isOpen, query: s.isOpen ? '' : s.query })),

  setQuery: (query) => set({ query }),

  runSearch: async (q, workspaceId) => {
    const trimmed = (q || '').trim();
    if (!trimmed) {
      set({ results: emptyResults, isSearching: false });
      return;
    }
    const fetchId = get()._lastFetchId + 1;
    set({ isSearching: true, _lastFetchId: fetchId });
    try {
      const res = await api.get('/search', { params: { q: trimmed, workspaceId } });
      // Only apply if this is still the latest in-flight request.
      if (get()._lastFetchId !== fetchId) return;
      set({ results: res.data || emptyResults, isSearching: false });
    } catch {
      if (get()._lastFetchId !== fetchId) return;
      set({ results: emptyResults, isSearching: false });
    }
  },

  recordRecent: (term) => {
    const t = (term || '').trim();
    if (!t) return;
    const next = [t, ...get().recent.filter(x => x.toLowerCase() !== t.toLowerCase())].slice(0, MAX_HISTORY);
    set({ recent: next });
    saveHistory(next);
  },

  clearRecent: () => {
    set({ recent: [] });
    saveHistory([]);
  },
}));

export default useSearchStore;
