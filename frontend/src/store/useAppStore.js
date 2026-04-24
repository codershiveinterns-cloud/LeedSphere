import { create } from 'zustand';
import api from '../services/api';

const useAppStore = create((set, get) => ({
  // ===== Workspaces =====
  workspaces: [],
  activeWorkspace: null,

  // ===== Teams =====
  teams: [],
  activeTeam: null,

  // ===== Channels (per-team) =====
  activeChannel: null,
  messages: [],
  teamChannels: {}, // { [teamId]: [...channels] }

  // ===== Members (per-team from API populated data) =====
  // Not stored separately — comes from team.members populated

  // ===== Activity =====
  teamActivity: {},

  // ===== Notifications =====
  notifications: [],

  // ===== UI State =====
  starredTeams: JSON.parse(localStorage.getItem('starredTeams') || '[]'),
  recentItems: JSON.parse(localStorage.getItem('recentItems') || '[]'),
  uiStates: {
    isGlobalPlusOpen: false,
    isNotificationsOpen: false,
  },

  _fetchingWorkspaces: false,

  // =====================
  // WORKSPACE ACTIONS
  // =====================
  fetchWorkspaces: async () => {
    // Prevent duplicate concurrent fetches
    if (get()._fetchingWorkspaces) return;
    set({ _fetchingWorkspaces: true });
    try {
      const res = await api.get('/workspaces');
      const workspaces = res.data || [];
      set({ workspaces });
      // Auto-select first workspace ONLY if none is active
      if (workspaces.length > 0 && !get().activeWorkspace) {
        get().setActiveWorkspace(workspaces[0]);
      }
    } catch (err) {
      console.error('fetchWorkspaces:', err.message);
      set({ workspaces: [] });
    } finally {
      set({ _fetchingWorkspaces: false });
    }
  },

  createWorkspace: async (name) => {
    try {
      const res = await api.post('/workspaces', { name });
      set((state) => ({ workspaces: [...state.workspaces, res.data] }));
      get().setActiveWorkspace(res.data);
      return res.data;
    } catch (err) {
      console.error('createWorkspace:', err.message);
      throw err;
    }
  },

  setActiveWorkspace: (workspace) => {
    if (!workspace) {
      set({ activeWorkspace: null, activeChannel: null, messages: [], teams: [], teamChannels: {} });
      return;
    }
    // Don't re-fetch if same workspace is already active
    if (get().activeWorkspace?._id === workspace._id) return;
    set({ activeWorkspace: workspace, activeChannel: null, messages: [], teams: [], teamChannels: {} });
    get().fetchTeams(workspace._id);
  },

  // =====================
  // TEAM ACTIONS (API-driven)
  // =====================
  fetchTeams: async (workspaceId) => {
    try {
      const res = await api.get(`/teams/${workspaceId}`);
      set({ teams: res.data || [] });
      // Also fetch channels for each team
      for (const team of (res.data || [])) {
        get().fetchTeamChannels(team._id);
      }
    } catch (err) {
      console.error('fetchTeams:', err.message);
      set({ teams: [] });
    }
  },

  createTeam: async (workspaceId, name) => {
    try {
      const res = await api.post('/teams', { workspaceId, name });
      set((state) => ({ teams: [...state.teams, res.data] }));
      return res.data;
    } catch (err) {
      console.error('createTeam:', err.message);
      throw err;
    }
  },

  deleteTeam: async (teamId) => {
    try {
      await api.delete(`/teams/${teamId}`);
      set((state) => ({
        teams: state.teams.filter(t => t._id !== teamId),
        activeTeam: state.activeTeam?._id === teamId ? null : state.activeTeam,
        starredTeams: state.starredTeams.filter(id => id !== teamId),
      }));
    } catch (err) {
      console.error('deleteTeam:', err.message);
      throw err;
    }
  },

  mergeTeams: async (targetTeamId, sourceTeamId) => {
    try {
      const res = await api.post('/teams/merge', { targetTeamId, sourceTeamId });
      // Refetch teams
      const ws = get().activeWorkspace;
      if (ws) get().fetchTeams(ws._id);
      return res.data;
    } catch (err) {
      console.error('mergeTeams:', err.message);
      throw err;
    }
  },

  setActiveTeam: (team) => {
    set({ activeTeam: team || null });
    if (team?._id) {
      get().addRecentItem({ id: team._id, type: 'team', name: team.name });
      get().fetchTeamChannels(team._id);
      get().fetchTeamActivity(team._id);
    }
  },

  getTeamById: async (teamId) => {
    try {
      const res = await api.get(`/teams/detail/${teamId}`);
      return res.data;
    } catch (err) {
      console.error('getTeamById:', err.message);
      return null;
    }
  },

  // ===== Team Members (from populated team data) =====
  getTeamMembers: (teamId) => {
    const team = get().teams.find(t => t._id === teamId);
    if (!team?.members) return [];
    return team.members.map(m => ({
      id: m.userId?._id || m.userId,
      name: m.userId?.name || 'Unknown',
      email: m.userId?.email || '',
      avatar: m.userId?.avatar || `https://i.pravatar.cc/150?u=${m.userId?._id || m.userId}`,
      role: m.role,
      designation: m.designation || '',
      status: 'online',
    }));
  },

  addTeamMember: async (teamId, userId, role = 'member', designation = '') => {
    try {
      const res = await api.post(`/teams/${teamId}/members`, { userId, role, designation });
      set((state) => ({
        teams: state.teams.map(t => t._id === teamId ? res.data : t),
      }));
      return res.data;
    } catch (err) {
      console.error('addTeamMember:', err.message);
      throw err;
    }
  },

  updateTeamMember: async (teamId, userId, data) => {
    try {
      const res = await api.put(`/teams/${teamId}/members/${userId}`, data);
      set((state) => ({
        teams: state.teams.map(t => t._id === teamId ? res.data : t),
      }));
      return res.data;
    } catch (err) {
      console.error('updateTeamMember:', err.message);
      throw err;
    }
  },

  removeTeamMember: async (teamId, userId) => {
    try {
      const res = await api.delete(`/teams/${teamId}/members/${userId}`);
      set((state) => ({
        teams: state.teams.map(t => t._id === teamId ? res.data : t),
      }));
    } catch (err) {
      console.error('removeTeamMember:', err.message);
      throw err;
    }
  },

  // ===== Invites =====
  pendingInvites: [],

  fetchPendingInvites: async () => {
    try {
      const res = await api.get('/invites/pending');
      set({ pendingInvites: res.data || [] });
    } catch (err) {
      console.error('fetchPendingInvites:', err.message);
    }
  },

  sendInvite: async (teamId, email, role, designation) => {
    try {
      const res = await api.post('/invites', { teamId, email, role, designation });
      return res.data;
    } catch (err) {
      console.error('sendInvite:', err.message);
      throw err;
    }
  },

  acceptInvite: async (inviteId) => {
    try {
      const res = await api.post(`/invites/${inviteId}/accept`);
      set((state) => ({
        pendingInvites: state.pendingInvites.filter(i => i._id !== inviteId),
      }));
      // Refetch teams to show the newly joined team
      const ws = get().activeWorkspace;
      if (ws) get().fetchTeams(ws._id);
      return res.data;
    } catch (err) {
      console.error('acceptInvite:', err.message);
      throw err;
    }
  },

  declineInvite: async (inviteId) => {
    try {
      await api.post(`/invites/${inviteId}/decline`);
      set((state) => ({
        pendingInvites: state.pendingInvites.filter(i => i._id !== inviteId),
      }));
    } catch (err) {
      console.error('declineInvite:', err.message);
      throw err;
    }
  },

  // =====================
  // CHANNEL ACTIONS (API-driven)
  // =====================
  fetchTeamChannels: async (teamId) => {
    try {
      const res = await api.get(`/channels/team/${teamId}`);
      set((state) => ({
        teamChannels: { ...state.teamChannels, [teamId]: res.data || [] },
      }));
    } catch (err) {
      console.error('fetchTeamChannels:', err.message);
    }
  },

  getTeamChannels: (teamId) => {
    return get().teamChannels[teamId] || [];
  },

  createTeamChannel: async (teamId, workspaceId, name, type = 'public', members = []) => {
    try {
      const res = await api.post('/channels', {
        teamId,
        workspaceId,
        name,
        type,
        isPrivate: type === 'private',
        members: type === 'private' ? members : [],
      });
      set((state) => {
        const existing = state.teamChannels[teamId] || [];
        return { teamChannels: { ...state.teamChannels, [teamId]: [...existing, res.data] } };
      });
      return res.data;
    } catch (err) {
      console.error('createTeamChannel:', err.message);
      throw err;
    }
  },

  fetchChannelMembers: async (channelId) => {
    try {
      const res = await api.get(`/channels/${channelId}/members`);
      return res.data;
    } catch (err) {
      console.error('fetchChannelMembers:', err.message);
      throw err;
    }
  },

  joinChannel: async (channelId) => {
    try {
      await api.post('/channels/join', { channelId });
      return true;
    } catch (err) {
      console.error('joinChannel:', err.message);
      throw err;
    }
  },

  leaveChannel: async (channelId, teamId) => {
    try {
      await api.post('/channels/leave', { channelId });
      if (teamId) {
        set((state) => ({
          teamChannels: {
            ...state.teamChannels,
            [teamId]: (state.teamChannels[teamId] || []).filter((c) => c._id !== channelId),
          },
        }));
      }
      return true;
    } catch (err) {
      console.error('leaveChannel:', err.message);
      throw err;
    }
  },

  deleteChannel: async (channelId, teamId) => {
    try {
      await api.delete(`/channels/${channelId}`);
      if (teamId) {
        set((state) => ({
          teamChannels: {
            ...state.teamChannels,
            [teamId]: (state.teamChannels[teamId] || []).filter((c) => c._id !== channelId),
          },
        }));
      }
      return true;
    } catch (err) {
      console.error('deleteChannel:', err.message);
      throw err;
    }
  },

  getAllTeamChannels: () => {
    const state = get();
    return Object.entries(state.teamChannels || {}).flatMap(([teamId, chs]) =>
      (chs || []).map(ch => ({ ...ch, teamId }))
    );
  },

  findChannelById: (channelId) => {
    const state = get();
    for (const [teamId, chs] of Object.entries(state.teamChannels || {})) {
      const found = (chs || []).find(ch => ch._id === channelId);
      if (found) return { ...found, teamId };
    }
    return null;
  },

  setActiveChannel: (channel) => {
    set({ activeChannel: channel || null, messages: [] });
    if (channel?._id) {
      get().fetchMessages(channel._id);
      get().addRecentItem({ id: channel._id, type: 'channel', name: `#${channel.name}` });
    }
  },

  // =====================
  // MESSAGE ACTIONS
  // =====================
  fetchMessages: async (channelId) => {
    try {
      const res = await api.get(`/messages/${channelId}`);
      set({ messages: res.data || [] });
    } catch (err) {
      console.error('fetchMessages:', err.message);
      set({ messages: [] });
    }
  },

  addMessage: (message) => {
    set((state) => {
      const activeId = state.activeChannel?._id;
      const msgTarget = message.channelId || message.conversationId;
      if (activeId && (msgTarget === activeId || msgTarget?.toString() === activeId)) {
        const exists = state.messages.some(m => m._id === message._id);
        if (exists) return state;
        return { messages: [...state.messages, message] };
      }
      return state;
    });
  },

  updateMessage: (updatedMsg) => {
    set((state) => ({
      messages: state.messages.map(m => m._id === updatedMsg._id ? updatedMsg : m),
    }));
  },

  removeMessage: (messageId) => {
    set((state) => ({
      messages: state.messages.filter(m => m._id !== messageId),
    }));
  },

  // ===== Threads =====
  activeThread: null,
  threadReplies: [],

  openThread: async (message) => {
    set({ activeThread: message, threadReplies: [] });
    try {
      const res = await api.get(`/messages/thread/${message._id}`);
      set({ threadReplies: res.data?.replies || [] });
    } catch (err) {
      console.error('openThread:', err.message);
    }
  },

  closeThread: () => {
    set({ activeThread: null, threadReplies: [] });
  },

  addThreadReply: (reply) => {
    set((state) => {
      if (state.activeThread?._id !== reply.threadId) return state;
      const exists = state.threadReplies.some(r => r._id === reply._id);
      if (exists) return state;
      return { threadReplies: [...state.threadReplies, reply] };
    });
  },

  // ===== DM Conversations =====
  conversations: [],
  activeConversation: null,
  dmMessages: [],

  fetchConversations: async () => {
    try {
      const res = await api.get('/conversations');
      set({ conversations: res.data || [] });
    } catch (err) {
      console.error('fetchConversations:', err.message);
    }
  },

  setActiveConversation: (conv) => {
    set({ activeConversation: conv || null, dmMessages: [] });
    if (conv?._id) get().fetchDmMessages(conv._id);
  },

  fetchDmMessages: async (conversationId) => {
    try {
      const res = await api.get(`/conversations/${conversationId}/messages`);
      set({ dmMessages: res.data || [] });
    } catch (err) {
      console.error('fetchDmMessages:', err.message);
    }
  },

  addDmMessage: (message) => {
    set((state) => {
      if (state.activeConversation?._id !== message.conversationId) return state;
      const exists = state.dmMessages.some(m => m._id === message._id);
      if (exists) return state;
      return { dmMessages: [...state.dmMessages, message] };
    });
  },

  // =====================
  // NOTES (API-driven)
  // =====================
  notes: [],
  activeNote: null,

  fetchNotes: async (teamId) => {
    try {
      const res = await api.get(`/notes/team/${teamId}`);
      set({ notes: res.data || [] });
    } catch (err) {
      console.error('fetchNotes:', err.message);
    }
  },

  createNote: async (teamId, title, parentId = null) => {
    try {
      const res = await api.post('/notes', { teamId, title: title || 'Untitled', parentId });
      set((state) => ({ notes: [res.data, ...state.notes] }));
      return res.data;
    } catch (err) {
      console.error('createNote:', err.message);
      throw err;
    }
  },

  updateNote: async (noteId, data) => {
    try {
      const res = await api.put(`/notes/${noteId}`, data);
      set((state) => ({
        notes: state.notes.map(n => n._id === noteId ? res.data : n),
        activeNote: state.activeNote?._id === noteId ? res.data : state.activeNote,
      }));
      return res.data;
    } catch (err) {
      console.error('updateNote:', err.message);
      throw err;
    }
  },

  deleteNote: async (noteId) => {
    try {
      await api.delete(`/notes/${noteId}`);
      set((state) => ({
        notes: state.notes.filter(n => n._id !== noteId && n.parentId !== noteId),
        activeNote: state.activeNote?._id === noteId ? null : state.activeNote,
      }));
    } catch (err) {
      console.error('deleteNote:', err.message);
      throw err;
    }
  },

  setActiveNote: (note) => {
    set({ activeNote: note || null });
  },

  fetchNoteById: async (noteId) => {
    try {
      const res = await api.get(`/notes/detail/${noteId}`);
      set({ activeNote: res.data });
      return res.data;
    } catch (err) {
      console.error('fetchNoteById:', err.message);
      return null;
    }
  },

  // =====================
  // ACTIVITY (API-driven)
  // =====================
  fetchTeamActivity: async (teamId) => {
    try {
      const res = await api.get(`/activity/${teamId}`);
      set((state) => ({
        teamActivity: { ...state.teamActivity, [teamId]: res.data || [] },
      }));
    } catch (err) {
      console.error('fetchTeamActivity:', err.message);
    }
  },

  getTeamActivity: (teamId) => {
    return get().teamActivity[teamId] || [];
  },

  // =====================
  // NOTIFICATIONS (API-driven)
  // =====================
  fetchNotifications: async () => {
    try {
      const res = await api.get('/notifications');
      set({ notifications: res.data || [] });
    } catch (err) {
      console.error('fetchNotifications:', err.message);
    }
  },

  markNotificationRead: async (notifId) => {
    try {
      await api.put(`/notifications/${notifId}/read`);
      set((state) => ({
        notifications: state.notifications.map(n =>
          n._id === notifId ? { ...n, read: true } : n
        ),
      }));
    } catch (err) {
      console.error('markNotificationRead:', err.message);
    }
  },

  markAllNotificationsRead: async () => {
    try {
      await api.put('/notifications/read-all');
      set((state) => ({
        notifications: state.notifications.map(n => ({ ...n, read: true })),
      }));
    } catch (err) {
      console.error('markAllNotificationsRead:', err.message);
    }
  },

  getUnreadCount: () => {
    return get().notifications.filter(n => !n.read).length;
  },

  // =====================
  // UI HELPERS (local only)
  // =====================
  toggleStarredTeam: (teamId) => {
    set((state) => {
      const isStarred = state.starredTeams.includes(teamId);
      const next = isStarred
        ? state.starredTeams.filter(id => id !== teamId)
        : [...state.starredTeams, teamId];
      localStorage.setItem('starredTeams', JSON.stringify(next));
      return { starredTeams: next };
    });
  },

  addRecentItem: (item) => {
    set((state) => {
      const filtered = state.recentItems.filter(i => i.id !== item.id);
      const next = [item, ...filtered].slice(0, 5);
      localStorage.setItem('recentItems', JSON.stringify(next));
      return { recentItems: next };
    });
  },

  setUiState: (key, value) => {
    set((state) => ({ uiStates: { ...state.uiStates, [key]: value } }));
  },

  reorderTeams: (newOrder) => {
    set({ teams: newOrder });
  },

  // ===== Search (searches local cache) =====
  searchAll: (query) => {
    if (!query.trim()) return { teams: [], channels: [], members: [] };
    const q = query.toLowerCase();
    const state = get();
    const matchedTeams = (state.teams || []).filter(t => t.name?.toLowerCase().includes(q));
    const allChannels = Object.entries(state.teamChannels || {}).flatMap(([teamId, chs]) =>
      (chs || []).map(ch => ({ ...ch, teamId }))
    );
    const matchedChannels = allChannels.filter(c => c.name?.toLowerCase().includes(q));
    // Search members across all teams
    const allMembers = (state.teams || []).flatMap(t =>
      (t.members || []).map(m => ({
        id: m.userId?._id || m.userId,
        name: m.userId?.name || 'Unknown',
        avatar: m.userId?.avatar || `https://i.pravatar.cc/150?u=${m.userId?._id}`,
        title: m.role,
        teamId: t._id,
      }))
    );
    const matchedMembers = allMembers.filter(m => m.name?.toLowerCase().includes(q));
    return { teams: matchedTeams.slice(0, 5), channels: matchedChannels.slice(0, 5), members: matchedMembers.slice(0, 5) };
  },
}));

export default useAppStore;
