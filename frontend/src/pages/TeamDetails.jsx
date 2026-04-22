import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Users, Hash, FileText, Pin, MoreHorizontal, Settings, Plus, Image as ImageIcon, Lock, X, Trash2, Shield, ShieldCheck, UserMinus, Grid, List, Upload, ChevronDown } from 'lucide-react';
import useAppStore from '../store/useAppStore';
import Modal from '../components/common/Modal';
import toast from 'react-hot-toast';

const TeamDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    activeTeam, teams, setActiveTeam, setActiveChannel,
    getTeamMembers, addTeamMember, removeTeamMember, updateMemberRole,
    getTeamChannels, addTeamChannel,
    getTeamActivity,
    getTeamFiles, addTeamFile,
    getTeamPinnedNotes, addPinnedNote, removePinnedNote,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState('Members');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelType, setNewChannelType] = useState('public');
  const [filesView, setFilesView] = useState('grid');
  const [newPinText, setNewPinText] = useState('');
  const [showPinInput, setShowPinInput] = useState(false);

  // Resolve team
  const resolvedTeam = (activeTeam?._id === id)
    ? activeTeam
    : (Array.isArray(teams) ? teams : []).find(t => t._id === id) || activeTeam;

  useEffect(() => {
    if (resolvedTeam && resolvedTeam._id !== activeTeam?._id) {
      setActiveTeam(resolvedTeam);
    }
  }, [id, resolvedTeam, activeTeam, setActiveTeam]);

  if (!resolvedTeam) {
    return (
      <div className="flex-1 bg-[#0d1117] flex items-center justify-center font-sans">
        <div className="text-center">
          <Users size={48} className="text-gray-700 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Team not found</h2>
          <p className="text-gray-400 text-sm">This team may have been removed or the link is invalid.</p>
        </div>
      </div>
    );
  }

  const teamId = resolvedTeam._id;
  const teamName = resolvedTeam?.name || "Loading Team...";
  const members = getTeamMembers(teamId);
  const teamChannels = getTeamChannels(teamId);
  const activity = getTeamActivity(teamId);
  const files = getTeamFiles(teamId);
  const pinnedNotes = getTeamPinnedNotes(teamId);

  const tags = ["High Priority", "Backend", "Frontend"];
  const onlineCount = members.filter(m => m.status === 'online').length;

  const handleInvite = (e) => {
    e.preventDefault();
    if (!inviteName.trim()) return;
    const newMember = {
      id: `u_${Date.now()}`,
      name: inviteName,
      avatar: `https://i.pravatar.cc/150?u=${Date.now()}`,
      role: 'member',
      status: 'online',
      title: 'New Member',
    };
    addTeamMember(teamId, newMember);
    setInviteName('');
    setShowInviteModal(false);
    toast.success(`${inviteName} invited to ${teamName}`);
  };

  const handleCreateChannel = (e) => {
    e.preventDefault();
    if (!newChannelName.trim()) return;
    const channelId = `ch_${Date.now()}`;
    const channel = {
      id: channelId,
      _id: channelId,
      name: newChannelName.toLowerCase().replace(/\s+/g, '-'),
      type: newChannelType,
    };
    addTeamChannel(teamId, channel);
    setActiveChannel(channel);
    setNewChannelName('');
    toast.success(`#${channel.name} created`);
    navigate(`/dashboard/channel/${channelId}`);
  };

  const handleAddPin = (e) => {
    e.preventDefault();
    if (!newPinText.trim()) return;
    addPinnedNote(teamId, { id: `pin_${Date.now()}`, text: newPinText });
    setNewPinText('');
    setShowPinInput(false);
    toast.success('Note pinned');
  };

  const handleUploadFile = () => {
    const names = ['Report_Q4.pdf', 'Wireframes.png', 'Meeting_Notes.md', 'Budget.xlsx', 'Screenshot.png'];
    const types = ['document', 'image', 'document', 'document', 'image'];
    const idx = Math.floor(Math.random() * names.length);
    const file = {
      id: `f_${Date.now()}`,
      name: names[idx],
      type: types[idx],
      size: `${(Math.random() * 5 + 0.1).toFixed(1)} MB`,
      uploadedBy: 'You',
      uploadedAt: 'Just now',
    };
    addTeamFile(teamId, file);
    toast.success(`${file.name} uploaded`);
  };

  const formatTime = (ts) => {
    const diff = Date.now() - ts;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  const statusColor = (s) => s === 'online' ? 'bg-emerald-500' : s === 'idle' ? 'bg-yellow-500' : 'bg-gray-500';
  const statusLabel = (s) => s === 'online' ? 'text-emerald-400 bg-emerald-500/10' : s === 'idle' ? 'text-yellow-400 bg-yellow-500/10' : 'text-gray-400 bg-gray-500/10';

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Members':
        return (
          <div className="flex flex-col gap-2 mt-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-400">{members.length} members &middot; {onlineCount} online</p>
              <button onClick={() => setShowInviteModal(true)} className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors">
                <Plus size={14} /> Invite
              </button>
            </div>
            {members.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Users size={40} className="text-gray-700 mb-3" />
                <p className="text-gray-400 font-medium mb-1">No members yet</p>
                <p className="text-gray-600 text-sm mb-4">Invite people to start collaborating</p>
                <button onClick={() => setShowInviteModal(true)} className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">Invite Members</button>
              </div>
            ) : (
              members.map(member => (
                <div key={member.id} className="flex items-center gap-4 p-3 hover:bg-[#1c212b] rounded-lg transition-colors border border-transparent hover:border-gray-800 group">
                  <div className="relative">
                    <img src={member.avatar} className="w-10 h-10 rounded-full object-cover" alt={member.name} />
                    <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#0d1117] ${statusColor(member.status)}`}></span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-200 truncate">{member.name}</h4>
                    <p className="text-xs text-gray-500">{member.title}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${statusLabel(member.status)}`}>{member.status}</span>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <select
                      value={member.role}
                      onChange={(e) => { updateMemberRole(teamId, member.id, e.target.value); toast.success(`${member.name} is now ${e.target.value}`); }}
                      className="bg-[#0d1117] border border-gray-700 rounded-md text-xs text-gray-300 px-2 py-1 outline-none cursor-pointer"
                    >
                      <option value="admin">Admin</option>
                      <option value="member">Member</option>
                    </select>
                    <button
                      onClick={() => { removeTeamMember(teamId, member.id); toast.success(`${member.name} removed`); }}
                      className="p-1.5 text-red-500/60 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
                      title="Remove member"
                    >
                      <UserMinus size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        );

      case 'Channels':
        return (
          <div className="flex flex-col gap-4 mt-4">
            <form onSubmit={handleCreateChannel} className="flex gap-3">
              <input
                value={newChannelName}
                onChange={e => setNewChannelName(e.target.value)}
                placeholder="New channel name..."
                className="flex-1 bg-[#0d1117] border border-gray-700 rounded-lg px-4 py-2 text-white text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
              />
              <select value={newChannelType} onChange={e => setNewChannelType(e.target.value)} className="bg-[#0d1117] border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300 outline-none">
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>
              <button type="submit" disabled={!newChannelName.trim()} className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">Create</button>
            </form>
            {teamChannels.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Hash size={40} className="text-gray-700 mb-3" />
                <p className="text-gray-400 font-medium mb-1">No channels yet</p>
                <p className="text-gray-600 text-sm">Create a channel to start discussions</p>
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                {teamChannels.map(ch => {
                  const chId = ch._id || ch.id;
                  return (
                  <button
                    key={chId}
                    onClick={() => { setActiveChannel({ ...ch, _id: chId }); navigate(`/dashboard/channel/${chId}`); }}
                    className="flex items-center gap-3 p-3 hover:bg-[#1c212b] rounded-lg transition-colors border border-transparent hover:border-gray-800 text-left group w-full"
                  >
                    {ch.type === 'private' ? <Lock size={16} className="text-gray-500" /> : <Hash size={16} className="text-gray-500" />}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-200 group-hover:text-indigo-300 transition-colors">{ch.name}</p>
                      <p className="text-xs text-gray-600">{ch.type === 'private' ? 'Private channel' : 'Public channel'}</p>
                    </div>
                    <span className="text-xs text-gray-600 bg-gray-800/50 px-2 py-0.5 rounded">{ch.type}</span>
                  </button>
                  );
                })}
              </div>
            )}
          </div>
        );

      case 'Activity':
        return (
          <div className="flex flex-col gap-1 mt-4">
            {activity.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <svg className="w-10 h-10 text-gray-700 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <p className="text-gray-400 font-medium mb-1">No activity yet</p>
                <p className="text-gray-600 text-sm">Activity will appear here as the team works</p>
              </div>
            ) : (
              activity.map((item, i) => {
                const colorMap = { indigo: 'bg-indigo-500/20 border-indigo-500/50', emerald: 'bg-emerald-500/20 border-emerald-500/50', blue: 'bg-blue-500/20 border-blue-500/50', red: 'bg-red-500/20 border-red-500/50', purple: 'bg-purple-500/20 border-purple-500/50' };
                const dotMap = { indigo: 'bg-indigo-400', emerald: 'bg-emerald-400', blue: 'bg-blue-400', red: 'bg-red-400', purple: 'bg-purple-400' };
                const c = item.color || 'indigo';
                return (
                  <div key={item.id} className={`relative pl-6 py-3 ${i < activity.length - 1 ? 'border-l-2 border-gray-800 ml-[7px]' : 'ml-[7px]'}`}>
                    <span className={`absolute -left-[9px] top-4 w-4 h-4 rounded-full ${colorMap[c]} border flex items-center justify-center`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${dotMap[c]}`}></span>
                    </span>
                    <p className="text-sm font-medium text-gray-200">{item.text}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{formatTime(item.timestamp)}</p>
                  </div>
                );
              })
            )}
          </div>
        );

      case 'Files':
        return (
          <div className="flex flex-col gap-4 mt-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-400">{files.length} files</p>
              <div className="flex items-center gap-2">
                <button onClick={handleUploadFile} className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors">
                  <Upload size={14} /> Upload
                </button>
                <div className="flex bg-[#0d1117] border border-gray-700 rounded-lg overflow-hidden">
                  <button onClick={() => setFilesView('grid')} className={`p-1.5 transition-colors ${filesView === 'grid' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}><Grid size={16} /></button>
                  <button onClick={() => setFilesView('list')} className={`p-1.5 transition-colors ${filesView === 'list' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}><List size={16} /></button>
                </div>
              </div>
            </div>
            {files.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <FileText size={40} className="text-gray-700 mb-3" />
                <p className="text-gray-400 font-medium mb-1">No files uploaded</p>
                <p className="text-gray-600 text-sm mb-4">Upload files to share with your team</p>
                <button onClick={handleUploadFile} className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">Upload File</button>
              </div>
            ) : filesView === 'grid' ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {files.map(file => (
                  <div key={file.id} className="group flex flex-col bg-[#161b22] border border-gray-800 rounded-xl overflow-hidden hover:border-indigo-500/50 transition-colors cursor-pointer">
                    <div className="h-24 bg-[#1c212b] flex items-center justify-center text-gray-600 group-hover:text-indigo-400 transition-colors">
                      {file.type === 'image' ? <ImageIcon size={32} /> : <FileText size={32} />}
                    </div>
                    <div className="p-3">
                      <p className="text-sm font-medium text-gray-200 truncate">{file.name}</p>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs text-gray-500">{file.size}</p>
                        <p className="text-xs text-gray-600">{file.uploadedAt}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                {files.map(file => (
                  <div key={file.id} className="flex items-center gap-4 p-3 hover:bg-[#1c212b] rounded-lg transition-colors border border-transparent hover:border-gray-800 cursor-pointer">
                    <div className="w-10 h-10 bg-[#1c212b] rounded-lg flex items-center justify-center text-gray-500 shrink-0">
                      {file.type === 'image' ? <ImageIcon size={20} /> : <FileText size={20} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-200 truncate">{file.name}</p>
                      <p className="text-xs text-gray-500">by {file.uploadedBy}</p>
                    </div>
                    <span className="text-xs text-gray-500">{file.size}</span>
                    <span className="text-xs text-gray-600">{file.uploadedAt}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex-1 bg-[#0d1117] flex overflow-hidden font-sans">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-gray-800 overflow-y-auto relative">
        <div className="h-40 bg-gradient-to-r from-indigo-900/40 to-purple-900/20 shrink-0"></div>

        <div className="px-8 flex flex-col pb-12 relative -mt-12">
          <div className="flex items-end justify-between mb-6">
            <div className="flex items-end gap-4">
              <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-3xl font-bold text-white shadow-xl ring-4 ring-[#0d1117]">
                {teamName.charAt(0).toUpperCase()}
              </div>
              <div className="mb-2">
                <h1 className="text-3xl font-bold text-white tracking-tight">{teamName}</h1>
                <div className="flex gap-2 mt-2">
                  {tags.map(tag => (
                    <span key={tag} className="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-gray-800/50 text-gray-400 border border-gray-700">{tag}</span>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">{members.length} members &middot; {onlineCount} online &middot; {teamChannels.length} channels</p>
              </div>
            </div>
            <div className="flex gap-2 mb-2">
              <button onClick={() => setShowInviteModal(true)} className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"><Users size={16} className="inline mr-2" /> Invite</button>
              <button className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"><Settings size={18} /></button>
            </div>
          </div>

          {/* Pinned Notes */}
          {pinnedNotes.length > 0 && (
            <div className="flex flex-col gap-2 mb-6">
              {pinnedNotes.map(note => (
                <div key={note.id} className="bg-indigo-500/5 border border-indigo-500/20 rounded-xl p-4 flex gap-3 items-start">
                  <Pin size={18} className="text-indigo-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-300"><span className="font-semibold text-indigo-400">Pinned: </span>{note.text}</p>
                  </div>
                  <button onClick={() => { removePinnedNote(teamId, note.id); toast.success('Unpinned'); }} className="text-gray-500 hover:text-red-400 transition-colors" title="Unpin">
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add pin */}
          {showPinInput ? (
            <form onSubmit={handleAddPin} className="flex gap-3 mb-6">
              <input value={newPinText} onChange={e => setNewPinText(e.target.value)} placeholder="Pin a note..." autoFocus className="flex-1 bg-[#0d1117] border border-gray-700 rounded-lg px-4 py-2 text-white text-sm focus:ring-1 focus:ring-indigo-500 outline-none" />
              <button type="submit" disabled={!newPinText.trim()} className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">Pin</button>
              <button type="button" onClick={() => setShowPinInput(false)} className="text-gray-400 hover:text-white px-3 py-2 text-sm">Cancel</button>
            </form>
          ) : (
            <button onClick={() => setShowPinInput(true)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-indigo-400 mb-6 transition-colors">
              <Pin size={14} /> Add pinned note
            </button>
          )}

          {/* Tabs */}
          <div className="flex border-b border-gray-800 gap-6 mt-2 mb-4 shrink-0">
            {['Members', 'Channels', 'Activity', 'Files'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-3 text-sm font-medium transition-colors relative ${activeTab === tab ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
              >
                {tab}
                {tab === 'Members' && <span className="ml-1.5 text-xs text-gray-600">{members.length}</span>}
                {tab === 'Channels' && <span className="ml-1.5 text-xs text-gray-600">{teamChannels.length}</span>}
                {tab === 'Files' && <span className="ml-1.5 text-xs text-gray-600">{files.length}</span>}
                {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-indigo-500 rounded-t-full"></div>}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="flex-1">{renderTabContent()}</div>
        </div>
      </div>

      {/* Right Side Activity Feed */}
      <div className="w-80 bg-[#0e1116] hidden xl:flex flex-col shrink-0">
        <div className="h-14 border-b border-gray-800 flex items-center px-6">
          <h3 className="font-semibold text-gray-200">Team Activity</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-1">
          {activity.length === 0 ? (
            <p className="text-gray-600 text-sm text-center mt-8">No activity yet</p>
          ) : (
            activity.slice(0, 15).map((item, i) => {
              const colorMap = { indigo: 'bg-indigo-500/20 border-indigo-500/50', emerald: 'bg-emerald-500/20 border-emerald-500/50', blue: 'bg-blue-500/20 border-blue-500/50', red: 'bg-red-500/20 border-red-500/50', purple: 'bg-purple-500/20 border-purple-500/50' };
              const dotMap = { indigo: 'bg-indigo-400', emerald: 'bg-emerald-400', blue: 'bg-blue-400', red: 'bg-red-400', purple: 'bg-purple-400' };
              const c = item.color || 'indigo';
              return (
                <div key={item.id} className={`relative pl-6 py-3 ${i < Math.min(activity.length, 15) - 1 ? 'border-l-2 border-gray-800 ml-[7px]' : 'ml-[7px]'}`}>
                  <span className={`absolute -left-[9px] top-4 w-4 h-4 rounded-full ${colorMap[c]} border flex items-center justify-center`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${dotMap[c]}`}></span>
                  </span>
                  <p className="text-sm font-medium text-gray-200">{item.text}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{formatTime(item.timestamp)}</p>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Invite Modal */}
      <Modal isOpen={showInviteModal} onClose={() => setShowInviteModal(false)} title="Invite Member">
        <form onSubmit={handleInvite} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Name</label>
            <input
              type="text" autoFocus value={inviteName} onChange={e => setInviteName(e.target.value)}
              className="w-full bg-[#0d1117] border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-1 focus:ring-indigo-500 outline-none placeholder-gray-600"
              placeholder="e.g. Jane Doe"
            />
          </div>
          <div className="flex justify-end gap-3 mt-2">
            <button type="button" onClick={() => setShowInviteModal(false)} className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors">Cancel</button>
            <button type="submit" disabled={!inviteName.trim()} className="px-5 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg disabled:opacity-50 transition-colors">Send Invite</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TeamDetails;
