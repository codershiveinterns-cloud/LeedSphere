import { useEffect, useRef } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';
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
  const { user } = useAuthStore();
  const {
    currentTeam, hydrated, membershipCount, appDataLoaded,
    loadTeamFromStorage, markAppDataLoaded,
  } = useCurrentTeamStore();
  const location = useLocation();

  // Kick off team verification once.
  useEffect(() => {
    if (user) loadTeamFromStorage();
  }, [user, loadTeamFromStorage]);

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

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Still verifying the team (Step 2).
  if (!hydrated) {
    return <BootSpinner label="Loading your team…" />;
  }

  // Zero-team users go through for onboarding via DashboardEmptyState.
  if (!currentTeam && membershipCount === 0) {
    return <Outlet />;
  }

  // Has memberships but none picked is now a transient state — the team
  // store auto-selects (last active OR first) inside loadTeamFromStorage.
  // If we still land here it means the auto-pick failed for some reason,
  // so fall back to the picker rather than render a broken dashboard.
  if (!currentTeam) {
    return <Navigate to="/teams/select" replace />;
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

export default RequireTeam;
