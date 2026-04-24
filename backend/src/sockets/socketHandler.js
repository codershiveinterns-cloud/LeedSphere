import jwt from 'jsonwebtoken';
import Message from '../models/Message.js';
import DirectMessage from '../models/DirectMessage.js';
import Conversation from '../models/Conversation.js';
import User from '../models/User.js';

export const handleSockets = (io) => {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        if (user) socket.user = user;
      }
    } catch (err) { /* continue without auth */ }
    next();
  });

  io.on('connection', (socket) => {
    const userName = socket.user?.name || 'Anonymous';
    const userId = socket.user?._id;

    // Auto-join user's personal room for DM notifications
    if (userId) socket.join(`user_${userId}`);

    // ===== Channel Rooms =====
    socket.on('join_channel', (channelId) => {
      socket.join(channelId);
    });

    socket.on('leave_channel', (channelId) => {
      socket.leave(channelId);
    });

    // ===== Send Message (channel + thread) =====
    socket.on('send_message', async (data) => {
      try {
        const { channelId, content, threadId } = data;
        if (!channelId || !content) return;

        const newMessage = await Message.create({
          channelId,
          conversationId: channelId,
          senderId: userId || null,
          senderName: userName,
          content,
          threadId: threadId || null,
        });

        // Increment parent reply count
        if (threadId) {
          const parent = await Message.findByIdAndUpdate(threadId, { $inc: { replyCount: 1 } }, { new: true });
          // Broadcast updated parent to channel
          if (parent) {
            const populatedParent = await Message.findById(parent._id).populate('senderId', 'name avatar').populate('reactions.userId', 'name');
            io.to(channelId).emit('message_updated', populatedParent);
          }
        }

        const populated = await Message.findById(newMessage._id).populate('senderId', 'name avatar');

        io.to(channelId).emit('receive_message', populated);

        if (threadId) {
          io.to(channelId).emit('thread_reply', { threadId, message: populated });
        }
      } catch (error) {
        console.error('send_message error:', error.message);
      }
    });

    // ===== Edit Message =====
    socket.on('edit_message', async (data) => {
      try {
        const { messageId, content } = data;
        const message = await Message.findById(messageId);
        if (!message || (userId && message.senderId?.toString() !== userId.toString())) return;

        message.content = content;
        message.edited = true;
        await message.save();

        const populated = await Message.findById(messageId).populate('senderId', 'name avatar').populate('reactions.userId', 'name');
        const channelId = message.channelId.toString();
        io.to(channelId).emit('message_updated', populated);
      } catch (error) {
        console.error('edit_message error:', error.message);
      }
    });

    // ===== Delete Message =====
    socket.on('delete_message', async (data) => {
      try {
        const { messageId } = data;
        const message = await Message.findById(messageId);
        if (!message || (userId && message.senderId?.toString() !== userId.toString())) return;

        const channelId = message.channelId.toString();
        const threadId = message.threadId;

        await Message.findByIdAndDelete(messageId);
        await Message.deleteMany({ threadId: messageId });

        if (threadId) {
          await Message.findByIdAndUpdate(threadId, { $inc: { replyCount: -1 } });
        }

        io.to(channelId).emit('message_deleted', { messageId, channelId });
      } catch (error) {
        console.error('delete_message error:', error.message);
      }
    });

    // ===== Toggle Reaction =====
    socket.on('toggle_reaction', async (data) => {
      try {
        const { messageId, emoji } = data;
        if (!userId || !emoji) return;

        const message = await Message.findById(messageId);
        if (!message) return;

        const existingIndex = message.reactions.findIndex(
          r => r.userId.toString() === userId.toString() && r.emoji === emoji
        );

        if (existingIndex >= 0) {
          message.reactions.splice(existingIndex, 1);
        } else {
          message.reactions.push({ userId, emoji });
        }
        await message.save();

        const populated = await Message.findById(messageId).populate('senderId', 'name avatar').populate('reactions.userId', 'name');
        const channelId = message.channelId.toString();
        io.to(channelId).emit('message_updated', populated);
      } catch (error) {
        console.error('toggle_reaction error:', error.message);
      }
    });

    // ===== DM Rooms =====
    socket.on('join_conversation', (conversationId) => {
      socket.join(`dm_${conversationId}`);
    });

    // ===== Send DM (persisted) =====
    socket.on('send_dm', async (data) => {
      try {
        const { conversationId, text } = data;
        if (!conversationId || !text || !userId) return;

        const dm = await DirectMessage.create({
          conversationId,
          senderId: userId,
          text,
        });

        await Conversation.findByIdAndUpdate(conversationId, {
          lastMessage: text,
          lastMessageAt: new Date(),
        });

        const populated = await DirectMessage.findById(dm._id).populate('senderId', 'name avatar');
        io.to(`dm_${conversationId}`).emit('receive_dm', populated);
      } catch (error) {
        console.error('send_dm error:', error.message);
      }
    });

    // ===== Typing Indicators =====
    socket.on('user_typing', ({ channelId }) => {
      socket.to(channelId).emit('user_typing', { senderName: userName });
    });

    socket.on('user_stop_typing', ({ channelId }) => {
      socket.to(channelId).emit('user_stop_typing', { senderName: userName });
    });

    // ===== Presence =====
    socket.on('go_online', () => {
      if (userId) socket.broadcast.emit('user_online', { userId, name: userName });
    });

    socket.on('disconnect', () => {
      if (userId) socket.broadcast.emit('user_offline', { userId });
    });
  });
};
