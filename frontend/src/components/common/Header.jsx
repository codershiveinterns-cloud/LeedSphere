import { LogOut, Search, Bell, Plus, Users, Hash, FileText, MessageSquare, CheckSquare, Sun, Moon } from 'lucide-react';
import { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';
import useAppStore from '../../store/useAppStore';
import useThemeStore from '../../store/useThemeStore';
import useSearchStore from '../../store/useSearchStore';
import Modal from './Modal';
import CreateChannelForm from '../channel/CreateChannelForm';
import toast from 'react-hot-toast';

const Header = ({ simulatedRole, setSimulatedRole }) => {
  const { user, logout } = useAuthStore();
  const {
    activeWorkspace, uiStates, setUiState,
    notifications, markNotificationRead, markAllNotificationsRead, getUnreadCount,
    teams, createTeam, setActiveTeam,
  } = useAppStore();
  const { theme, toggleTheme } = useThemeStore();
  const openSearch = useSearchStore((s) => s.open);
  const navigate = useNavigate();

  const [activeNotifTab, setActiveNotifTab] = useState('All');
  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);
  const [showCreateChannelModal, setShowCreateChannelModal] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');

  const plusRef = useRef(null);
  const notifRef = useRef(null);

  const unreadCount = getUnreadCount();

  // Platform-aware shortcut label: ⌘K on macOS, Ctrl K elsewhere.
  const shortcutLabel = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘K' : 'Ctrl K';

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (plusRef.current && !plusRef.current.contains(e.target)) setUiState('isGlobalPlusOpen', false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setUiState('isNotificationsOpen', false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [setUiState]);

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    if (!newTeamName.trim() || !activeWorkspace) return;
    try {
      const team = await createTeam(activeWorkspace._id, newTeamName);
      setActiveTeam(team);
      setNewTeamName('');
      setShowCreateTeamModal(false);
      setUiState('isGlobalPlusOpen', false);
      toast.success(`Team "${newTeamName}" created`);
      navigate(`/dashboard/team/${team._id}`);
    } catch {
      toast.error('Failed to create team');
    }
  };

  // Pre-compute relative time labels — avoids calling Date.now() during per-row render.
  const notifRelative = useMemo(() => {
    // eslint-disable-next-line react-hooks/purity -- Date.now is intentional; useMemo bounds recomputation to notifications changes.
    const now = Date.now();
    const rel = (diff) => {
      if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
      if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
      return `${Math.floor(diff / 86400000)}d ago`;
    };
    const out = {};
    (notifications || []).forEach(n => {
      if (n?._id && n.createdAt) {
        out[n._id] = rel(now - new Date(n.createdAt).getTime());
      }
    });
    return out;
  }, [notifications]);

  const filteredNotifs = activeNotifTab === 'All'
    ? notifications
    : activeNotifTab === 'Mentions'
      ? notifications.filter(n => n.type === 'mention')
      : notifications.filter(n => n.type === 'task');

  return (
    <>
      <header className="h-14 bg-white dark:bg-[#161b22] border-b border-slate-200 dark:border-gray-800 flex items-center justify-between px-6 shrink-0 shadow-sm z-20 transition-colors duration-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-md shadow-indigo-500/20">L</div>
          <span className="font-bold text-xl text-slate-900 dark:text-white tracking-tight hidden sm:block">Leedsphere</span>
          <span className="mx-4 text-slate-300 dark:text-gray-700 hidden sm:block">|</span>
          <span className="text-sm font-medium text-slate-500 dark:text-gray-400">Role:</span>
          <select value={simulatedRole} onChange={e => setSimulatedRole(e.target.value)}
            className="ml-1 bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-gray-700 rounded-md text-sm text-indigo-600 dark:text-indigo-400 px-2 py-1 outline-none font-semibold cursor-pointer max-w-[100px] truncate">
            <option value="Admin">Admin</option>
            <option value="Manager">Manager</option>
            <option value="Member">Member</option>
          </select>
        </div>

        {/* Global search trigger — opens Ctrl/Cmd+K modal */}
        <div className="flex-1 max-w-lg mx-8 hidden md:block">
          <button
            type="button"
            onClick={openSearch}
            className="w-full group flex items-center gap-2 bg-slate-50 dark:bg-[#0d1117]/80 hover:bg-white dark:hover:bg-[#0d1117] border border-slate-200 dark:border-gray-700 hover:border-slate-300 dark:hover:border-gray-600 rounded-lg pl-3 pr-2 py-1.5 text-sm text-slate-500 dark:text-gray-500 transition-all"
          >
            <Search size={16} className="text-slate-400 dark:text-gray-500 group-hover:text-slate-600 dark:group-hover:text-gray-400 transition-colors" />
            <span className="flex-1 text-left truncate">Search teams, channels, messages, notes...</span>
            <kbd className="hidden lg:inline-flex items-center text-[11px] font-semibold text-slate-500 dark:text-gray-400 bg-white dark:bg-[#161b22] border border-slate-200 dark:border-gray-700 rounded px-1.5 py-0.5 shadow-sm">
              {shortcutLabel}
            </kbd>
          </button>
        </div>

        <div className="flex items-center gap-4">
          {/* Create Button */}
          <div className="relative" ref={plusRef}>
            <button onClick={() => setUiState('isGlobalPlusOpen', !uiStates.isGlobalPlusOpen)} className="w-8 h-8 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center transition-colors shadow-sm shadow-indigo-500/20"><Plus size={18} /></button>
            {uiStates.isGlobalPlusOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#1c212b] border border-slate-200 dark:border-gray-700 shadow-2xl rounded-xl overflow-hidden z-50 animate-scale-in">
                <div className="p-2 text-xs font-semibold text-slate-500 dark:text-gray-500 uppercase">Create New</div>
                <div className="flex flex-col p-1">
                  <button onClick={() => { setShowCreateTeamModal(true); setUiState('isGlobalPlusOpen', false); }} className="flex items-center gap-3 w-full p-2 hover:bg-indigo-50 dark:hover:bg-indigo-600/10 hover:text-indigo-600 dark:hover:text-indigo-400 text-slate-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors"><Users size={16} /> Team</button>
                  <button onClick={() => { setShowCreateChannelModal(true); setUiState('isGlobalPlusOpen', false); }} className="flex items-center gap-3 w-full p-2 hover:bg-indigo-50 dark:hover:bg-indigo-600/10 hover:text-indigo-600 dark:hover:text-indigo-400 text-slate-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors"><Hash size={16} /> Channel</button>
                  <button onClick={() => { navigate('/dashboard/notes/new'); setUiState('isGlobalPlusOpen', false); }} className="flex items-center gap-3 w-full p-2 hover:bg-indigo-50 dark:hover:bg-indigo-600/10 hover:text-indigo-600 dark:hover:text-indigo-400 text-slate-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors"><FileText size={16} /> Note/Doc</button>
                </div>
              </div>
            )}
          </div>

          {/* Theme toggle */}
          <div className="relative group">
            <button
              onClick={toggleTheme}
              aria-label="Switch theme"
              className="relative w-8 h-8 rounded-full flex items-center justify-center text-slate-500 dark:text-gray-400 hover:text-amber-500 dark:hover:text-indigo-300 hover:bg-slate-100 dark:hover:bg-gray-800/80 hover:shadow-[0_0_0_3px_rgba(99,102,241,0.12)] dark:hover:shadow-[0_0_16px_rgba(129,140,248,0.25)] transition-all duration-200 active:scale-90"
            >
              <Sun
                size={17}
                className={`absolute transition-all duration-300 ${theme === 'dark' ? 'opacity-0 rotate-90 scale-75' : 'opacity-100 rotate-0 scale-100'}`}
              />
              <Moon
                size={17}
                className={`absolute transition-all duration-300 ${theme === 'dark' ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-75'}`}
              />
            </button>
            <span className="pointer-events-none absolute top-full left-1/2 -translate-x-1/2 mt-2 whitespace-nowrap rounded-md bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-[11px] font-medium px-2 py-1 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50">
              Switch theme
            </span>
          </div>

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button onClick={() => setUiState('isNotificationsOpen', !uiStates.isNotificationsOpen)} className="text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-gray-200 transition-colors relative p-1 active:scale-90">
              <Bell size={18} />
              {unreadCount > 0 && <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-red-500 rounded-full ring-2 ring-white dark:ring-[#161b22] flex items-center justify-center text-[10px] font-bold text-white px-1">{unreadCount}</span>}
            </button>
            {uiStates.isNotificationsOpen && (
              <div className="absolute right-0 mt-2 w-[340px] bg-white dark:bg-[#161b22] border border-slate-200 dark:border-gray-700 shadow-2xl rounded-xl overflow-hidden z-50 flex flex-col max-h-[400px] animate-scale-in">
                <div className="flex border-b border-slate-200 dark:border-gray-800 shrink-0">
                  {['All', 'Mentions', 'Tasks'].map(tab => (
                    <button key={tab} onClick={(e) => { e.stopPropagation(); setActiveNotifTab(tab); }}
                      className={`flex-1 py-3 text-sm font-medium transition-colors ${activeNotifTab === tab ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-500' : 'text-slate-500 dark:text-gray-500 hover:text-slate-800 dark:hover:text-gray-300'}`}>{tab}</button>
                  ))}
                </div>
                <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
                  {filteredNotifs.length === 0 ? (
                    <div className="py-8 text-center"><Bell size={24} className="text-slate-300 dark:text-gray-700 mx-auto mb-2" /><p className="text-slate-500 dark:text-gray-500 text-sm">No notifications</p></div>
                  ) : filteredNotifs.map(notif => (
                    <button key={notif._id} onClick={() => markNotificationRead(notif._id)}
                      className={`flex gap-3 p-3 rounded-lg cursor-pointer text-left w-full transition-colors ${notif.read ? 'hover:bg-slate-100 dark:hover:bg-[#1c212b]' : 'bg-indigo-50 dark:bg-indigo-500/5 hover:bg-indigo-100 dark:hover:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/10'}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs mt-0.5 shrink-0 ${notif.type === 'mention' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400' : notif.type === 'task' ? 'bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400' : 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400'}`}>
                        {notif.type === 'mention' ? <MessageSquare size={14} /> : notif.type === 'task' ? <CheckSquare size={14} /> : <Users size={14} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${notif.read ? 'text-slate-500 dark:text-gray-400' : 'text-slate-800 dark:text-gray-200'}`}>{notif.content}</p>
                        <span className="text-xs text-slate-400 dark:text-gray-500">{notifRelative[notif._id] || ''}</span>
                      </div>
                      {!notif.read && <span className="w-2 h-2 bg-indigo-500 rounded-full mt-2 shrink-0"></span>}
                    </button>
                  ))}
                </div>
                <div className="p-2 border-t border-slate-200 dark:border-gray-800 shrink-0 text-center">
                  <button onClick={markAllNotificationsRead} className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300">Mark all as read</button>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 pl-4 border-l border-slate-200 dark:border-gray-800">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white shadow-sm ring-2 ring-white dark:ring-[#0d1117]">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm font-medium text-slate-700 dark:text-gray-200 hidden md:block">{user?.name}</span>
          </div>
          <button onClick={logout} className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors ml-2 active:scale-90"><LogOut size={16} /></button>
        </div>
      </header>

      <Modal isOpen={showCreateTeamModal} onClose={() => setShowCreateTeamModal(false)} title="Create Team">
        <form onSubmit={handleCreateTeam} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Team Name</label>
            <input type="text" autoFocus value={newTeamName} onChange={e => setNewTeamName(e.target.value)}
              className="w-full bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-gray-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none placeholder-slate-400 dark:placeholder-gray-600 transition-colors" placeholder="e.g. Engineering" />
          </div>
          <div className="flex justify-end gap-3 mt-2">
            <button type="button" onClick={() => setShowCreateTeamModal(false)} className="px-4 py-2 text-sm text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white transition-colors active:scale-95">Cancel</button>
            <button type="submit" disabled={!newTeamName.trim()} className="px-5 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg disabled:opacity-50 transition-colors active:scale-95 shadow-sm">Create</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showCreateChannelModal} onClose={() => setShowCreateChannelModal(false)} title="Create Channel">
        <CreateChannelForm
          teams={teams}
          onCancel={() => setShowCreateChannelModal(false)}
          onCreated={(channel) => {
            setShowCreateChannelModal(false);
            setUiState('isGlobalPlusOpen', false);
            navigate(`/dashboard/channel/${channel._id}`);
          }}
        />
      </Modal>
    </>
  );
};

export default Header;
