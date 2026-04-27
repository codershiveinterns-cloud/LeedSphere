import { useEffect, useState, useRef } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import useFirebaseAuthStore from '../store/useFirebaseAuthStore';
import useAppStore from '../store/useAppStore';
import useCurrentTeamStore from '../store/useCurrentTeamStore';
import useSearchStore from '../store/useSearchStore';
import Sidebar from '../components/Sidebar';
import InnerSidebar from '../components/InnerSidebar';
import Header from '../components/common/Header';
import RightPanel from '../components/RightPanel';
import SearchModal from '../components/common/SearchModal';
import CallRoom from '../components/Call/CallRoom';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import { Mail, Check, X } from 'lucide-react';

const InviteBanner = () => {
  // Select fields/actions one at a time. Zustand actions are stable refs,
  // but `useStore()` (no selector) returns a new object every render, which
  // re-renders this banner on every unrelated store mutation. Selectors
  // also keep the useEffect dep array stable.
  const pendingInvites = useAppStore((s) => s.pendingInvites);
  const fetchPendingInvites = useAppStore((s) => s.fetchPendingInvites);
  const acceptInvite = useAppStore((s) => s.acceptInvite);
  const declineInvite = useAppStore((s) => s.declineInvite);
  const [processing, setProcessing] = useState(null);

  // Mount-only fetch. Empty dep array on purpose — fetchPendingInvites is
  // a stable zustand action ref, but listing it adds noise without changing
  // behaviour, and any future store-replacement would silently retrigger.
  useEffect(() => {
    console.debug('[InviteBanner] effect: fetching pending invites (once)');
    fetchPendingInvites();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!pendingInvites || pendingInvites.length === 0) return null;

  const handleAccept = async (id) => {
    setProcessing(id);
    try {
      await acceptInvite(id);
      toast.success('Invite accepted! You joined the team.');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to accept');
    } finally {
      setProcessing(null);
    }
  };

  const handleDecline = async (id) => {
    setProcessing(id);
    try {
      await declineInvite(id);
      toast.success('Invite declined');
    } catch {
      toast.error('Failed to decline');
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="bg-indigo-50 dark:bg-indigo-600/10 border-b border-indigo-200 dark:border-indigo-500/20 px-6 py-3 shrink-0 transition-colors duration-200">
      <div className="flex items-center gap-3 mb-2">
        <Mail size={16} className="text-indigo-600 dark:text-indigo-400" />
        <p className="text-sm font-medium text-indigo-700 dark:text-indigo-300">You have {pendingInvites.length} pending invite{pendingInvites.length > 1 ? 's' : ''}</p>
      </div>
      <div className="flex flex-col gap-2">
        {pendingInvites.map(inv => (
          <div key={inv._id} className="flex items-center justify-between bg-white dark:bg-[#161b22] rounded-lg px-4 py-2.5 border border-slate-200 dark:border-gray-800 transition-colors duration-200">
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-900 dark:text-white font-medium truncate">
                Join <span className="text-indigo-600 dark:text-indigo-400">{inv.teamId?.name || 'team'}</span>
                {inv.designation && <span className="text-slate-500 dark:text-gray-500"> as {inv.designation}</span>}
              </p>
              <p className="text-xs text-slate-500 dark:text-gray-500">
                Invited by {inv.invitedBy?.name || 'someone'} &middot; Role: <span className="text-slate-600 dark:text-gray-400 capitalize">{inv.role}</span>
              </p>
            </div>
            <div className="flex items-center gap-2 ml-4">
              <button onClick={() => handleAccept(inv._id)} disabled={processing === inv._id}
                className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1 rounded-md text-xs font-medium disabled:opacity-50 shadow-sm transition-colors active:scale-95">
                <Check size={12} /> Accept
              </button>
              <button onClick={() => handleDecline(inv._id)} disabled={processing === inv._id}
                className="flex items-center gap-1 bg-slate-200 hover:bg-slate-300 text-slate-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300 px-3 py-1 rounded-md text-xs font-medium disabled:opacity-50 transition-colors active:scale-95">
                <X size={12} /> Decline
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const Dashboard = () => {
  // Use the Firebase user — the legacy JWT useAuthStore was returning null
  // post-migration, which caused this effect to navigate('/login') while
  // /login navigated back to /dashboard, producing the update-depth loop.
  // RequireFirebaseAuth is also above this route so by the time Dashboard
  // mounts, currentUser is guaranteed non-null and verified — the !user
  // navigate below is now defense-in-depth, not the primary gate.
  const user = useFirebaseAuthStore((s) => s.currentUser);
  const navigate = useNavigate();
  const currentTeam = useCurrentTeamStore((s) => s.currentTeam);
  // Derived, per-team role. Defaults to the least-privileged 'member' when
  // the user has no active team context — we never assume admin.
  const myRole = currentTeam?.role || 'member';
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(false);
  const hasFetched = useRef(false);

  console.debug('[Dashboard] render', { hasUser: Boolean(user), uid: user?.uid });

  // One-time bootstrap. `hasFetched` ref makes this idempotent against
  // React 18 StrictMode's double-mount. We deliberately read user.uid (a
  // primitive) for the dep so the effect doesn't refire when Firebase hands
  // us a new User object reference for the same identity (token refresh).
  const uid = user?.uid;
  useEffect(() => {
    console.debug('[Dashboard] bootstrap effect run', { uid });
    if (!uid) {
      // Should never happen because RequireFirebaseAuth gates this route,
      // but kick to /login if it does instead of rendering broken UI.
      navigate('/login', { replace: true });
      return;
    }
    if (hasFetched.current) return;
    hasFetched.current = true;

    // Workspaces + teams are loaded by RequireTeam's bootstrapAppData().
    // Zero-team users (onboarding path) still need them, so fetch defensively
    // — it's a no-op when already populated.
    if (!useAppStore.getState().workspaces.length) {
      useAppStore.getState().fetchWorkspaces();
    }
    useAppStore.getState().fetchNotifications();
  }, [uid, navigate]);

  // Global Ctrl/Cmd+K to open search
  useEffect(() => {
    const onKey = (e) => {
      const k = e.key?.toLowerCase();
      if ((e.metaKey || e.ctrlKey) && k === 'k') {
        e.preventDefault();
        useSearchStore.getState().open();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (!user) return null;

  return (
    <div className="h-screen w-full bg-[#f5f6f8] dark:bg-[#0d1117] flex flex-col font-sans transition-colors duration-200">
      <Header />
      <InviteBanner />

      <main className="flex-1 flex overflow-hidden relative">
        <Sidebar />
        <InnerSidebar />
        {/*
         * Keep `simulatedRole` in the outlet context for legacy pages that still
         * read it, but bind it to the real per-team role (never "admin" by default).
         * Values: 'admin' | 'manager' | 'member'.
         */}
        <Outlet context={{
          myRole,
          simulatedRole: myRole.charAt(0).toUpperCase() + myRole.slice(1),
          toggleRightPanel: (forceOpen) => setIsRightPanelOpen(typeof forceOpen === 'boolean' ? forceOpen : p => !p),
        }} />
        <RightPanel isOpen={isRightPanelOpen} onClose={() => setIsRightPanelOpen(false)} />
      </main>

      <SearchModal />
      <CallRoom />
      <Toaster position="top-right" />
    </div>
  );
};

export default Dashboard;
