import Channel from '../models/Channel.js';

export const createChannel = async (req, res) => {
  try {
    const { workspaceId, name, isPrivate } = req.body;
    const channel = await Channel.create({ workspaceId, name, isPrivate });
    res.status(201).json(channel);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getChannelsByWorkspace = async (req, res) => {
  try {
    const channels = await Channel.find({ workspaceId: req.params.workspaceId });
    res.status(200).json(channels);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
