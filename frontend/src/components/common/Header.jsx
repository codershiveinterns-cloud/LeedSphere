import { LogOut, Download, Search, Bell, Plus, Users, Hash, FileText, MessageSquare, CheckSquare, X } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';
import useAppStore from '../../store/useAppStore';
import Modal from './Modal';
import toast from 'react-hot-toast';

const Header = ({ simulatedRole, setSimulatedRole }) => {
  const { user, logout } = useAuthStore();
  const {
    activeWorkspace, uiStates, setUiState,
    notifications, markNotificationRead, markAllNotificationsRead, getUnreadCount,
    searchAll, teams, addTeam, setActiveTeam, addTeamChannel,
  } = useAppStore();
  const navigate = useNavigate();

  const [activeNotifTab, setActiveNotifTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);
  const [showCreateChannelModal, setShowCreateChannelModal] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelTeamId, setNewChannelTeamId] = useState('');

  const plusRef = useRef(null);
  const notifRef = useRef(null);
  const searchRef = useRef(null);

  const unreadCount = getUnreadCount();

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (plusRef.current && !plusRef.current.contains(e.target)) setUiState('isGlobalPlusOpen', false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setUiState('isNotificationsOpen', false);
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchResults(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [setUiState]);

  // Live search
  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      setSearchResults(searchAll(searchQuery));
    } else {
      setSearchResults(null);
    }
  }, [searchQuery, searchAll]);

  const handleExport = (format) => {
    if (!activeWorkspace) return;
    window.open(`http://localhost:5005/api/workspaces/${activeWorkspace._id}/export?format=${format}`, '_blank');
  };

  const handleCreateTeam = (e) => {
    e.preventDefault();
    if (!newTeamName.trim() || !activeWorkspace) return;
    const generatedId = `team_${Date.now()}`;
    const newTeam = { _id: generatedId, name: newTeamName, members: [], createdAt: new Date().toISOString() };
    addTeam(newTeam);
    setActiveTeam(newTeam);
    setNewTeamName('');
    setShowCreateTeamModal(false);
    setUiState('isGlobalPlusOpen', false);
    toast.success(`Team "${newTeamName}" created`);
    navigate(`/dashboard/team/${generatedId}`);
  };

  const handleCreateChannel = (e) => {
    e.preventDefault();
    if (!newChannelName.trim() || !newChannelTeamId) return;
    const channel = { id: `ch_${Date.now()}`, name: newChannelName.toLowerCase().replace(/\s+/g, '-'), type: 'public' };
    addTeamChannel(newChannelTeamId, channel);
    setNewChannelName('');
    setNewChannelTeamId('');
    setShowCreateChannelModal(false);
    setUiState('isGlobalPlusOpen', false);
    toast.success(`#${channel.name} created`);
  };

  const formatTime = (ts) => {
    const diff = Date.now() - ts;
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  const filteredNotifs = activeNotifTab === 'All'
    ? notifications
    : activeNotifTab === 'Mentions'
      ? notifications.filter(n => n.type === 'mention')
      : notifications.filter(n => n.type === 'task');

  const hasSearchResults = searchResults && (searchResults.teams.length > 0 || searchResults.channels.length > 0 || searchResults.members.length > 0);

  return (
    <>
      <header className="h-14 bg-[#161b22] border-b border-gray-800 flex items-center justify-between px-6 shrink-0 shadow-sm z-20">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-md shadow-indigo-500/20">L</div>
          <span className="font-bold text-xl text-white tracking-tight hidden sm:block">Leedsphere</span>
          <span className="mx-4 text-gray-700 hidden sm:block">|</span>
          <span className="text-sm font-medium text-gray-400">Role:</span>
          <select
            value={simulatedRole}
            onChange={e => setSimulatedRole(e.target.value)}
            className="ml-1 bg-[#0d1117] border border-gray-700 rounded-md text-sm text-indigo-400 px-2 py-1 outline-none font-semibold cursor-pointer max-w-[100px] truncate"
          >
            <option value="Admin">Admin</option>
            <option value="Manager">Manager</option>
            <option value="Member">Member</option>
          </select>
        </div>

        {/* Global Search Bar */}
        <div className="flex-1 max-w-lg mx-8 hidden md:block relative" ref={searchRef}>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500 group-focus-within:text-indigo-400 transition-colors">
              <Search size={16} />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={`Search teams, channels, members... (Ctrl+K)`}
              className="w-full bg-[#0d1117]/80 hover:bg-[#0d1117] border border-gray-700 focus:border-indigo-500/50 rounded-lg pl-9 pr-4 py-1.5 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
            />
            {searchQuery && (
              <button onClick={() => { setSearchQuery(''); setSearchResults(null); }} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-300">
                <X size={14} />
              </button>
            )}
          </div>

          {/* Search Results Dropdown */}
          {hasSearchResults && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-[#1c212b] border border-gray-700 rounded-xl shadow-2xl overflow-hidden z-50 max-h-[400px] overflow-y-auto">
              {searchResults.teams.length > 0 && (
                <div>
                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-[#161b22]">Teams</div>
                  {searchResults.teams.map(t => (
                    <button key={t._id} onClick={() => { setActiveTeam(t); navigate(`/dashboard/team/${t._id}`); setSearchQuery(''); setSearchResults(null); }}
                      className="flex items-center gap-3 w-full p-3 hover:bg-indigo-600/10 text-gray-300 text-sm transition-colors">
                      <Users size={16} className="text-indigo-400" /> {t.name}
                    </button>
                  ))}
                </div>
              )}
              {searchResults.channels.length > 0 && (
                <div>
                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-[#161b22]">Channels</div>
                  {searchResults.channels.map(c => (
                    <button key={c.id} onClick={() => { navigate(`/dashboard/channel/${c.id}`); setSearchQuery(''); setSearchResults(null); }}
                      className="flex items-center gap-3 w-full p-3 hover:bg-indigo-600/10 text-gray-300 text-sm transition-colors">
                      <Hash size={16} className="text-gray-500" /> #{c.name}
                    </button>
                  ))}
                </div>
              )}
              {searchResults.members.length > 0 && (
                <div>
                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-[#161b22]">Members</div>
                  {searchResults.members.map(m => (
                    <div key={m.id} className="flex items-center gap-3 w-full p-3 hover:bg-indigo-600/10 text-gray-300 text-sm transition-colors">
                      <img src={m.avatar} className="w-6 h-6 rounded-full" alt={m.name} /> {m.name}
                      <span className="ml-auto text-xs text-gray-600">{m.title}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {searchQuery.trim() && !hasSearchResults && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-[#1c212b] border border-gray-700 rounded-xl shadow-2xl z-50 p-6 text-center">
              <Search size={24} className="text-gray-700 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">No results for "{searchQuery}"</p>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          {activeWorkspace && (
            <button
              onClick={() => handleExport('pdf')}
              className="hidden lg:flex items-center gap-2 text-sm text-gray-400 hover:text-indigo-400 transition-colors bg-gray-800/50 px-3 py-1.5 rounded-md hover:bg-gray-800 border border-gray-700"
              title="Export as PDF"
            >
              <Download size={14} /> PDF
            </button>
          )}

          {/* Global Create Button */}
          <div className="relative" ref={plusRef}>
            <button
              onClick={() => setUiState('isGlobalPlusOpen', !uiStates.isGlobalPlusOpen)}
              className="w-8 h-8 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center transition-colors shadow-sm shadow-indigo-500/20"
            >
              <Plus size={18} />
            </button>
            {uiStates.isGlobalPlusOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-[#1c212b] border border-gray-700 shadow-2xl rounded-xl overflow-hidden backdrop-blur-md z-50">
                <div className="p-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Create New</div>
                <div className="flex flex-col p-1">
                  <button onClick={() => { setShowCreateTeamModal(true); setUiState('isGlobalPlusOpen', false); }} className="flex items-center gap-3 w-full p-2 hover:bg-indigo-600/10 hover:text-indigo-400 text-gray-300 rounded-lg transition-colors text-sm font-medium"><Users size={16} /> Team <span className="ml-auto text-xs text-gray-600 border border-gray-700 rounded px-1">T</span></button>
                  <button onClick={() => { setShowCreateChannelModal(true); setUiState('isGlobalPlusOpen', false); }} className="flex items-center gap-3 w-full p-2 hover:bg-indigo-600/10 hover:text-indigo-400 text-gray-300 rounded-lg transition-colors text-sm font-medium"><Hash size={16} /> Channel <span className="ml-auto text-xs text-gray-600 border border-gray-700 rounded px-1">C</span></button>
                  <button onClick={() => { navigate('/dashboard/notes/new'); setUiState('isGlobalPlusOpen', false); }} className="flex items-center gap-3 w-full p-2 hover:bg-indigo-600/10 hover:text-indigo-400 text-gray-300 rounded-lg transition-colors text-sm font-medium"><FileText size={16} /> Note/Doc <span className="ml-auto text-xs text-gray-600 border border-gray-700 rounded px-1">N</span></button>
                  <button onClick={() => { navigate('/dashboard/dm/new'); setUiState('isGlobalPlusOpen', false); }} className="flex items-center gap-3 w-full p-2 hover:bg-indigo-600/10 hover:text-indigo-400 text-gray-300 rounded-lg transition-colors text-sm font-medium"><MessageSquare size={16} /> Direct Message <span className="ml-auto text-xs text-gray-600 border border-gray-700 rounded px-1">M</span></button>
                </div>
              </div>
            )}
          </div>

          {/* Notifications Dropdown */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setUiState('isNotificationsOpen', !uiStates.isNotificationsOpen)}
              className="text-gray-400 hover:text-gray-200 transition-colors relative p-1"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-red-500 rounded-full ring-2 ring-[#161b22] flex items-center justify-center text-[10px] font-bold text-white px-1">
                  {unreadCount}
                </span>
              )}
            </button>

            {uiStates.isNotificationsOpen && (
              <div className="absolute right-0 mt-2 w-[340px] bg-[#161b22] border border-gray-700 shadow-2xl rounded-xl overflow-hidden backdrop-blur-md z-50 flex flex-col max-h-[400px]">
                {/* Notification Tabs */}
                <div className="flex border-b border-gray-800 shrink-0">
                  {['All', 'Mentions', 'Tasks'].map(tab => (
                    <button
                      key={tab}
                      onClick={(e) => { e.stopPropagation(); setActiveNotifTab(tab); }}
                      className={`flex-1 py-3 text-sm font-medium transition-colors ${activeNotifTab === tab ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {/* Content Panel */}
                <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
                  {filteredNotifs.length === 0 ? (
                    <div className="py-8 text-center">
                      <Bell size={24} className="text-gray-700 mx-auto mb-2" />
                      <p className="text-gray-500 text-sm">No {activeNotifTab.toLowerCase()} notifications</p>
                    </div>
                  ) : (
                    filteredNotifs.map(notif => (
                      <button
                        key={notif.id}
                        onClick={() => markNotificationRead(notif.id)}
                        className={`flex gap-3 p-3 rounded-lg transition-colors cursor-pointer text-left w-full ${
                          notif.read ? 'hover:bg-[#1c212b]' : 'bg-indigo-500/5 hover:bg-indigo-500/10 border border-indigo-500/10'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs mt-0.5 shrink-0 ${
                          notif.type === 'mention' ? 'bg-emerald-500/20 text-emerald-400' :
                          notif.type === 'task' ? 'bg-purple-500/20 text-purple-400' :
                          'bg-indigo-500/20 text-indigo-400'
                        }`}>
                          {notif.type === 'mention' ? <MessageSquare size={14} /> :
                           notif.type === 'task' ? <CheckSquare size={14} /> :
                           <Users size={14} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm ${notif.read ? 'text-gray-400' : 'text-gray-200'}`}>{notif.text}</p>
                          <span className="text-xs text-gray-500">{formatTime(notif.timestamp)}</span>
                        </div>
                        {!notif.read && <span className="w-2 h-2 bg-indigo-500 rounded-full mt-2 shrink-0"></span>}
                      </button>
                    ))
                  )}
                </div>
                <div className="p-2 border-t border-gray-800 shrink-0 text-center">
                  <button onClick={markAllNotificationsRead} className="text-sm font-medium text-indigo-400 hover:text-indigo-300">Mark all as read</button>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 pl-4 border-l border-gray-800">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white shadow-sm ring-2 ring-[#0d1117]">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm font-medium text-gray-200 hidden md:block">{user?.name}</span>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-red-400 transition-colors ml-2"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* Create Team Modal */}
      <Modal isOpen={showCreateTeamModal} onClose={() => setShowCreateTeamModal(false)} title="Create Team">
        <form onSubmit={handleCreateTeam} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Team Name</label>
            <input
              type="text" autoFocus value={newTeamName} onChange={e => setNewTeamName(e.target.value)}
              className="w-full bg-[#0d1117] border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-1 focus:ring-indigo-500 outline-none placeholder-gray-600"
              placeholder="e.g. Engineering, Marketing"
            />
          </div>
          <div className="flex justify-end gap-3 mt-2">
            <button type="button" onClick={() => setShowCreateTeamModal(false)} className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors">Cancel</button>
            <button type="submit" disabled={!newTeamName.trim()} className="px-5 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg disabled:opacity-50 transition-colors">Create</button>
          </div>
        </form>
      </Modal>

      {/* Create Channel Modal */}
      <Modal isOpen={showCreateChannelModal} onClose={() => setShowCreateChannelModal(false)} title="Create Channel">
        <form onSubmit={handleCreateChannel} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Select Team</label>
            <select
              value={newChannelTeamId} onChange={e => setNewChannelTeamId(e.target.value)}
              className="w-full bg-[#0d1117] border border-gray-700 rounded-lg px-4 py-2 text-white outline-none"
            >
              <option value="">Choose a team...</option>
              {(Array.isArray(teams) ? teams : []).map(t => (
                <option key={t._id} value={t._id}>{t.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Channel Name</label>
            <input
              type="text" value={newChannelName} onChange={e => setNewChannelName(e.target.value)}
              className="w-full bg-[#0d1117] border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-1 focus:ring-indigo-500 outline-none placeholder-gray-600"
              placeholder="e.g. general, design-review"
            />
          </div>
          <div className="flex justify-end gap-3 mt-2">
            <button type="button" onClick={() => setShowCreateChannelModal(false)} className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors">Cancel</button>
            <button type="submit" disabled={!newChannelName.trim() || !newChannelTeamId} className="px-5 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg disabled:opacity-50 transition-colors">Create</button>
          </div>
        </form>
      </Modal>
    </>
  );
};

export default Header;
