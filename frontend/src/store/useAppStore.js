import { create } from 'zustand';
import api from '../services/api';

const useAppStore = create((set, get) => ({
  workspaces: [],
  activeWorkspace: null,
  channels: [],
  activeChannel: null,
  messages: [],

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
    set({ activeWorkspace: workspace, activeChannel: null, messages: [] });
    get().fetchChannels(workspace._id);
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
    set({ activeChannel: channel });
    get().fetchMessages(channel._id);
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
      if (state.activeChannel && message.conversationId === state.activeChannel._id) {
         return { messages: [...state.messages, message] };
      }
      return state;
    });
  }
}));

export default useAppStore;
