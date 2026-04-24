import { useEffect, useState, useRef } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import useAppStore from '../store/useAppStore';
import useSearchStore from '../store/useSearchStore';
import Sidebar from '../components/Sidebar';
import InnerSidebar from '../components/InnerSidebar';
import Header from '../components/common/Header';
import RightPanel from '../components/RightPanel';
import SearchModal from '../components/common/SearchModal';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import { Mail, Check, X } from 'lucide-react';

const InviteBanner = () => {
  const { pendingInvites, fetchPendingInvites, acceptInvite, declineInvite } = useAppStore();
  const [processing, setProcessing] = useState(null);

  useEffect(() => {
    fetchPendingInvites();
  }, [fetchPendingInvites]);

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
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [simulatedRole, setSimulatedRole] = useState('Admin');
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(false);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!hasFetched.current) {
      hasFetched.current = true;
      useAppStore.getState().fetchWorkspaces();
      useAppStore.getState().fetchNotifications();
    }
  }, [user, navigate]);

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
      <Header simulatedRole={simulatedRole} setSimulatedRole={setSimulatedRole} />
      <InviteBanner />

      <main className="flex-1 flex overflow-hidden relative">
        <Sidebar simulatedRole={simulatedRole} />
        <InnerSidebar />
        <Outlet context={{ simulatedRole, toggleRightPanel: (forceOpen) => setIsRightPanelOpen(typeof forceOpen === 'boolean' ? forceOpen : p => !p) }} />
        <RightPanel isOpen={isRightPanelOpen} onClose={() => setIsRightPanelOpen(false)} />
      </main>

      <SearchModal />
      <Toaster position="top-right" />
    </div>
  );
};

export default Dashboard;
