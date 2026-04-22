import { create } from 'zustand';
import api from '../services/api';

// Mock data generators
const mockMembers = [
  { id: 'u1', name: 'Sarah Chen', avatar: 'https://i.pravatar.cc/150?u=sarah', role: 'admin', status: 'online', title: 'Engineering Lead' },
  { id: 'u2', name: 'John Miller', avatar: 'https://i.pravatar.cc/150?u=john', role: 'member', status: 'online', title: 'Fullstack Engineer' },
  { id: 'u3', name: 'Alice Park', avatar: 'https://i.pravatar.cc/150?u=alice', role: 'member', status: 'idle', title: 'Frontend Developer' },
  { id: 'u4', name: 'Bob Wilson', avatar: 'https://i.pravatar.cc/150?u=bob', role: 'member', status: 'offline', title: 'Backend Engineer' },
  { id: 'u5', name: 'Diana Ross', avatar: 'https://i.pravatar.cc/150?u=diana', role: 'admin', status: 'online', title: 'Product Manager' },
];

const mockFiles = [
  { id: 'f1', name: 'Architecture_Diagram.png', type: 'image', size: '2.4 MB', uploadedBy: 'Alice Park', uploadedAt: '2 days ago' },
  { id: 'f2', name: 'Q3_Planning.pdf', type: 'document', size: '1.1 MB', uploadedBy: 'Sarah Chen', uploadedAt: '3 days ago' },
  { id: 'f3', name: 'API_Spec_v2.md', type: 'document', size: '340 KB', uploadedBy: 'Bob Wilson', uploadedAt: '5 days ago' },
  { id: 'f4', name: 'Dashboard_Mockup.png', type: 'image', size: '3.8 MB', uploadedBy: 'Diana Ross', uploadedAt: '1 week ago' },
  { id: 'f5', name: 'Sprint_Retro_Notes.pdf', type: 'document', size: '520 KB', uploadedBy: 'John Miller', uploadedAt: '1 week ago' },
  { id: 'f6', name: 'Logo_Final.svg', type: 'image', size: '180 KB', uploadedBy: 'Alice Park', uploadedAt: '2 weeks ago' },
];

const useAppStore = create((set, get) => ({
  workspaces: [],
  activeWorkspace: null,
  channels: [],
  activeChannel: null,
  messages: [],

  // UI & SaaS Extensions
  starredTeams: [],
  recentItems: [],
  uiStates: {
    isGlobalPlusOpen: false,
    isNotificationsOpen: false,
  },

  // Frontend-only Teams Mock State
  teams: [],
  activeTeam: null,

  // Per-team data maps: { [teamId]: [...] }
  teamMembers: {},
  teamChannels: {},
  teamActivity: {},
  teamFiles: {},
  teamPinnedNotes: {},

  // Notifications
  notifications: [
    { id: 'n1', text: 'Sarah Chen updated the Engineering team', type: 'team', read: false, timestamp: Date.now() - 7200000, icon: 'team' },
    { id: 'n2', text: '@John mentioned you in #general', type: 'mention', read: false, timestamp: Date.now() - 14400000, icon: 'mention' },
    { id: 'n3', text: 'New task assigned: Review PR #42', type: 'task', read: false, timestamp: Date.now() - 28800000, icon: 'task' },
    { id: 'n4', text: 'Alice shared Architecture_Diagram.png', type: 'team', read: true, timestamp: Date.now() - 86400000, icon: 'team' },
    { id: 'n5', text: 'Sprint planning meeting in 30 min', type: 'task', read: true, timestamp: Date.now() - 172800000, icon: 'task' },
  ],

  // Workspaces
  fetchWorkspaces: async () => {
    try {
      const res = await api.get('/workspaces');
      set({ workspaces: res.data });
      if (res.data.length > 0 && !get().activeWorkspace) {
        get().setActiveWorkspace(res.data[0]);
      }
    } catch (err) {
      console.error(err);
    }
  },

  createWorkspace: async (name) => {
    try {
      const res = await api.post('/workspaces', { name });
      set((state) => ({ workspaces: [...state.workspaces, res.data] }));
      get().setActiveWorkspace(res.data);
    } catch (err) {
      console.error(err);
    }
  },

  setActiveWorkspace: (workspace) => {
    if (!workspace) {
      set({ activeWorkspace: null, activeChannel: null, messages: [] });
      return;
    }
    set({ activeWorkspace: workspace, activeChannel: null, messages: [] });
    if (workspace._id) {
      get().fetchChannels(workspace._id);
    }
  },

  // Channels
  fetchChannels: async (workspaceId) => {
    try {
      const res = await api.get(`/channels/${workspaceId}`);
      set({ channels: res.data });
      if (res.data.length > 0) {
        get().setActiveChannel(res.data[0]);
      }
    } catch (err) {
      console.error(err);
    }
  },

  createChannel: async (workspaceId, name, isPrivate = false) => {
    try {
      const res = await api.post('/channels', { workspaceId, name, isPrivate });
      set((state) => ({ channels: [...state.channels, res.data] }));
      get().setActiveChannel(res.data);
    } catch (err) {
      console.error(err);
    }
  },

  setActiveChannel: (channel) => {
    set({ activeChannel: channel || null, messages: [] });
    // Only fetch from API for backend channels (have _id, not id)
    const channelId = channel?._id;
    if (channelId && !channelId.startsWith('ch_')) {
      get().fetchMessages(channelId);
    }
    // Track in recent items
    if (channel) {
      const chId = channel._id || channel.id;
      const chName = channel.name;
      if (chId && chName) {
        get().addRecentItem({ id: chId, type: 'channel', name: `#${chName}` });
      }
    }
  },

  // Messages
  fetchMessages: async (channelId) => {
    try {
      const res = await api.get(`/messages/${channelId}`);
      set({ messages: res.data });
    } catch (err) {
      console.error(err);
    }
  },

  addMessage: (message) => {
    set((state) => {
      const activeId = state.activeChannel?._id || state.activeChannel?.id;
      const msgTarget = message.conversationId || message.channelId;
      if (activeId && msgTarget === activeId) {
        return { messages: [...state.messages, message] };
      }
      // For local messages with no conversationId, just add
      if (!msgTarget && state.activeChannel) {
        return { messages: [...state.messages, message] };
      }
      return state;
    });
  },

  // SaaS Extension Actions
  toggleStarredTeam: (teamId) => {
    set((state) => {
      const isStarred = state.starredTeams.includes(teamId);
      return {
        starredTeams: isStarred
          ? state.starredTeams.filter(id => id !== teamId)
          : [...state.starredTeams, teamId]
      };
    });
  },

  addRecentItem: (item) => {
    set((state) => {
      const filtered = state.recentItems.filter(i => i.id !== item.id);
      return { recentItems: [item, ...filtered].slice(0, 5) };
    });
  },

  setUiState: (key, value) => {
    set((state) => ({ uiStates: { ...state.uiStates, [key]: value } }));
  },

  // ===== Local Teams Methods =====
  addTeam: (team) => {
    if (!team || !team._id || !team.name) {
      console.warn("[Store] addTeam called with invalid team:", team);
      return;
    }
    // Seed default members, channels, activity, files, pinned notes for the new team
    const seedMembers = mockMembers.map(m => ({ ...m, id: `${m.id}_${team._id}` }));
    const seedChannels = [
      { id: `ch_general_${team._id}`, _id: `ch_general_${team._id}`, name: 'general', type: 'public' },
      { id: `ch_random_${team._id}`, _id: `ch_random_${team._id}`, name: 'random', type: 'public' },
      { id: `ch_private_${team._id}`, _id: `ch_private_${team._id}`, name: 'leadership', type: 'private' },
    ];
    const now = Date.now();
    const seedActivity = [
      { id: `act1_${team._id}`, text: `Team "${team.name}" was created`, user: 'System', timestamp: now, color: 'indigo' },
      { id: `act2_${team._id}`, text: 'Sarah Chen joined the team', user: 'Sarah Chen', timestamp: now - 60000, color: 'emerald' },
      { id: `act3_${team._id}`, text: 'Channel #general was created', user: 'System', timestamp: now - 120000, color: 'blue' },
    ];
    const seedPinnedNotes = [
      { id: `pin1_${team._id}`, text: 'Review the new Q3 Guidelines before pushing code to staging.' },
    ];

    set((state) => ({
      teams: [...(Array.isArray(state.teams) ? state.teams : []), { ...team, members: seedMembers }],
      teamMembers: { ...state.teamMembers, [team._id]: seedMembers },
      teamChannels: { ...state.teamChannels, [team._id]: seedChannels },
      teamActivity: { ...state.teamActivity, [team._id]: seedActivity },
      teamFiles: { ...state.teamFiles, [team._id]: [...mockFiles] },
      teamPinnedNotes: { ...state.teamPinnedNotes, [team._id]: seedPinnedNotes },
    }));
  },

  setActiveTeam: (team) => {
    set({ activeTeam: team || null });
    // Track in recent items
    if (team?._id) {
      get().addRecentItem({ id: team._id, type: 'team', name: team.name });
    }
  },

  removeTeam: (teamId) => {
    set((state) => {
      const { [teamId]: _m, ...restMembers } = state.teamMembers;
      const { [teamId]: _c, ...restChannels } = state.teamChannels;
      const { [teamId]: _a, ...restActivity } = state.teamActivity;
      const { [teamId]: _f, ...restFiles } = state.teamFiles;
      const { [teamId]: _p, ...restPinned } = state.teamPinnedNotes;
      return {
        teams: state.teams.filter(t => t._id !== teamId),
        activeTeam: state.activeTeam?._id === teamId ? null : state.activeTeam,
        starredTeams: state.starredTeams.filter(id => id !== teamId),
        teamMembers: restMembers,
        teamChannels: restChannels,
        teamActivity: restActivity,
        teamFiles: restFiles,
        teamPinnedNotes: restPinned,
      };
    });
  },

  // ===== Team Members =====
  getTeamMembers: (teamId) => {
    return get().teamMembers[teamId] || [];
  },

  addTeamMember: (teamId, member) => {
    set((state) => {
      const existing = state.teamMembers[teamId] || [];
      const newActivity = {
        id: `act_${Date.now()}`,
        text: `${member.name} joined the team`,
        user: member.name,
        timestamp: Date.now(),
        color: 'emerald',
      };
      const teamAct = state.teamActivity[teamId] || [];
      return {
        teamMembers: { ...state.teamMembers, [teamId]: [...existing, member] },
        teamActivity: { ...state.teamActivity, [teamId]: [newActivity, ...teamAct] },
      };
    });
  },

  removeTeamMember: (teamId, memberId) => {
    set((state) => {
      const existing = state.teamMembers[teamId] || [];
      const removed = existing.find(m => m.id === memberId);
      const newActivity = removed ? {
        id: `act_${Date.now()}`,
        text: `${removed.name} was removed from the team`,
        user: 'System',
        timestamp: Date.now(),
        color: 'red',
      } : null;
      const teamAct = state.teamActivity[teamId] || [];
      return {
        teamMembers: { ...state.teamMembers, [teamId]: existing.filter(m => m.id !== memberId) },
        teamActivity: newActivity ? { ...state.teamActivity, [teamId]: [newActivity, ...teamAct] } : state.teamActivity,
      };
    });
  },

  updateMemberRole: (teamId, memberId, newRole) => {
    set((state) => {
      const existing = state.teamMembers[teamId] || [];
      const member = existing.find(m => m.id === memberId);
      const newActivity = member ? {
        id: `act_${Date.now()}`,
        text: `${member.name}'s role changed to ${newRole}`,
        user: 'System',
        timestamp: Date.now(),
        color: 'indigo',
      } : null;
      const teamAct = state.teamActivity[teamId] || [];
      return {
        teamMembers: {
          ...state.teamMembers,
          [teamId]: existing.map(m => m.id === memberId ? { ...m, role: newRole } : m),
        },
        teamActivity: newActivity ? { ...state.teamActivity, [teamId]: [newActivity, ...teamAct] } : state.teamActivity,
      };
    });
  },

  // ===== Team Channels =====
  getTeamChannels: (teamId) => {
    return get().teamChannels[teamId] || [];
  },

  getAllTeamChannels: () => {
    const state = get();
    return Object.entries(state.teamChannels || {}).flatMap(([teamId, chs]) =>
      (chs || []).map(ch => ({ ...ch, _id: ch._id || ch.id, teamId }))
    );
  },

  findChannelById: (channelId) => {
    const state = get();
    for (const [teamId, chs] of Object.entries(state.teamChannels || {})) {
      const found = (chs || []).find(ch => (ch._id || ch.id) === channelId);
      if (found) return { ...found, _id: found._id || found.id, teamId };
    }
    return null;
  },

  addTeamChannel: (teamId, channel) => {
    // Normalize: ensure both id and _id exist
    const normalized = { ...channel, _id: channel._id || channel.id, id: channel.id || channel._id };
    set((state) => {
      const existing = state.teamChannels[teamId] || [];
      const newActivity = {
        id: `act_${Date.now()}`,
        text: `Channel #${normalized.name} was created`,
        user: 'System',
        timestamp: Date.now(),
        color: 'blue',
      };
      const teamAct = state.teamActivity[teamId] || [];
      return {
        teamChannels: { ...state.teamChannels, [teamId]: [...existing, normalized] },
        teamActivity: { ...state.teamActivity, [teamId]: [newActivity, ...teamAct] },
      };
    });
  },

  // ===== Team Activity =====
  getTeamActivity: (teamId) => {
    return get().teamActivity[teamId] || [];
  },

  addTeamActivity: (teamId, activity) => {
    set((state) => {
      const existing = state.teamActivity[teamId] || [];
      return {
        teamActivity: { ...state.teamActivity, [teamId]: [activity, ...existing] },
      };
    });
  },

  // ===== Team Files =====
  getTeamFiles: (teamId) => {
    return get().teamFiles[teamId] || [];
  },

  addTeamFile: (teamId, file) => {
    set((state) => {
      const existing = state.teamFiles[teamId] || [];
      const newActivity = {
        id: `act_${Date.now()}`,
        text: `${file.uploadedBy} uploaded ${file.name}`,
        user: file.uploadedBy,
        timestamp: Date.now(),
        color: 'purple',
      };
      const teamAct = state.teamActivity[teamId] || [];
      return {
        teamFiles: { ...state.teamFiles, [teamId]: [file, ...existing] },
        teamActivity: { ...state.teamActivity, [teamId]: [newActivity, ...teamAct] },
      };
    });
  },

  // ===== Pinned Notes =====
  getTeamPinnedNotes: (teamId) => {
    return get().teamPinnedNotes[teamId] || [];
  },

  addPinnedNote: (teamId, note) => {
    set((state) => {
      const existing = state.teamPinnedNotes[teamId] || [];
      return {
        teamPinnedNotes: { ...state.teamPinnedNotes, [teamId]: [...existing, note] },
      };
    });
  },

  removePinnedNote: (teamId, noteId) => {
    set((state) => {
      const existing = state.teamPinnedNotes[teamId] || [];
      return {
        teamPinnedNotes: { ...state.teamPinnedNotes, [teamId]: existing.filter(n => n.id !== noteId) },
      };
    });
  },

  // ===== Notifications =====
  markNotificationRead: (notifId) => {
    set((state) => ({
      notifications: state.notifications.map(n => n.id === notifId ? { ...n, read: true } : n),
    }));
  },

  markAllNotificationsRead: () => {
    set((state) => ({
      notifications: state.notifications.map(n => ({ ...n, read: true })),
    }));
  },

  addNotification: (notif) => {
    set((state) => ({
      notifications: [notif, ...state.notifications],
    }));
  },

  getUnreadCount: () => {
    return get().notifications.filter(n => !n.read).length;
  },

  // ===== Search =====
  searchAll: (query) => {
    if (!query.trim()) return { teams: [], channels: [], members: [] };
    const q = query.toLowerCase();
    const state = get();
    const matchedTeams = (state.teams || []).filter(t => t.name.toLowerCase().includes(q));
    // Flatten all team channels
    const allChannels = Object.entries(state.teamChannels || {}).flatMap(([teamId, chs]) =>
      (chs || []).map(ch => ({ ...ch, teamId }))
    );
    const matchedChannels = allChannels.filter(c => c.name.toLowerCase().includes(q));
    // Flatten all team members
    const allMembers = Object.entries(state.teamMembers || {}).flatMap(([teamId, ms]) =>
      (ms || []).map(m => ({ ...m, teamId }))
    );
    const matchedMembers = allMembers.filter(m => m.name.toLowerCase().includes(q));
    return { teams: matchedTeams.slice(0, 5), channels: matchedChannels.slice(0, 5), members: matchedMembers.slice(0, 5) };
  },

  // ===== Reorder Teams =====
  reorderTeams: (newOrder) => {
    set({ teams: newOrder });
  },
}));

export default useAppStore;
