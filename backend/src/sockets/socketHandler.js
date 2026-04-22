import jwt from 'jsonwebtoken';
import Message from '../models/Message.js';
import User from '../models/User.js';

export const handleSockets = (io) => {
  // Optional auth middleware for sockets
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        if (user) {
          socket.user = user;
        }
      }
    } catch (err) {
      // Continue without auth — backward compatible
    }
    next();
  });

  io.on('connection', (socket) => {
    const userName = socket.user?.name || 'Anonymous';
    console.log(`User connected: ${socket.id} (${userName})`);

    // Join a channel room
    socket.on('join_channel', (channelId) => {
      socket.join(channelId);
      console.log(`${userName} joined channel: ${channelId}`);
    });

    // Join a DM conversation room
    socket.on('join_conversation', (conversationId) => {
      socket.join(`dm_${conversationId}`);
    });

    // Handle sending a message
    socket.on('send_message', async (data) => {
      try {
        const { channelId, senderName, content, threadId } = data;

        const newMessage = await Message.create({
          channelId,
          conversationId: channelId,
          senderId: socket.user?._id || null,
          senderName: socket.user?.name || senderName,
          content,
          threadId: threadId || null,
        });

        const populated = await Message.findById(newMessage._id).populate('senderId', 'name avatar');

        // Broadcast to everyone in the room
        io.to(channelId).emit('receive_message', populated);

        // If it's a thread reply, also emit a thread update event
        if (threadId) {
          io.to(channelId).emit('thread_update', { threadId, message: populated });
        }
      } catch (error) {
        console.error('Error saving message via socket:', error.message);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle DM messages
    socket.on('send_dm', async (data) => {
      try {
        const { conversationId, text } = data;
        const room = `dm_${conversationId}`;
        io.to(room).emit('receive_dm', {
          conversationId,
          senderId: socket.user?._id,
          senderName: socket.user?.name || 'Anonymous',
          text,
          createdAt: new Date(),
        });
      } catch (error) {
        console.error('Error sending DM via socket:', error.message);
      }
    });

    // Typing indicators
    socket.on('user_typing', ({ channelId, senderName }) => {
      socket.to(channelId).emit('user_typing', { senderName: socket.user?.name || senderName });
    });

    socket.on('user_stop_typing', ({ channelId, senderName }) => {
      socket.to(channelId).emit('user_stop_typing', { senderName: socket.user?.name || senderName });
    });

    // Online presence
    socket.on('go_online', () => {
      if (socket.user) {
        socket.broadcast.emit('user_online', { userId: socket.user._id, name: socket.user.name });
      }
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id} (${userName})`);
      if (socket.user) {
        socket.broadcast.emit('user_offline', { userId: socket.user._id });
      }
    });
  });
};
