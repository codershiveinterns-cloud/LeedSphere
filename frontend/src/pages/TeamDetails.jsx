import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Users, Hash, Settings, Lock, UserMinus, Mail, Shield, ShieldCheck, Crown, Plus, Loader2 } from 'lucide-react';
import useAppStore from '../store/useAppStore';
import useCurrentTeamStore from '../store/useCurrentTeamStore';
import Modal from '../components/common/Modal';
import CreateChannelForm from '../components/channel/CreateChannelForm';
import toast from 'react-hot-toast';

const DESIGNATIONS = [
  'Backend Developer', 'Frontend Developer', 'Fullstack Engineer',
  'UI/UX Designer', 'Product Manager', 'DevOps Engineer',
  'QA Engineer', 'Data Scientist', 'Team Lead', 'Other',
];

const roleBadge = (role) => {
  if (role === 'admin') return {
    icon: Crown, text: 'Admin',
    cls: 'text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-500/10 dark:border-amber-500/20',
  };
  if (role === 'manager') return {
    icon: ShieldCheck, text: 'Manager',
    cls: 'text-indigo-700 bg-indigo-50 border-indigo-200 dark:text-indigo-400 dark:bg-indigo-500/10 dark:border-indigo-500/20',
  };
  return {
    icon: Shield, text: 'Member',
    cls: 'text-slate-600 bg-slate-100 border-slate-200 dark:text-gray-400 dark:bg-gray-500/10 dark:border-gray-700',
  };
};

const relativeTime = (ms) => {
  if (ms < 60000) return 'Just now';
  if (ms < 3600000) return `${Math.floor(ms / 60000)}m ago`;
  if (ms < 86400000) return `${Math.floor(ms / 3600000)}h ago`;
  return `${Math.floor(ms / 86400000)}d ago`;
};

const TeamDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    activeTeam, teams, setActiveTeam, setActiveChannel,
    getTeamMembers, removeTeamMember, updateTeamMember,
    getTeamChannels, fetchTeamChannels,
    getTeamActivity, fetchTeamActivity,
    sendInvite,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState('Members');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [inviteDesignation, setInviteDesignation] = useState('');
  const [inviting, setInviting] = useState(false);
  const [showCreateChannel, setShowCreateChannel] = useState(false);

  const resolvedTeam = (activeTeam?._id === id) ? activeTeam : teams.find(t => t._id === id) || activeTeam;

  useEffect(() => {
    if (id) {
      if (resolvedTeam && resolvedTeam._id !== activeTeam?._id) setActiveTeam(resolvedTeam);
      fetchTeamChannels(id);
      fetchTeamActivity(id);
    }
  }, [id]);

  const teamId = resolvedTeam?._id;
  const members = teamId ? getTeamMembers(teamId) : [];
  const teamChannels = teamId ? getTeamChannels(teamId) : [];
  const activity = teamId ? getTeamActivity(teamId) : [];

  // Pre-compute relative times once per activity change (avoids Date.now() during render of each item)
  const activityLabeled = useMemo(() => {
    const now = Date.now();
    return activity.map(a => ({ ...a, _rel: a.createdAt ? relativeTime(now - new Date(a.createdAt).getTime()) : '' }));
  }, [activity]);

  // Disambiguate "still bootstrapping" from "genuinely not found". Only
  // render the not-found screen after the app has loaded workspace + teams;
  // otherwise show a loader to avoid a false flash on slow refreshes.
  const appDataLoaded = useCurrentTeamStore((s) => s.appDataLoaded);

  if (!resolvedTeam && !appDataLoaded) {
    return (
      <div className="flex-1 bg-[#f5f6f8] dark:bg-[#0d1117] flex items-center justify-center font-sans transition-colors duration-200">
        <div className="flex flex-col items-center gap-3 text-slate-500 dark:text-gray-400">
          <Loader2 size={20} className="animate-spin" />
          <p className="text-sm">Loading team…</p>
        </div>
      </div>
    );
  }

  if (!resolvedTeam) {
    return (
      <div className="flex-1 bg-[#f5f6f8] dark:bg-[#0d1117] flex items-center justify-center font-sans transition-colors duration-200">
        <div className="text-center animate-fade-in">
          <Users size={48} className="text-slate-300 dark:text-gray-700 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Team not found</h2>
          <p className="text-slate-500 dark:text-gray-400 text-sm">This team may have been removed or the link is invalid.</p>
        </div>
      </div>
    );
  }

  const teamName = resolvedTeam?.name || "Loading...";

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      await sendInvite(teamId, inviteEmail, inviteRole, inviteDesignation);
      toast.success(`Invite sent to ${inviteEmail}`);
      setInviteEmail('');
      setInviteRole('member');
      setInviteDesignation('');
      setShowInviteModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send invite');
    } finally {
      setInviting(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await updateTeamMember(teamId, userId, { role: newRole });
      toast.success('Role updated');
    } catch { toast.error('Failed to update role'); }
  };

  const handleDesignationChange = async (userId, designation) => {
    try {
      await updateTeamMember(teamId, userId, { designation });
      toast.success('Designation updated');
    } catch { toast.error('Failed to update'); }
  };

  const handleRemoveMember = async (userId, name) => {
    try {
      await removeTeamMember(teamId, userId);
      toast.success(`${name} removed`);
    } catch { toast.error('Failed to remove member'); }
  };

  const inputCls = 'bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-gray-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-colors placeholder-slate-400 dark:placeholder-gray-600';
  const smSelectCls = 'bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-gray-700 rounded-md text-[11px] text-slate-700 dark:text-gray-300 px-1.5 py-1 outline-none cursor-pointer';

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Members':
        return (
          <div className="flex flex-col gap-2 mt-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-slate-500 dark:text-gray-400">{members.length} members</p>
              <button onClick={() => setShowInviteModal(true)}
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors shadow-sm active:scale-95">
                <Mail size={14} /> Invite
              </button>
            </div>
            {members.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
                <Users size={40} className="text-slate-300 dark:text-gray-700 mb-3" />
                <p className="text-slate-700 dark:text-gray-400 font-medium mb-1">No members yet</p>
                <p className="text-slate-500 dark:text-gray-600 text-sm mb-4">Invite people to start collaborating</p>
                <button onClick={() => setShowInviteModal(true)} className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition-colors active:scale-95">Invite Members</button>
              </div>
            ) : (
              members.map(member => {
                const badge = roleBadge(member.role);
                const BadgeIcon = badge.icon;
                return (
                  <div key={member.id} className="flex items-center gap-4 p-3 hover:bg-slate-100 dark:hover:bg-[#1c212b] rounded-lg transition-colors border border-transparent hover:border-slate-200 dark:hover:border-gray-800 group">
                    <img src={member.avatar} className="w-10 h-10 rounded-full object-cover" alt={member.name} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-slate-900 dark:text-gray-200 truncate">{member.name}</h4>
                        <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full font-semibold border ${badge.cls}`}>
                          <BadgeIcon size={10} /> {badge.text}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {member.designation && (
                          <span className="text-xs text-indigo-600 dark:text-indigo-400/80 bg-indigo-50 dark:bg-indigo-500/5 px-1.5 py-0.5 rounded">{member.designation}</span>
                        )}
                        <span className="text-xs text-slate-400 dark:text-gray-600">{member.email}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <select value={member.role} onChange={e => handleRoleChange(member.id, e.target.value)} className={smSelectCls}>
                        <option value="admin">Admin</option>
                        <option value="manager">Manager</option>
                        <option value="member">Member</option>
                      </select>
                      <select value={member.designation || ''} onChange={e => handleDesignationChange(member.id, e.target.value)} className={`${smSelectCls} max-w-[130px]`}>
                        <option value="">No designation</option>
                        {DESIGNATIONS.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                      <button onClick={() => handleRemoveMember(member.id, member.name)}
                        className="p-1.5 text-red-500/70 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md transition-colors active:scale-90" title="Remove">
                        <UserMinus size={14} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        );

      case 'Channels':
        return (
          <div className="flex flex-col gap-4 mt-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500 dark:text-gray-400">{teamChannels.length} channel{teamChannels.length === 1 ? '' : 's'}</p>
              <button
                onClick={() => setShowCreateChannel(true)}
                className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium shadow-sm transition-colors active:scale-95"
              >
                <Plus size={14} /> New channel
              </button>
            </div>
            {teamChannels.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
                <Hash size={40} className="text-slate-300 dark:text-gray-700 mb-3" />
                <p className="text-slate-700 dark:text-gray-400 font-medium mb-1">No channels yet</p>
                <p className="text-slate-500 dark:text-gray-600 text-sm mb-4">Create a channel to start discussions</p>
                <button onClick={() => setShowCreateChannel(true)} className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition-colors active:scale-95">Create channel</button>
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                {teamChannels.map(ch => (
                  <button key={ch._id} onClick={() => { setActiveChannel(ch); navigate(`/dashboard/channel/${ch._id}`); }}
                    className="flex items-center gap-3 p-3 hover:bg-slate-100 dark:hover:bg-[#1c212b] rounded-lg transition-colors border border-transparent hover:border-slate-200 dark:hover:border-gray-800 text-left group w-full">
                    {ch.type === 'private' || ch.isPrivate ? <Lock size={16} className="text-slate-400 dark:text-gray-500" /> : <Hash size={16} className="text-slate-400 dark:text-gray-500" />}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-800 dark:text-gray-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-300">{ch.name}</p>
                      <p className="text-xs text-slate-500 dark:text-gray-600">{ch.type === 'private' ? 'Private' : 'Public'} channel</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        );

      case 'Activity':
        return (
          <div className="flex flex-col gap-1 mt-4">
            {activityLabeled.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
                <svg className="w-10 h-10 text-slate-300 dark:text-gray-700 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <p className="text-slate-700 dark:text-gray-400 font-medium mb-1">No activity yet</p>
                <p className="text-slate-500 dark:text-gray-600 text-sm">Activity will appear here as the team works</p>
              </div>
            ) : (
              activityLabeled.map((item, i) => (
                <div key={item._id || i} className={`relative pl-6 py-3 ${i < activityLabeled.length - 1 ? 'border-l-2 border-slate-200 dark:border-gray-800 ml-[7px]' : 'ml-[7px]'}`}>
                  <span className="absolute -left-[9px] top-4 w-4 h-4 rounded-full bg-indigo-100 dark:bg-indigo-500/20 border border-indigo-300 dark:border-indigo-500/50 flex items-center justify-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 dark:bg-indigo-400"></span>
                  </span>
                  <p className="text-sm font-medium text-slate-800 dark:text-gray-200">{item.action}</p>
                  <p className="text-xs text-slate-500 dark:text-gray-500 mt-0.5">{item.userId?.name || 'System'} &middot; {item._rel}</p>
                </div>
              ))
            )}
          </div>
        );

      default: return null;
    }
  };

  return (
    <div className="flex-1 bg-[#f5f6f8] dark:bg-[#0d1117] flex overflow-hidden font-sans transition-colors duration-200">
      <div className="flex-1 flex flex-col min-w-0 border-r border-slate-200 dark:border-gray-800 overflow-y-auto relative">
        <div className="h-40 bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/40 dark:to-purple-900/20 shrink-0"></div>
        <div className="px-8 flex flex-col pb-12 relative -mt-12">
          <div className="flex items-end justify-between mb-6">
            <div className="flex items-end gap-4">
              <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-3xl font-bold text-white shadow-xl ring-4 ring-[#f5f6f8] dark:ring-[#0d1117]">
                {teamName.charAt(0).toUpperCase()}
              </div>
              <div className="mb-2">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{teamName}</h1>
                <p className="text-xs text-slate-500 dark:text-gray-500 mt-1">{members.length} members &middot; {teamChannels.length} channels</p>
              </div>
            </div>
            <div className="flex gap-2 mb-2">
              <button onClick={() => setShowInviteModal(true)} className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm flex items-center gap-2 transition-colors active:scale-95"><Mail size={16} /> Invite</button>
              <button className="p-2 bg-slate-200 dark:bg-gray-800 hover:bg-slate-300 dark:hover:bg-gray-700 text-slate-700 dark:text-gray-300 rounded-lg transition-colors active:scale-90"><Settings size={18} /></button>
            </div>
          </div>

          <div className="flex border-b border-slate-200 dark:border-gray-800 gap-6 mt-2 mb-4 shrink-0">
            {['Members', 'Channels', 'Activity'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`py-3 text-sm font-medium transition-colors relative ${activeTab === tab ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-gray-500 hover:text-slate-800 dark:hover:text-gray-300'}`}>
                {tab}
                {tab === 'Members' && <span className="ml-1.5 text-xs text-slate-400 dark:text-gray-600">{members.length}</span>}
                {tab === 'Channels' && <span className="ml-1.5 text-xs text-slate-400 dark:text-gray-600">{teamChannels.length}</span>}
                {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-indigo-500 rounded-t-full"></div>}
              </button>
            ))}
          </div>

          <div key={activeTab} className="flex-1 animate-fade-in">{renderTabContent()}</div>
        </div>
      </div>

      {/* Right Activity Feed */}
      <div className="w-80 bg-white dark:bg-[#0e1116] border-l border-slate-200 dark:border-transparent hidden xl:flex flex-col shrink-0 transition-colors duration-200">
        <div className="h-14 border-b border-slate-200 dark:border-gray-800 flex items-center px-6">
          <h3 className="font-semibold text-slate-900 dark:text-gray-200">Team Activity</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-1">
          {activityLabeled.length === 0 ? (
            <p className="text-slate-500 dark:text-gray-600 text-sm text-center mt-8">No activity yet</p>
          ) : activityLabeled.slice(0, 15).map((item, i) => (
            <div key={item._id || i} className={`relative pl-6 py-3 ${i < Math.min(activityLabeled.length, 15) - 1 ? 'border-l-2 border-slate-200 dark:border-gray-800 ml-[7px]' : 'ml-[7px]'}`}>
              <span className="absolute -left-[9px] top-4 w-4 h-4 rounded-full bg-indigo-100 dark:bg-indigo-500/20 border border-indigo-300 dark:border-indigo-500/50 flex items-center justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 dark:bg-indigo-400"></span>
              </span>
              <p className="text-sm font-medium text-slate-800 dark:text-gray-200">{item.action}</p>
              <p className="text-xs text-slate-500 dark:text-gray-500 mt-0.5">{item._rel}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Create Channel Modal */}
      <Modal isOpen={showCreateChannel} onClose={() => setShowCreateChannel(false)} title="Create Channel">
        <CreateChannelForm
          teams={teams}
          defaultTeamId={teamId}
          lockTeam
          onCancel={() => setShowCreateChannel(false)}
          onCreated={(channel) => {
            setShowCreateChannel(false);
            setActiveChannel(channel);
            navigate(`/dashboard/channel/${channel._id}`);
          }}
        />
      </Modal>

      {/* Invite Modal */}
      <Modal isOpen={showInviteModal} onClose={() => setShowInviteModal(false)} title="Invite to Team">
        <form onSubmit={handleInvite} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5">Email Address</label>
            <input type="email" autoFocus value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
              className={`w-full ${inputCls} py-2.5`}
              placeholder="colleague@company.com" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5">System Role</label>
              <select value={inviteRole} onChange={e => setInviteRole(e.target.value)}
                className={`w-full ${inputCls} py-2.5 text-sm`}>
                <option value="member">Member</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
              <p className="text-[10px] text-slate-500 dark:text-gray-600 mt-1">Controls permissions</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5">Designation</label>
              <select value={inviteDesignation} onChange={e => setInviteDesignation(e.target.value)}
                className={`w-full ${inputCls} py-2.5 text-sm`}>
                <option value="">Select...</option>
                {DESIGNATIONS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <p className="text-[10px] text-slate-500 dark:text-gray-600 mt-1">Job title / position</p>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-2">
            <button type="button" onClick={() => setShowInviteModal(false)} className="px-4 py-2 text-sm text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white transition-colors active:scale-95">Cancel</button>
            <button type="submit" disabled={!inviteEmail.trim() || inviting}
              className="px-5 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg disabled:opacity-50 flex items-center gap-1.5 shadow-sm transition-colors active:scale-95">
              <Mail size={14} /> {inviting ? 'Sending...' : 'Send Invite'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TeamDetails;
