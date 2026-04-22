import Message from '../models/Message.js';

export const handleSockets = (io) => {
  io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Join a channel room
    socket.on('join_channel', (channelId) => {
      socket.join(channelId);
      console.log(`User ${socket.id} joined channel: ${channelId}`);
    });

    // Handle sending a message
    socket.on('send_message', async (data) => {
      try {
        const { channelId, senderName, content } = data;

        // Save message to MongoDB
        const newMessage = await Message.create({
          conversationId: channelId,
          senderName,
          content,
        });

        // Broadcast to everyone in the room, including sender
        io.to(channelId).emit('receive_message', newMessage);

      } catch (error) {
        console.error('Error saving message via socket:', error.message);
      }
    });

    // Handle typing events
    socket.on('user_typing', ({ channelId, senderName }) => {
      socket.to(channelId).emit('user_typing', { senderName });
    });

    socket.on('user_stop_typing', ({ channelId, senderName }) => {
      socket.to(channelId).emit('user_stop_typing', { senderName });
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });
};
