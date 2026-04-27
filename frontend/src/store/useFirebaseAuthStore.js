/**
 * Firebase auth store — single source of truth for the current Firebase
 * user + a `ready` hydration flag.
 *
 * Wired ONCE from main.jsx via `useFirebaseAuthStore.getState().init()`.
 * Components must consume fields with selectors:
 *   const currentUser = useFirebaseAuthStore((s) => s.currentUser);
 * Never destructure the whole store — that returns a fresh object every
 * render and re-renders the consumer in a loop.
 */
import { create } from 'zustand';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import { reloadUser as reloadFirebaseUser } from '../services/authService';
import api from '../services/api';

// Module-scoped flags so a second init() (StrictMode double-mount, HMR,
// accidental component-level call, etc.) bails out immediately instead of
// stacking listeners. `isInitialized` is the explicit guard the spec asks
// for; `unsubscribe` is kept so HMR / tests can tear down cleanly.
let isInitialized = false;
let unsubscribe = null;

const useFirebaseAuthStore = create((set, get) => ({
  currentUser: null,
  ready: false,
  // Mongo-side profile of the signed-in user — { _id, name, email, avatar, ... }.
  // Lazy-fetched the first time something calls fetchProfile(). Used by chat
  // UI to compare message.senderId._id against the current user's Mongo _id
  // so "isMe" is reliable (Firebase uid is not the Mongo _id).
  profile: null,
  profileLoading: false,

  /**
   * Subscribe once to Firebase auth-state. Strictly idempotent.
   * Returns the unsubscribe so callers (tests, HMR cleanup) can tear down.
   */
  init: () => {
    if (isInitialized) {
      console.info('[firebase-auth] init() already ran — skipping');
      return unsubscribe;
    }
    isInitialized = true;
    console.info('[firebase-auth] init() ✓ subscribing to onAuthStateChanged (one-time)');

    unsubscribe = onAuthStateChanged(auth, (user) => {
      const prevUid = get().currentUser?.uid;
      set((state) => {
        // Skip when the meaningful identity hasn't changed AND we've
        // already hydrated. Token refreshes give us a new object ref but
        // unchanged uid/emailVerified — propagating those would re-render
        // every subscriber for no reason.
        const sameId = state.currentUser?.uid === user?.uid;
        const sameVerified = state.currentUser?.emailVerified === user?.emailVerified;
        if (state.ready && sameId && sameVerified) {
          console.debug('[firebase-auth] onAuthStateChanged: no-op (same user)');
          return state;
        }
        console.info('[firebase-auth] onAuthStateChanged →', user ? { uid: user.uid, emailVerified: user.emailVerified } : null);
        // Drop the cached profile if identity changed (sign-out, account
        // switch). It'll be re-fetched below.
        return { currentUser: user, ready: true, profile: prevUid === user?.uid ? state.profile : null };
      });

      // Lazy-load the Mongo profile after a real verified user lands. Done
      // outside the set() so it doesn't block the state update.
      if (user?.emailVerified) {
        get().fetchProfile().catch(() => { /* logged inside */ });
      }
    });
    return unsubscribe;
  },

  /**
   * Fetch and cache the Mongo profile from /api/auth/me. Idempotent —
   * re-calls overwrite. Components should call this once after login (e.g.
   * the auth-state listener triggers it) and then read `profile` via a
   * selector. Returns the profile (or null on failure).
   */
  fetchProfile: async () => {
    if (get().profileLoading) return get().profile;
    set({ profileLoading: true });
    try {
      const res = await api.get('/auth/me');
      const profile = res?.data || null;
      set({ profile, profileLoading: false });
      return profile;
    } catch (err) {
      console.warn('[firebase-auth] fetchProfile failed:', err?.message || err);
      set({ profileLoading: false });
      return null;
    }
  },

  /**
   * Manually re-pull the user (verification flips don't fire
   * onAuthStateChanged). Same identity guard as above.
   */
  refresh: async () => {
    const user = await reloadFirebaseUser();
    set((state) => {
      const sameId = state.currentUser?.uid === user?.uid;
      const sameVerified = state.currentUser?.emailVerified === user?.emailVerified;
      if (state.ready && sameId && sameVerified) return state;
      return { currentUser: user, ready: true };
    });
    return user;
  },
}));

/**
 * Back-compat shim — main.jsx still imports this name. Forwards to the
 * store's init().
 */
export const initFirebaseAuthStore = () => useFirebaseAuthStore.getState().init();

export default useFirebaseAuthStore;
