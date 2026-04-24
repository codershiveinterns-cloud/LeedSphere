import { Users, Hash, MessageSquare, Layers } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useAppStore from '../store/useAppStore';

const shellCls = 'flex-1 bg-[#f5f6f8] dark:bg-[#0d1117] flex items-center justify-center relative overflow-hidden transition-colors duration-200';
const glowCls = 'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-200/30 dark:bg-indigo-900/10 rounded-full blur-[100px] pointer-events-none';
const cardCls = 'z-10 flex flex-col items-center max-w-lg text-center p-8 bg-white/70 dark:bg-[#161b22]/50 backdrop-blur-xl border border-slate-200 dark:border-gray-800/80 rounded-3xl shadow-xl animate-fade-in';
const iconWrapCls = 'w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-500/20 dark:to-purple-500/20 rounded-3xl flex items-center justify-center mb-6 border border-indigo-200 dark:border-indigo-500/20 shadow-inner';
const iconCls = 'text-indigo-600 dark:text-indigo-400';
const titleCls = 'text-2xl font-bold text-slate-900 dark:text-white mb-3 tracking-tight';
const bodyCls = 'text-slate-600 dark:text-gray-400 text-sm mb-8 leading-relaxed';

const DashboardEmptyState = () => {
  const { workspaces, activeWorkspace, teams } = useAppStore();
  const navigate = useNavigate();

  if (workspaces.length === 0) {
    return (
      <div className={shellCls}>
        <div className={glowCls}></div>
        <div className={cardCls}>
          <div className={iconWrapCls}>
            <Layers size={40} className={iconCls} />
          </div>
          <h2 className={titleCls}>Welcome to Leedsphere</h2>
          <p className={bodyCls}>
            Create your first workspace to get started. A workspace is where your teams, channels, and projects live.
          </p>
          <p className="text-slate-500 dark:text-gray-500 text-xs">
            Click the <span className="text-emerald-600 dark:text-emerald-400 font-semibold">+</span> button in the left sidebar to create a workspace.
          </p>
        </div>
      </div>
    );
  }

  if (activeWorkspace && teams.length === 0) {
    return (
      <div className={shellCls}>
        <div className={glowCls}></div>
        <div className={cardCls}>
          <div className={iconWrapCls}>
            <Users size={40} className={iconCls} />
          </div>
          <h2 className={titleCls}>No Teams Yet</h2>
          <p className={bodyCls}>
            Your workspace <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{activeWorkspace.name}</span> is ready. Create a team to start collaborating with your colleagues.
          </p>
          <button
            onClick={() => navigate('/dashboard/teams')}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition-colors shadow-lg shadow-indigo-500/20 active:scale-95"
          >
            <Users size={18} /> Create Your First Team
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={shellCls}>
      <div className={glowCls}></div>
      <div className={cardCls}>
        <div className={iconWrapCls}>
          <Hash size={40} className={iconCls} />
        </div>
        <h2 className={titleCls}>Your Workspace is Ready</h2>
        <p className={bodyCls}>
          Select a team or channel from the sidebar to start collaborating.
        </p>
        <div className="grid grid-cols-2 gap-4 w-full">
          <button
            onClick={() => navigate('/dashboard/teams')}
            className="flex flex-col items-center justify-center gap-3 p-4 bg-slate-50 dark:bg-[#0d1117]/80 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 border border-slate-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-500/50 rounded-2xl transition-all group active:scale-95"
          >
            <Users size={24} className="text-slate-400 dark:text-gray-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
            <span className="text-sm font-medium text-slate-700 dark:text-gray-300 group-hover:text-slate-900 dark:group-hover:text-white">Teams</span>
          </button>
          <button
            onClick={() => navigate('/dashboard/projects')}
            className="flex flex-col items-center justify-center gap-3 p-4 bg-slate-50 dark:bg-[#0d1117]/80 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 border border-slate-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-500/50 rounded-2xl transition-all group active:scale-95"
          >
            <MessageSquare size={24} className="text-slate-400 dark:text-gray-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
            <span className="text-sm font-medium text-slate-700 dark:text-gray-300 group-hover:text-slate-900 dark:group-hover:text-white">Projects</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardEmptyState;
