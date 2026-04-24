/**
 * WebRTC signaling + room state for channel-based calls.
 *
 * Room model: one "call room" per channel, identified by channelId.
 * Architecture: mesh. The server only relays signaling (offer/answer/ICE).
 *
 * Events (client → server):
 *   call:join         { channelId }
 *   call:leave        { channelId }
 *   call:offer        { toSocketId, offer }
 *   call:answer       { toSocketId, answer }
 *   call:ice-candidate{ toSocketId, candidate }
 *   call:query        { channelId }            (snapshot of participant count)
 *
 * Events (server → client):
 *   call:participants   { channelId, participants: [{socketId, userId, name, avatar}] }
 *                       sent to the joiner; their peer will receive offers from existing members
 *   call:user-joined    { channelId, socketId, userId, name, avatar }
 *                       broadcast to existing members so they can create an offer
 *   call:user-left      { channelId, socketId, userId }
 *   call:offer          { fromSocketId, fromUserId, fromName, offer }
 *   call:answer         { fromSocketId, answer }
 *   call:ice-candidate  { fromSocketId, candidate }
 *   call:room-state     { channelId, count }   (broadcast to channel chat room so
 *                                               non-participants see "call active")
 *   call:error          { message }
 */

import Channel from '../models/Channel.js';
import Team from '../models/Team.js';

// Module-level in-memory state. Keyed by channelId.
// callRooms: Map<channelId, Map<socketId, { userId, name, avatar }>>
const callRooms = new Map();

const callRoomKey = (channelId) => `call_${channelId}`;

const getRoom = (channelId) => {
  let room = callRooms.get(channelId);
  if (!room) {
    room = new Map();
    callRooms.set(channelId, room);
  }
  return room;
};

const broadcastRoomState = (io, channelId) => {
  const room = callRooms.get(channelId);
  const count = room ? room.size : 0;
  // Broadcast to the CHAT channel room so every member of that chat sees "call active".
  io.to(channelId).emit('call:room-state', { channelId, count });
};

const canAccessChannel = async (channel, userId) => {
  if (!channel) return false;
  const team = await Team.findById(channel.teamId);
  if (!team) return false;
  const uid = String(userId);
  const isTeamMember = (team.members || []).some((m) => String(m.userId) === uid);
  if (!isTeamMember) return false;
  if (channel.isPrivate || channel.type === 'private') {
    return (channel.members || []).some((id) => String(id) === uid);
  }
  return true;
};

export const registerCallHandlers = (io, socket) => {
  const userId = socket.user?._id ? String(socket.user._id) : null;
  const name = socket.user?.name || 'Anonymous';
  const avatar = socket.user?.avatar || '';

  // Track which rooms this socket is in so we can clean up on disconnect.
  const joinedChannels = new Set();

  const emitError = (message) => socket.emit('call:error', { message });

  // -------- Join --------
  socket.on('call:join', async ({ channelId } = {}) => {
    try {
      if (!channelId) return emitError('channelId required');
      if (!userId) return emitError('Not authenticated');

      const channel = await Channel.findById(channelId);
      if (!channel) return emitError('Channel not found');
      if (!(await canAccessChannel(channel, userId))) return emitError('Not authorized for this channel');

      const room = getRoom(channelId);

      // Existing participants BEFORE we add the joiner.
      const existing = [...room.entries()].map(([sid, meta]) => ({
        socketId: sid,
        userId: meta.userId,
        name: meta.name,
        avatar: meta.avatar,
      }));

      // Add joiner to room
      room.set(socket.id, { userId, name, avatar });
      joinedChannels.add(channelId);
      socket.join(callRoomKey(channelId));

      // Tell the joiner who's already here. Existing members will initiate offers
      // to the joiner upon receiving `call:user-joined` below.
      socket.emit('call:participants', { channelId, participants: existing });

      // Notify existing members that someone new arrived.
      socket.to(callRoomKey(channelId)).emit('call:user-joined', {
        channelId,
        socketId: socket.id,
        userId,
        name,
        avatar,
      });

      broadcastRoomState(io, channelId);
    } catch (err) {
      emitError(err.message || 'Failed to join call');
    }
  });

  // -------- Leave --------
  const leaveRoom = (channelId) => {
    const room = callRooms.get(channelId);
    if (!room) return;
    if (!room.has(socket.id)) return;
    const meta = room.get(socket.id);
    room.delete(socket.id);
    joinedChannels.delete(channelId);
    socket.leave(callRoomKey(channelId));

    // Notify remaining peers in the call room.
    io.to(callRoomKey(channelId)).emit('call:user-left', {
      channelId,
      socketId: socket.id,
      userId: meta?.userId || null,
    });

    if (room.size === 0) callRooms.delete(channelId);
    broadcastRoomState(io, channelId);
  };

  socket.on('call:leave', ({ channelId } = {}) => {
    if (channelId) leaveRoom(channelId);
  });

  // -------- Signaling relays --------
  socket.on('call:offer', ({ toSocketId, offer } = {}) => {
    if (!toSocketId || !offer) return;
    io.to(toSocketId).emit('call:offer', {
      fromSocketId: socket.id,
      fromUserId: userId,
      fromName: name,
      fromAvatar: avatar,
      offer,
    });
  });

  socket.on('call:answer', ({ toSocketId, answer } = {}) => {
    if (!toSocketId || !answer) return;
    io.to(toSocketId).emit('call:answer', {
      fromSocketId: socket.id,
      answer,
    });
  });

  socket.on('call:ice-candidate', ({ toSocketId, candidate } = {}) => {
    if (!toSocketId || !candidate) return;
    io.to(toSocketId).emit('call:ice-candidate', {
      fromSocketId: socket.id,
      candidate,
    });
  });

  // -------- Query current participant count (for UI indicator) --------
  socket.on('call:query', ({ channelId } = {}) => {
    const room = callRooms.get(channelId);
    socket.emit('call:room-state', {
      channelId,
      count: room ? room.size : 0,
    });
  });

  // -------- Cleanup on disconnect --------
  socket.on('disconnect', () => {
    for (const channelId of [...joinedChannels]) {
      leaveRoom(channelId);
    }
  });
};
