import Conversation from '../models/Conversation.js';
import DirectMessage from '../models/DirectMessage.js';

// POST /api/conversations
export const createConversation = async (req, res) => {
  try {
    const { recipientId } = req.body;
    if (!recipientId) return res.status(400).json({ message: 'recipientId is required' });

    const members = [req.user._id, recipientId].sort();

    // Check if conversation already exists
    const existing = await Conversation.findOne({
      members: { $all: members, $size: 2 },
    });
    if (existing) {
      const populated = await Conversation.findById(existing._id).populate('members', 'name email avatar');
      return res.json(populated);
    }

    const conversation = await Conversation.create({ members });
    const populated = await Conversation.findById(conversation._id).populate('members', 'name email avatar');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/conversations
export const getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({ members: req.user._id })
      .populate('members', 'name email avatar')
      .sort({ lastMessageAt: -1 });
    res.json(conversations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/conversations/:id/messages
export const sendDirectMessage = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: 'text is required' });

    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) return res.status(404).json({ message: 'Conversation not found' });

    const dm = await DirectMessage.create({
      conversationId: req.params.id,
      senderId: req.user._id,
      text,
    });

    conversation.lastMessage = text;
    conversation.lastMessageAt = new Date();
    await conversation.save();

    const populated = await DirectMessage.findById(dm._id).populate('senderId', 'name avatar');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/conversations/:id/messages
export const getDirectMessages = async (req, res) => {
  try {
    const messages = await DirectMessage.find({ conversationId: req.params.id })
      .populate('senderId', 'name avatar')
      .sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
