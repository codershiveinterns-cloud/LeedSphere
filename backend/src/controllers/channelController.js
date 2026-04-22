import Channel from '../models/Channel.js';
import Activity from '../models/Activity.js';

// POST /api/channels
export const createChannel = async (req, res) => {
  try {
    const { teamId, workspaceId, name, type, isPrivate } = req.body;
    if (!name || !teamId || !workspaceId) {
      return res.status(400).json({ message: 'name, teamId, and workspaceId are required' });
    }

    const channel = await Channel.create({
      name,
      teamId,
      workspaceId,
      type: type || (isPrivate ? 'private' : 'public'),
      isPrivate: isPrivate || type === 'private',
      createdBy: req.user._id,
    });

    await Activity.create({
      userId: req.user._id,
      action: `Created channel #${name}`,
      teamId,
    });

    res.status(201).json(channel);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/channels/team/:teamId
export const getChannelsByTeam = async (req, res) => {
  try {
    const channels = await Channel.find({ teamId: req.params.teamId });
    res.json(channels);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/channels/:workspaceId (backward compat)
export const getChannelsByWorkspace = async (req, res) => {
  try {
    const channels = await Channel.find({ workspaceId: req.params.workspaceId });
    res.json(channels);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/channels/:id
export const deleteChannel = async (req, res) => {
  try {
    const channel = await Channel.findById(req.params.id);
    if (!channel) return res.status(404).json({ message: 'Channel not found' });
    await Channel.findByIdAndDelete(req.params.id);
    res.json({ message: 'Channel deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
