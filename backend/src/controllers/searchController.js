import Team from '../models/Team.js';
import Channel from '../models/Channel.js';
import Message from '../models/Message.js';
import Note from '../models/Note.js';
import User from '../models/User.js';

const escapeRegex = (s = '') => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// GET /api/search?q=...&workspaceId=...
// Returns { teams, channels, messages, notes, users } — 5 per category.
export const globalSearch = async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    const workspaceId = req.query.workspaceId || null;

    if (q.length < 1) {
      return res.json({ teams: [], channels: [], messages: [], notes: [], users: [] });
    }

    const regex = new RegExp(escapeRegex(q), 'i');
    const limit = 5;

    // Resolve workspace-scoped teams / channels first — messages and notes pivot through them.
    const workspaceTeamIds = workspaceId
      ? await Team.find({ workspaceId }).distinct('_id')
      : [];
    const workspaceChannelIds = workspaceId
      ? await Channel.find({ workspaceId }).distinct('_id')
      : [];

    const teamFilter = workspaceId
      ? { workspaceId, name: regex }
      : { name: regex };

    const channelFilter = workspaceId
      ? { workspaceId, name: regex }
      : { name: regex };

    const messageFilter = workspaceId
      ? { channelId: { $in: workspaceChannelIds }, content: regex, threadId: null }
      : { content: regex, threadId: null };

    const noteFilter = workspaceId
      ? { teamId: { $in: workspaceTeamIds }, title: regex }
      : { title: regex };

    const userFilter = { $or: [{ name: regex }, { email: regex }] };

    const [teams, channels, messages, notes, users] = await Promise.all([
      Team.find(teamFilter)
        .select('name description workspaceId')
        .limit(limit)
        .lean(),

      Channel.find(channelFilter)
        .select('name type isPrivate teamId workspaceId')
        .populate('teamId', 'name')
        .limit(limit)
        .lean(),

      Message.find(messageFilter)
        .select('content senderName senderId channelId createdAt')
        .populate('channelId', 'name')
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean(),

      Note.find(noteFilter)
        .select('title teamId parentId updatedAt')
        .sort({ updatedAt: -1 })
        .limit(limit)
        .lean(),

      User.find(userFilter)
        .select('name email avatar')
        .limit(limit)
        .lean(),
    ]);

    res.json({ teams, channels, messages, notes, users });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
