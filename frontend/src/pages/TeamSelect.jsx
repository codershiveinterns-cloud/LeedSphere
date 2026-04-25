import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Crown, ShieldCheck, Shield, ArrowRight, LogOut, Loader2 } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import useCurrentTeamStore from '../store/useCurrentTeamStore';
import toast from 'react-hot-toast';

const roleMeta = {
  admin:   { label: 'Admin',   icon: Crown,        cls: 'text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-300 dark:bg-amber-500/10 dark:border-amber-500/30' },
  manager: { label: 'Manager', icon: ShieldCheck,  cls: 'text-indigo-700 bg-indigo-50 border-indigo-200 dark:text-indigo-300 dark:bg-indigo-500/10 dark:border-indigo-500/30' },
  member:  { label: 'Member',  icon: Shield,       cls: 'text-slate-700 bg-slate-100 border-slate-200 dark:text-gray-300 dark:bg-gray-700/40 dark:border-gray-700' },
};

/**
 * Landing screen when a user belongs to multiple teams. Also accessible as a
 * "switch team" route for single- or multi-team users alike.
 */
const TeamSelect = () => {
  const navigate = useNavigate();
  const { user, fetchMyTeams, logout } = useAuthStore();
  const { setCurrentTeam, currentTeam } = useCurrentTeamStore();

  const [loading, setLoading] = useState(true);
  const [memberships, setMemberships] = useState([]);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    (async () => {
      try {
        const list = await fetchMyTeams();
        setMemberships(list);
      } catch {
        toast.error('Failed to load your teams');
      } finally {
        setLoading(false);
      }
    })();
  }, [user, fetchMyTeams, navigate]);

  const handlePick = (membership) => {
    setCurrentTeam(membership);
    navigate('/dashboard');
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#f5f6f8] dark:bg-[#0d1117] flex items-center justify-center p-4 transition-colors duration-200">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full bg-indigo-200/40 dark:bg-indigo-900/20 blur-[120px]" />
      </div>

      <div className="relative w-full max-w-lg bg-white dark:bg-[#161b22] border border-slate-200 dark:border-gray-800 rounded-2xl shadow-2xl p-8 animate-scale-in">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 mb-3">
            <Users size={22} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Choose a team</h1>
          <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
            You belong to {loading ? '…' : memberships.length} team{memberships.length === 1 ? '' : 's'}. Pick one to continue.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-10 text-slate-400 dark:text-gray-500">
            <Loader2 size={18} className="animate-spin" />
          </div>
        ) : memberships.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-sm text-slate-600 dark:text-gray-400 mb-4">You aren't a member of any team yet.</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium shadow-sm transition-colors active:scale-95"
            >
              Set up a workspace <ArrowRight size={14} />
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {memberships.map((m) => {
              const meta = roleMeta[m.role] || roleMeta.member;
              const Icon = meta.icon;
              const isSelected = currentTeam?.teamId === String(m.teamId);
              return (
                <button
                  key={m.teamId}
                  onClick={() => handlePick(m)}
                  className={`group flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10'
                      : 'border-slate-200 dark:border-gray-700 hover:border-slate-300 dark:hover:border-gray-600 hover:bg-slate-50 dark:hover:bg-[#0d1117]/60'
                  } active:scale-[0.99]`}
                >
                  <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-gray-800 flex items-center justify-center text-slate-700 dark:text-gray-300 font-semibold shrink-0">
                    {m.team?.name?.charAt(0).toUpperCase() || 'T'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                      {m.team?.name || 'Team'}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-gray-500 truncate">
                      {m.team?.workspace?.name ? `in ${m.team.workspace.name}` : 'Workspace'}
                      {m.designation ? ` · ${m.designation}` : ''}
                    </p>
                  </div>
                  <span className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border ${meta.cls}`}>
                    <Icon size={10} /> {meta.label}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        <div className="mt-8 pt-5 border-t border-slate-200 dark:border-gray-800 flex items-center justify-between text-xs text-slate-500 dark:text-gray-500">
          <span>Signed in as <span className="font-medium text-slate-800 dark:text-gray-200">{user.name}</span></span>
          <button
            onClick={() => { logout(); navigate('/login'); }}
            className="inline-flex items-center gap-1 hover:text-red-500 dark:hover:text-red-400 transition-colors"
          >
            <LogOut size={12} /> Sign out
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeamSelect;
