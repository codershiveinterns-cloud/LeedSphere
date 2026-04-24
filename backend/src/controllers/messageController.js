import Message from '../models/Message.js';

// POST /api/messages
export const sendMessage = async (req, res) => {
  try {
    const { channelId, content, threadId } = req.body;
    if (!channelId || !content) {
      return res.status(400).json({ message: 'channelId and content are required' });
    }

    const message = await Message.create({
      channelId,
      conversationId: channelId,
      senderId: req.user._id,
      senderName: req.user.name,
      content,
      threadId: threadId || null,
    });

    // Update parent's reply count if this is a thread reply
    if (threadId) {
      await Message.findByIdAndUpdate(threadId, { $inc: { replyCount: 1 } });
    }

    const populated = await Message.findById(message._id).populate('senderId', 'name avatar');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/messages/:channelId
export const getMessagesByChannel = async (req, res) => {
  try {
    const filter = {
      $or: [
        { channelId: req.params.channelId },
        { conversationId: req.params.channelId },
      ],
      threadId: null,
    };
    const messages = await Message.find(filter)
      .sort({ createdAt: 1 })
      .populate('senderId', 'name avatar')
      .populate('reactions.userId', 'name');
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/messages/thread/:messageId
export const getThreadReplies = async (req, res) => {
  try {
    // Return parent message + replies
    const parent = await Message.findById(req.params.messageId)
      .populate('senderId', 'name avatar')
      .populate('reactions.userId', 'name');
    const replies = await Message.find({ threadId: req.params.messageId })
      .sort({ createdAt: 1 })
      .populate('senderId', 'name avatar')
      .populate('reactions.userId', 'name');
    res.json({ parent, replies });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/messages/:id
export const editMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) return res.status(404).json({ message: 'Message not found' });
    if (message.senderId && message.senderId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only edit your own messages' });
    }

    message.content = req.body.content || message.content;
    message.edited = true;
    await message.save();

    const populated = await Message.findById(message._id)
      .populate('senderId', 'name avatar')
      .populate('reactions.userId', 'name');
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/messages/:id
export const deleteMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) return res.status(404).json({ message: 'Message not found' });
    if (message.senderId && message.senderId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only delete your own messages' });
    }

    const channelId = message.channelId;
    const threadId = message.threadId;
    await Message.findByIdAndDelete(req.params.id);
    await Message.deleteMany({ threadId: req.params.id });

    // Decrement parent reply count if this was a thread reply
    if (threadId) {
      await Message.findByIdAndUpdate(threadId, { $inc: { replyCount: -1 } });
    }

    res.json({ message: 'Message deleted', messageId: req.params.id, channelId });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/messages/:id/react
export const toggleReaction = async (req, res) => {
  try {
    const { emoji } = req.body;
    if (!emoji) return res.status(400).json({ message: 'emoji is required' });

    const message = await Message.findById(req.params.id);
    if (!message) return res.status(404).json({ message: 'Message not found' });

    const existingIndex = message.reactions.findIndex(
      r => r.userId.toString() === req.user._id.toString() && r.emoji === emoji
    );

    if (existingIndex >= 0) {
      // Remove reaction (toggle off)
      message.reactions.splice(existingIndex, 1);
    } else {
      // Add reaction
      message.reactions.push({ userId: req.user._id, emoji });
    }

    await message.save();

    const populated = await Message.findById(message._id)
      .populate('senderId', 'name avatar')
      .populate('reactions.userId', 'name');
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
