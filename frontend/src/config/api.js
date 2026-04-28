/**
 * Single source of truth for the API origin.
 *
 * Resolution order (first non-empty wins):
 *   1. VITE_API_URL — the env var set in .env.development / .env.production
 *      (or in the Vercel dashboard for prod deploys).
 *   2. http://localhost:5005 — fallback for older local setups that haven't
 *      created a .env file yet. Safe to leave; it only kicks in if the
 *      build-time env var is missing.
 *
 * Important: must be read via `import.meta.env`, NOT `process.env`. Vite
 * substitutes `import.meta.env.VITE_*` at build time; `process.env` is
 * Node-only and undefined in the browser bundle.
 */
const RAW = (import.meta?.env?.VITE_API_URL || 'http://localhost:5005').trim();

// Strip a trailing slash so callers can write `${API_BASE_URL}/api/foo`
// without ever doubling the slash.
export const API_BASE_URL = RAW.replace(/\/+$/, '');

/**
 * The path prefix every REST endpoint sits under. Most of the backend
 * routes are mounted at `/api/...`, so axios uses this as its baseURL.
 */
export const API_PREFIX = '/api';

/**
 * Full REST root, e.g. https://leedsphere.onrender.com/api
 */
export const API_ROOT = `${API_BASE_URL}${API_PREFIX}`;

/**
 * Origin only — used by Socket.IO (it connects to the host, not a path).
 */
export const SOCKET_URL = API_BASE_URL;

if (typeof window !== 'undefined') {
  // One-shot debug log so a misconfigured deploy is one console line away
  // from a diagnosis ("why is the prod app calling localhost?").
  console.info('[config] API origin', { API_BASE_URL, API_ROOT });
}
