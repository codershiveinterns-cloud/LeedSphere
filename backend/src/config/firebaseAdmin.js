/**
 * Firebase Admin SDK bootstrap.
 *
 * Verifies Firebase ID tokens issued by the frontend (`user.getIdToken()`).
 * Initialized exactly once per process — re-initializing throws.
 *
 * Credentials resolution (in order):
 *   1. FIREBASE_SERVICE_ACCOUNT  → JSON string of the service account key
 *      (recommended for prod / docker — no file on disk).
 *   2. GOOGLE_APPLICATION_CREDENTIALS → absolute path to the JSON key file
 *      (the standard Google Cloud env var; admin.credential.applicationDefault()
 *      reads it automatically).
 *   3. Application default credentials (gcloud auth, GCP metadata server, …).
 *
 * Get the JSON key from Firebase Console → Project settings → Service accounts
 * → "Generate new private key". Drop it somewhere outside the repo and point
 * one of the env vars at it.
 */
import admin from 'firebase-admin';

let app;

const init = () => {
  if (admin.apps.length) return admin.apps[0];

  const projectId = process.env.FIREBASE_PROJECT_ID || 'leed-sphere';

  // Option 1: full JSON in env var (recommended for hosted environments).
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      const svc = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      return admin.initializeApp({
        credential: admin.credential.cert(svc),
        projectId: svc.project_id || projectId,
      });
    } catch (err) {
      console.error('[firebase-admin] FIREBASE_SERVICE_ACCOUNT is not valid JSON:', err.message);
      throw err;
    }
  }

  // Option 2 & 3: GOOGLE_APPLICATION_CREDENTIALS or ADC.
  return admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId,
  });
};

try {
  app = init();
  console.log(`[firebase-admin] initialized for project '${app.options.projectId}'`);
} catch (err) {
  // Don't crash the whole server here — the auth middleware will reject
  // every request with a clear "admin not configured" error instead.
  console.error('[firebase-admin] failed to initialize:', err.message);
}

export const firebaseAuth = () => admin.auth();
export default admin;
