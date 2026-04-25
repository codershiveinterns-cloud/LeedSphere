import Channel from '../models/Channel.js';
import Team from '../models/Team.js';
import Activity from '../models/Activity.js';

/* ---------- helpers ---------- */

// Returns { isMember, role } for the given user in the team.
// role is 'admin' | 'manager' | 'member' | null.
const getTeamMembership = (team, userId) => {
  if (!team?.members) return { isMember: false, role: null };
  const uid = String(userId);
  const m = team.members.find((mem) => String(mem.userId) === uid);
  return m ? { isMember: true, role: m.role } : { isMember: false, role: null };
};

// Users that can see this channel:
//   public  → any team member
//   private → only entries in channel.members
const canAccessChannel = (channel, team, userId) => {
  const { isMember } = getTeamMembership(team, userId);
  if (!isMember) return false;
  if (!channel.isPrivate && channel.type !== 'private') return true;
  return (channel.members || []).some((id) => String(id) === String(userId));
};

const sanitizePrivateMembers = (memberIds, team) => {
  if (!Array.isArray(memberIds)) return [];
  const teamUserIds = new Set((team.members || []).map((m) => String(m.userId)));
  const unique = [...new Set(memberIds.map(String))].filter((id) => teamUserIds.has(id));
  return unique;
};

/* ---------- controllers ---------- */

// POST /api/channels  |  POST /api/channels/create
// body: { teamId, workspaceId, name, type, members? }
export const createChannel = async (req, res) => {
  try {
    const { teamId, workspaceId, name, type, isPrivate, members } = req.body;
    if (!name?.trim() || !teamId || !workspaceId) {
      return res.status(400).json({ message: 'name, teamId, and workspaceId are required' });
    }

    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ message: 'Team not found' });

    const { isMember } = getTeamMembership(team, req.user._id);
    if (!isMember) return res.status(403).json({ message: 'You must be a team member to create a channel' });

    const privateFlag = type === 'private' || isPrivate === true;
    const resolvedType = privateFlag ? 'private' : 'public';

    // Build members array: creator always included; other IDs must belong to the team.
    let channelMembers = [];
    if (privateFlag) {
      const cleaned = sanitizePrivateMembers(members, team);
      // Ensure creator is always in private channel
      if (!cleaned.includes(String(req.user._id))) cleaned.push(String(req.user._id));
      channelMembers = cleaned;
    }

    const channel = await Channel.create({
      name: name.trim(),
      teamId,
      workspaceId,
      type: resolvedType,
      isPrivate: privateFlag,
      members: channelMembers,
      createdBy: req.user._id,
    });

    await Activity.create({
      userId: req.user._id,
      action: `Created ${resolvedType} channel #${channel.name}`,
      teamId,
    });

    res.status(201).json(channel);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/channels/team/:teamId
// Returns channels visible to the requesting user:
//   - all public channels in the team
//   - private channels where the user is a member
export const getChannelsByTeam = async (req, res) => {
  try {
    const { teamId } = req.params;
    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ message: 'Team not found' });

    const { isMember } = getTeamMembership(team, req.user._id);
    if (!isMember) return res.status(403).json({ message: 'Not a member of this team' });

    const channels = await Channel.find({ teamId })
      .select('name teamId workspaceId type isPrivate members createdBy createdAt')
      .lean();

    const uid = String(req.user._id);
    const visible = channels.filter((c) => {
      if (!c.isPrivate && c.type !== 'private') return true;
      return (c.members || []).some((id) => String(id) === uid);
    });

    res.json(visible);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/channels/:workspaceId  (backward-compat)
// Returns channels visible to the caller within the workspace:
//   - public channels in teams the user belongs to
//   - private channels where the user is in members[]
export const getChannelsByWorkspace = async (req, res) => {
  try {
    const me = req.user._id;
    const myTeamIds = await Team.find({
      workspaceId: req.params.workspaceId,
      'members.userId': me,
    }).distinct('_id');

    const channels = await Channel.find({
      workspaceId: req.params.workspaceId,
      teamId: { $in: myTeamIds },
      $or: [
        { isPrivate: false, type: { $ne: 'private' } },
        { members: me },
      ],
    }).lean();

    res.json(channels);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/channels/:id/members
// Returns populated members for private channels, or all team members for public.
export const getChannelMembers = async (req, res) => {
  try {
    const channel = await Channel.findById(req.params.id)
      .populate('members', 'name email avatar')
      .populate('createdBy', 'name email avatar');
    if (!channel) return res.status(404).json({ message: 'Channel not found' });

    const team = await Team.findById(channel.teamId).populate('members.userId', 'name email avatar');
    if (!team) return res.status(404).json({ message: 'Team not found' });

    if (!canAccessChannel(channel, team, req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to view this channel' });
    }

    // Public: surface all team members as "members"
    const members = channel.isPrivate
      ? channel.members
      : team.members
          .filter((m) => m.userId)
          .map((m) => ({ _id: m.userId._id, name: m.userId.name, email: m.userId.email, avatar: m.userId.avatar }));

    res.json({
      _id: channel._id,
      name: channel.name,
      type: channel.type,
      isPrivate: channel.isPrivate,
      teamId: channel.teamId,
      createdBy: channel.createdBy,
      members,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/channels/join  { channelId }
// Public channels only (private requires an existing member action).
export const joinChannel = async (req, res) => {
  try {
    const { channelId } = req.body;
    if (!channelId) return res.status(400).json({ message: 'channelId required' });

    const channel = await Channel.findById(channelId);
    if (!channel) return res.status(404).json({ message: 'Channel not found' });

    if (channel.isPrivate || channel.type === 'private') {
      return res.status(403).json({ message: 'Cannot join a private channel without an invite' });
    }

    const team = await Team.findById(channel.teamId);
    if (!team) return res.status(404).json({ message: 'Team not found' });

    const { isMember } = getTeamMembership(team, req.user._id);
    if (!isMember) return res.status(403).json({ message: 'Join the team first' });

    // Public channels grant implicit access — no mutation needed.
    res.json({ ok: true, channelId: channel._id, message: 'Joined' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/channels/leave  { channelId }
export const leaveChannel = async (req, res) => {
  try {
    const { channelId } = req.body;
    if (!channelId) return res.status(400).json({ message: 'channelId required' });

    const channel = await Channel.findById(channelId);
    if (!channel) return res.status(404).json({ message: 'Channel not found' });

    if (String(channel.createdBy) === String(req.user._id)) {
      return res.status(400).json({ message: 'Creators cannot leave their own channel — delete it or transfer ownership instead' });
    }

    if (!channel.isPrivate && channel.type !== 'private') {
      // Public: nothing to remove (no persisted membership). No-op success.
      return res.json({ ok: true, message: 'Left public channel' });
    }

    const uid = String(req.user._id);
    const before = channel.members.length;
    channel.members = channel.members.filter((id) => String(id) !== uid);
    if (channel.members.length === before) {
      return res.status(400).json({ message: 'You are not a member of this channel' });
    }
    await channel.save();

    res.json({ ok: true, message: 'Left channel', channelId: channel._id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/channels/:id
// Allowed when: requester is the channel creator OR a team admin.
export const deleteChannel = async (req, res) => {
  try {
    const channel = await Channel.findById(req.params.id);
    if (!channel) return res.status(404).json({ message: 'Channel not found' });

    const team = await Team.findById(channel.teamId);
    if (!team) return res.status(404).json({ message: 'Team not found' });

    const { role } = getTeamMembership(team, req.user._id);
    const isCreator = String(channel.createdBy) === String(req.user._id);
    const isTeamAdmin = role === 'admin';

    if (!isCreator && !isTeamAdmin) {
      return res.status(403).json({ message: 'Only the creator or a team admin can delete this channel' });
    }

    await Channel.findByIdAndDelete(req.params.id);

    await Activity.create({
      userId: req.user._id,
      action: `Deleted channel #${channel.name}`,
      teamId: channel.teamId,
    });

    res.json({ message: 'Channel deleted', channelId: channel._id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
