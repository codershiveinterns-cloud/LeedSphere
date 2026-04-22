import Message from '../models/Message.js';

export const getMessagesByChannel = async (req, res) => {
  try {
    const messages = await Message.find({ conversationId: req.params.channelId }).sort({ createdAt: 1 });
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
