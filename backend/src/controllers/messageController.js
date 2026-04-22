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

    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/messages/:channelId
export const getMessagesByChannel = async (req, res) => {
  try {
    // Get top-level messages (not thread replies)
    const filter = {
      $or: [
        { channelId: req.params.channelId },
        { conversationId: req.params.channelId },
      ],
      threadId: null,
    };
    const messages = await Message.find(filter).sort({ createdAt: 1 }).populate('senderId', 'name avatar');
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/messages/thread/:messageId
export const getThreadReplies = async (req, res) => {
  try {
    const replies = await Message.find({ threadId: req.params.messageId }).sort({ createdAt: 1 }).populate('senderId', 'name avatar');
    res.json(replies);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/messages/:id
export const editMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) return res.status(404).json({ message: 'Message not found' });

    // Only sender can edit
    if (message.senderId && message.senderId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only edit your own messages' });
    }

    message.content = req.body.content || message.content;
    message.edited = true;
    await message.save();
    res.json(message);
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

    await Message.findByIdAndDelete(req.params.id);
    // Also delete thread replies
    await Message.deleteMany({ threadId: req.params.id });
    res.json({ message: 'Message deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
