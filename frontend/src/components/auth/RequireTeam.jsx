import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, Outlet } from 'react-router-dom';
import { Loader2, Users } from 'lucide-react';
import useFirebaseAuthStore from '../../store/useFirebaseAuthStore';
import useCurrentTeamStore from '../../store/useCurrentTeamStore';
import useAppStore from '../../store/useAppStore';

/**
 * Guard that sits above /dashboard routes and makes refresh deterministic.
 *
 * Sequence on first mount after refresh:
 *   1. If the user isn't signed in → /login.
 *   2. loadTeamFromStorage() — verifies the persisted teamId against Mongo
 *      (GET /teams/:teamId/me). Revoked/stale teams get cleared; if there's
 *      exactly one remaining membership it's auto-selected.
 *   3. bootstrapAppData(currentTeam) — loads workspaces + teams and makes
 *      the matching workspace/team "active" in useAppStore. This is what
 *      makes `/dashboard/team/:id` resolve correctly after a refresh.
 *   4. Flip `appDataLoaded` — `isAppReady()` now returns true.
 *   5. Render. Zero-team users pass through for onboarding; multi-team
 *      users without a pick land on /teams/select.
 */
const RequireTeam = () => {
  // Select primitives individually. Object-destructure on a zustand store
  // (`const { a, b } = useStore()`) returns a fresh object every render, so
  // any function ref pulled out becomes an unstable useEffect dependency
  // and the effect refires forever — "Maximum update depth exceeded".
  //
  // Use the Firebase user — it's the single source of truth post-migration.
  // Reading the legacy JWT `useAuthStore.user` (which is null after Firebase
  // login) was bouncing /dashboard ↔ /login in a navigation loop.
  const user = useFirebaseAuthStore((s) => s.currentUser);
  const currentTeam = useCurrentTeamStore((s) => s.currentTeam);
  const hydrated = useCurrentTeamStore((s) => s.hydrated);
  const membershipCount = useCurrentTeamStore((s) => s.membershipCount);
  const appDataLoaded = useCurrentTeamStore((s) => s.appDataLoaded);
  const loadTeamFromStorage = useCurrentTeamStore((s) => s.loadTeamFromStorage);
  const markAppDataLoaded = useCurrentTeamStore((s) => s.markAppDataLoaded);

  // Hard-stop the spinner if hydration takes longer than 8s. Stuck spinners
  // happen when the API hangs or the user logs out mid-hydration — both of
  // which produce "infinite Loading your team…". Better to show a real
  // empty-state with a retry than to wedge the dashboard.
  const [hydrationTimedOut, setHydrationTimedOut] = useState(false);
  useEffect(() => {
    if (hydrated) { setHydrationTimedOut(false); return; }
    const id = setTimeout(() => setHydrationTimedOut(true), 8000);
    return () => clearTimeout(id);
  }, [hydrated]);

  // Kick off team verification once. Re-runs only when the Firebase uid
  // changes (login/logout), not on every render.
  const uid = user?.uid;
  useEffect(() => {
    if (uid) loadTeamFromStorage();
  }, [uid, loadTeamFromStorage]);

  // After verification succeeds, bootstrap workspace + team data. Guarded
  // against duplicate runs with a ref (React 18 double-invocation under
  // StrictMode).
  const bootstrapRef = useRef(false);
  useEffect(() => {
    if (!hydrated || !currentTeam?.teamId || bootstrapRef.current) return;
    bootstrapRef.current = true;
    (async () => {
      try {
        await useAppStore.getState().bootstrapAppData(currentTeam);
      } catch {
        // Non-fatal; pages have their own empty-state guards. Still mark
        // ready so the UI unblocks — a failed bootstrap is better than a
        // permanent spinner.
      } finally {
        markAppDataLoaded();
      }
    })();
  }, [hydrated, currentTeam, markAppDataLoaded]);

  // No `if (!user) <Navigate to="/login">` here on purpose — RequireFirebaseAuth
  // is the parent route element and has already guaranteed currentUser exists
  // and is email-verified. Re-checking here just creates redirect ping-pong
  // when the two stores disagree.

  // Still verifying the team (Step 2). If we've been stuck > 8s, show the
  // empty-state instead so the user is never trapped on a spinner.
  if (!hydrated) {
    if (hydrationTimedOut) return <NoTeamFound />;
    return <BootSpinner label="Loading your team…" />;
  }

  // Zero-team users go through for onboarding via DashboardEmptyState.
  if (!currentTeam && membershipCount === 0) {
    return <Outlet />;
  }

  // Hydrated but no team and no membershipCount info → API failed or returned
  // ambiguous data. Show "No team found" instead of bouncing to /teams/select
  // (which would just show a blank picker) per the spec's fallback rule.
  if (!currentTeam) {
    return <NoTeamFound />;
  }

  // Team verified; still loading workspace/teams data (Step 3).
  if (!appDataLoaded) {
    return <BootSpinner label={`Loading ${currentTeam.name || 'team'}…`} />;
  }

  return <Outlet />;
};

const BootSpinner = ({ label }) => (
  <div className="min-h-screen bg-[#f5f6f8] dark:bg-[#0d1117] flex items-center justify-center transition-colors duration-200">
    <div className="flex flex-col items-center gap-3 text-slate-500 dark:text-gray-400">
      <Loader2 size={22} className="animate-spin" />
      <p className="text-sm">{label}</p>
    </div>
  </div>
);

/**
 * Terminal fallback when team hydration fails / times out. Avoids the
 * "infinite Loading your team…" trap — gives the user actionable buttons
 * instead of a perma-spinner.
 */
const NoTeamFound = () => (
  <div className="min-h-screen bg-[#f5f6f8] dark:bg-[#0d1117] flex items-center justify-center p-4 transition-colors duration-200">
    <div className="w-full max-w-md bg-white dark:bg-[#161b22] border border-slate-200 dark:border-gray-800 rounded-2xl shadow-2xl p-8 text-center">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-slate-100 dark:bg-gray-800 text-slate-500 dark:text-gray-400 mb-4">
        <Users size={22} />
      </div>
      <h1 className="text-xl font-bold text-slate-900 dark:text-white">No team found</h1>
      <p className="text-sm text-slate-500 dark:text-gray-400 mt-2">
        We couldn't load your team. This usually means you don't belong to one yet,
        or the server didn't respond in time.
      </p>
      <div className="flex justify-center gap-2 mt-6">
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-gray-300 bg-slate-100 dark:bg-gray-800 hover:bg-slate-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          Retry
        </button>
        <Link
          to="/teams/select"
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors"
        >
          Pick / create a team
        </Link>
      </div>
    </div>
  </div>
);

export default RequireTeam;
