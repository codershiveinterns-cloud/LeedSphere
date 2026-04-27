/**
 * Auth service — thin wrapper around Firebase Auth so UI components stay
 * declarative. All functions throw `Error` with a human-readable message;
 * components just `try/await` and surface `err.message`.
 *
 * Every public function also logs at three points (before / after / error)
 * under the `[auth]` prefix so a console transcript is enough to diagnose
 * failures without adding ad-hoc instrumentation in callers.
 *
 * Public surface:
 *   signUp(email, password, displayName?)   → user
 *   logIn(email, password)                  → { user, emailVerified }
 *   resendVerification()                    → void
 *   sendReset(email)                        → void
 *   logOut()                                → void
 *   reloadUser()                            → user | null
 *   subscribe(cb)                           → unsubscribe
 */
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  onAuthStateChanged,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { auth } from '../firebase';

/**
 * Map Firebase error codes to messages users can act on. Firebase's raw
 * `error.code` strings ("auth/invalid-credential" etc.) leak implementation
 * details and look hostile — translate them once here.
 *
 * Note: Firebase v9.20+ collapses several login failures (wrong-password,
 * user-not-found, …) into the single 'auth/invalid-credential' code as a
 * privacy hardening, so we keep both old + new codes mapped.
 */
const FIREBASE_ERROR_MESSAGES = {
  'auth/email-already-in-use':       'An account with this email already exists.',
  'auth/invalid-email':              'Please enter a valid email address.',
  'auth/operation-not-allowed':      'Email/password sign-in is disabled in Firebase Console. Enable it under Authentication → Sign-in method.',
  'auth/weak-password':              'Password must be at least 6 characters.',
  'auth/user-disabled':              'This account has been disabled.',
  'auth/user-not-found':             'No account found for that email.',
  'auth/wrong-password':             'Incorrect password.',
  'auth/invalid-credential':         'Invalid email or password.',
  'auth/invalid-login-credentials':  'Invalid email or password.',
  'auth/too-many-requests':          'Too many attempts. Please wait a few minutes and try again.',
  'auth/network-request-failed':     'Network error. Check your connection and retry.',
  'auth/missing-email':              'Please enter your email address.',
  'auth/missing-password':           'Please enter your password.',
  'auth/internal-error':             'Internal Firebase error. Try again in a moment.',
  'auth/requires-recent-login':      'Please sign in again to continue.',
  'auth/popup-closed-by-user':       'Sign-in window was closed before completing.',
  'auth/api-key-not-valid':          'Firebase API key is not valid for this project. Check firebase.js config.',
  'auth/configuration-not-found':    'Firebase project is not configured for Email/Password sign-in.',
};

const toFriendlyError = (err) => {
  const code = err?.code || '';
  // Always log the raw code/message so the developer can see exactly what
  // Firebase rejected with. The user-facing message is the friendly one.
  console.error('[auth] firebase error', { code, message: err?.message });
  const e = new Error(FIREBASE_ERROR_MESSAGES[code] || err?.message || 'Something went wrong. Please try again.');
  e.code = code;
  return e;
};

/**
 * Create a new account, set the display name, fire a verification email.
 * Caller is expected to sign the user out and gate dashboard access until
 * the verification link is clicked.
 */
export const signUp = async (email, password, displayName = '') => {
  console.info('[auth] signUp →', email);
  try {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
    console.info('[auth] signUp ✓ uid=', cred.user.uid);
    if (displayName.trim()) {
      try { await updateProfile(cred.user, { displayName: displayName.trim() }); }
      catch (err) { console.warn('[auth] updateProfile failed (non-fatal):', err?.message); }
    }
    await sendEmailVerification(cred.user);
    console.info('[auth] verification email sent');
    return cred.user;
  } catch (err) {
    throw toFriendlyError(err);
  }
};

/**
 * Sign in with email/password.
 *
 * Returns BOTH the user and the verification flag so the caller has a
 * single, explicit place to decide routing — no silent failures.
 *   - throws on a real auth failure (bad creds, network, etc.)
 *   - returns { user, emailVerified: false } when the account exists but
 *     hasn't been verified yet — caller should redirect to /verify-email.
 *
 * The previous version threw a synthetic "EMAIL_NOT_VERIFIED" error which
 * some callers caught generically and silently swallowed. Returning data
 * makes that impossible.
 */
export const logIn = async (email, password) => {
  const cleanedEmail = (email || '').trim();
  console.info('[auth] logIn →', cleanedEmail);

  if (!cleanedEmail || !password) {
    const e = new Error('Email and password are required.');
    console.error('[auth] logIn ✗ missing fields');
    throw e;
  }

  try {
    const cred = await signInWithEmailAndPassword(auth, cleanedEmail, password);
    console.info('[auth] logIn ✓', {
      uid: cred.user.uid,
      emailVerified: cred.user.emailVerified,
    });
    return { user: cred.user, emailVerified: cred.user.emailVerified };
  } catch (err) {
    throw toFriendlyError(err);
  }
};

/**
 * Resend the verification email to whoever is currently signed in.
 * Firebase only lets us send to `auth.currentUser`, so callers leaving
 * the user signed-in-but-unverified is the supported path.
 */
export const resendVerification = async () => {
  console.info('[auth] resendVerification →', auth.currentUser?.email || '(no user)');
  try {
    if (!auth.currentUser) {
      throw new Error('Sign in first to resend verification.');
    }
    await sendEmailVerification(auth.currentUser);
    console.info('[auth] resendVerification ✓');
  } catch (err) {
    throw toFriendlyError(err);
  }
};

/** Trigger a password-reset email. */
export const sendReset = async (email) => {
  console.info('[auth] sendReset →', email);
  try {
    await sendPasswordResetEmail(auth, (email || '').trim());
    console.info('[auth] sendReset ✓');
  } catch (err) {
    throw toFriendlyError(err);
  }
};

/** Sign the current user out. */
export const logOut = async () => {
  console.info('[auth] logOut');
  try { await signOut(auth); }
  catch (err) { throw toFriendlyError(err); }
};

/**
 * Force-refresh the current user from Firebase so the client picks up
 * verification flips that happen in another tab. After reload(),
 * `auth.currentUser.emailVerified` reflects the latest server value.
 */
export const reloadUser = async () => {
  try {
    if (!auth.currentUser) return null;
    await auth.currentUser.reload();
    console.info('[auth] reloadUser ✓', { emailVerified: auth.currentUser.emailVerified });
    return auth.currentUser;
  } catch (err) {
    throw toFriendlyError(err);
  }
};

/**
 * Subscribe to auth-state changes. Logs every transition so a stuck
 * UI state ("nothing happens after login") is one console line away
 * from a diagnosis.
 */
export const subscribe = (cb) => onAuthStateChanged(auth, (user) => {
  console.info('[auth] onAuthStateChanged →', user ? { uid: user.uid, emailVerified: user.emailVerified } : null);
  cb(user);
});
