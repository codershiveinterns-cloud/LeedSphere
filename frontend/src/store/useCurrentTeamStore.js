/**
 * Current-team context — the team (and the user's role in it) that all
 * protected API calls are scoped to. Persisted with Zustand's `persist`
 * middleware under localStorage key "team-storage" so the selection
 * survives a page refresh.
 *
 * On app boot we still re-verify the persisted team against MongoDB (see
 * `loadTeamFromStorage`) so the backend stays the source of truth for
 * membership and role. Never trust the cached role for privilege decisions
 * — the real check happens server-side via X-Team-Id / teamId header.
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import api from '../services/api';

const STORAGE_KEY = 'team-storage';
// Lightweight "remember last team" key that survives logout. Used to pick
// up where the user left off when they re-login on the same browser, even
// after currentTeam was cleared. NOT a security token — only a UX hint.
const LAST_ACTIVE_KEY = 'lastActiveTeamId';

const writeLastActive = (teamId) => {
  try { if (teamId) localStorage.setItem(LAST_ACTIVE_KEY, String(teamId)); } catch { /* noop */ }
};
const readLastActive = () => {
  try { return localStorage.getItem(LAST_ACTIVE_KEY) || null; } catch { return null; }
};

// Pick from a memberships list: prefer the lastActive id, else the first.
export const pickPreferredMembership = (memberships = []) => {
  if (!memberships.length) return null;
  const last = readLastActive();
  if (last) {
    const found = memberships.find((m) => String(m.teamId) === String(last));
    if (found) return found;
  }
  return memberships[0];
};

/**
 * One-time migration from the legacy `currentTeam` / `teamId` localStorage
 * keys (pre-persist-middleware). Runs once at module load so existing users
 * aren't logged out of their team on deploy.
 */
(function migrateLegacyKeys() {
  try {
    if (!localStorage.getItem(STORAGE_KEY)) {
      const legacy = localStorage.getItem('currentTeam');
      if (legacy) {
        const parsed = JSON.parse(legacy);
        if (parsed?.teamId && parsed?.role) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify({
            state: { currentTeam: parsed },
            version: 0,
          }));
        }
      }
    }
    localStorage.removeItem('currentTeam');
    localStorage.removeItem('teamId');
  } catch {
    // Storage unavailable or quota hit — no-op.
  }
})();

const useCurrentTeamStore = create(
  persist(
    (set, get) => ({
      /**
       * currentTeam: { teamId, role, name?, workspaceId?, designation? } | null
       * Only this field is persisted (see `partialize` below).
       */
      currentTeam: null,

      // `hydrated` = "we've settled whether currentTeam is valid against the
      // backend". Distinct from zustand's internal rehydration which
      // only restores the value from localStorage. The RequireTeam guard
      // blocks rendering until `hydrated` flips true.
      hydrated: false,
      hydrating: false,
      // `appDataLoaded` = "workspaces + teams have been fetched and the
      // active workspace/team are populated in useAppStore". We don't
      // render the dashboard until this is true (otherwise TeamDetails
      // can see an empty teams[] and flash 'Team not found').
      appDataLoaded: false,
      // Count of memberships surfaced from /teams/my during hydration.
      // Distinguishes "zero teams = onboard" from "many = needs picker".
      membershipCount: null,

      // "Is it safe to render the dashboard?" True when hydration has
      // settled AND either we have a valid team whose data is loaded, OR
      // the user has no teams at all (zero-team onboarding path).
      // Use as: useCurrentTeamStore((s) => s.isAppReady())
      isAppReady: () => {
        const s = get();
        if (!s.hydrated) return false;
        if (s.currentTeam) return s.appDataLoaded;
        return s.membershipCount === 0;
      },

      setCurrentTeam: (membership) => {
        if (!membership) return;
        const compact = {
          teamId: String(membership.teamId || membership.team?._id),
          role: membership.role,
          name: membership.name || membership.team?.name || '',
          workspaceId: String(
            membership.workspaceId ||
            membership.team?.workspaceId ||
            membership.team?.workspace?._id ||
            ''
          ) || null,
          designation: membership.designation || '',
        };
        // Remember "last active" outside of the persist blob so it survives
        // logout and lets the next login auto-pick the same team.
        writeLastActive(compact.teamId);
        set({ currentTeam: compact, hydrated: true });
      },

      // Hard reset for cross-user transitions (login/logout). Wipes
      // currentTeam AND the bootstrap flags so the next user re-runs the
      // full hydration → verify → bootstrap flow from scratch.
      clear: () => set({
        currentTeam: null,
        hydrated: false,
        hydrating: false,
        appDataLoaded: false,
        membershipCount: null,
      }),

      // Setter used after RequireTeam finishes bootstrapping workspaces/teams.
      markAppDataLoaded: () => set({ appDataLoaded: true }),

      /**
       * Verify the persisted team on app boot against MongoDB.
       *   1. If we have a cached teamId, call GET /teams/:teamId/me.
       *      - 2xx  → refresh the role from the server (source of truth).
       *      - 403  → membership revoked; drop cache and fall through.
       *      - 404  → team deleted; drop cache and fall through.
       *      - 5xx / network → keep the optimistic cache so the app stays
       *        usable offline, just flip `hydrated`.
       *   2. Fall back to GET /teams/my:
       *      - 1 membership → auto-select.
       *      - 0 or many → leave currentTeam null; route guard handles it.
       */
      loadTeamFromStorage: async () => {
        if (get().hydrating || get().hydrated) return;
        set({ hydrating: true });

        const cachedId = get().currentTeam?.teamId || null;

        if (cachedId) {
          try {
            const res = await api.get(`/teams/${cachedId}/me`);
            const { team, role, designation } = res.data || {};
            if (team && role) {
              get().setCurrentTeam({
                teamId: team._id,
                role,
                name: team.name,
                workspaceId: team.workspaceId,
                designation,
              });
              set({ hydrating: false });
              return;
            }
            set({ currentTeam: null });
          } catch (err) {
            const status = err?.response?.status;
            if (status === 403 || status === 404) {
              set({ currentTeam: null });
            } else {
              // Network / 5xx: keep in-memory state; unblock UI.
              set({ hydrated: true, hydrating: false });
              return;
            }
          }
        }

        // Either no cache, or the cached team was invalidated above. Ask the
        // server which teams the user belongs to and auto-pick. With this
        // behavior the user never has to see a "Choose Team" screen on
        // refresh — preferring the lastActive id and falling back to the
        // first membership.
        try {
          const res = await api.get('/teams/my');
          const memberships = res.data?.memberships || [];
          if (memberships.length === 0) {
            set({
              currentTeam: null,
              membershipCount: 0,
              hydrated: true,
              hydrating: false,
            });
            return;
          }
          const pick = pickPreferredMembership(memberships);
          get().setCurrentTeam(pick);
          set({ membershipCount: memberships.length, hydrating: false });
        } catch {
          set({ hydrated: true, hydrating: false });
        }
      },

      // Role helpers — null when no currentTeam so UI defaults to least-privileged.
      getRole: () => get().currentTeam?.role || null,
      isAdmin: () => get().currentTeam?.role === 'admin',
      isManager: () => get().currentTeam?.role === 'manager',
      canManage: () => ['admin', 'manager'].includes(get().currentTeam?.role),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      // Persist only the currentTeam slice. Everything else (hydrated,
      // hydrating, membershipCount) is runtime-only; otherwise we'd
      // restore a stale hydrated=true after refresh and skip verification.
      partialize: (state) => ({ currentTeam: state.currentTeam }),
      version: 1,
    }
  )
);

export default useCurrentTeamStore;
