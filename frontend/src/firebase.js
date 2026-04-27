/**
 * Firebase client SDK bootstrap.
 *
 * Single initialization for the whole app — every other module imports
 * `auth` from here. We explicitly set browser-local persistence so the
 * session survives refreshes (the default works in most browsers but
 * can silently fall back to in-memory under privacy modes / iframes).
 *
 * NOTE: the apiKey below is a public client identifier (not a secret) —
 * Firebase relies on Auth domain whitelisting and security rules for
 * actual access control. Still, prefer environment variables in CI:
 * read VITE_FIREBASE_* if present, otherwise fall back to baked-in
 * defaults so local dev keeps working out of the box.
 */
import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';

const env = import.meta.env || {};

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || 'AIzaSyAIkFkDG9dlGDCEvT7H6YNubZqYFDmQwEA',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || 'leed-sphere.firebaseapp.com',
  projectId: env.VITE_FIREBASE_PROJECT_ID || 'leed-sphere',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || 'leed-sphere.firebasestorage.app',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '728850398257',
  appId: env.VITE_FIREBASE_APP_ID || '1:728850398257:web:fc7ea7383b5f58193a6910',
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID || 'G-1J81M5ZWK7',
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Persist sessions across reloads and tab restarts. setPersistence is
// async but doesn't need to block — pending sign-in calls queue against it.
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.warn('[firebase] could not set local persistence:', err?.message || err);
});

// One-time sanity log so you can confirm the SDK booted with the right
// project. Helps catch the "wrong-config / wrong-project" failure mode
// where logins silently 400 because the apiKey points elsewhere.
if (typeof window !== 'undefined') {
  console.info('[firebase] initialized', { projectId: firebaseConfig.projectId, authDomain: firebaseConfig.authDomain });
}

export default app;
