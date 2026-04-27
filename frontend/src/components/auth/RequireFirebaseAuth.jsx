import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import useFirebaseAuthStore from '../../store/useFirebaseAuthStore';

/**
 * Route guard for protected pages.
 *
 *   not signed in        → /login
 *   signed in, unverified → /verify-email
 *   signed in, verified  → render children
 *
 * Uses `ready` so we don't flash the login screen on every refresh while
 * onAuthStateChanged is rehydrating the cached session.
 */
const RequireFirebaseAuth = () => {
  // Select primitives individually — `useFirebaseAuthStore()` without a
  // selector returns a fresh object every render, which makes zustand
  // re-render the guard endlessly and triggers "Maximum update depth
  // exceeded" via the <Navigate> branches below.
  const currentUser = useFirebaseAuthStore((s) => s.currentUser);
  const ready = useFirebaseAuthStore((s) => s.ready);
  const location = useLocation();

  if (!ready) {
    return (
      <div className="min-h-screen bg-[#f5f6f8] dark:bg-[#0d1117] flex items-center justify-center transition-colors duration-200">
        <div className="flex flex-col items-center gap-3 text-slate-500 dark:text-gray-400">
          <Loader2 size={22} className="animate-spin" />
          <p className="text-sm">Checking session…</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  if (!currentUser.emailVerified) {
    return <Navigate to="/verify-email" replace />;
  }
  return <Outlet />;
};

export default RequireFirebaseAuth;
