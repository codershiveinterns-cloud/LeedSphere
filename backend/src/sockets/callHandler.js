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
import { verifyFirebaseTokenAndGetUser } from '../services/firebaseUser.js';
import { sendNotification, sendNotificationsToMany } from '../services/notificationService.js';

/**
 * Track which channel calls are "ringing" — first joiner becomes the caller
 * and we ring everyone else for ~30s. If the second joiner accepts (joins
 * the call), the ring stops. Otherwise we mark missed-call for everyone we
 * rang. Keyed by channelId.
 *
 *   ringing: Map<channelId, { callerUserId, callerName, channelName, recipients: string[], timer }>
 */
const ringing = new Map();
const RING_TIMEOUT_MS = 30_000;

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
  // Track which rooms this socket is in so we can clean up on disconnect.
  const joinedChannels = new Set();

  const emitError = (message) => socket.emit('call:error', { message });

  /**
   * Resolve the caller's identity at EVENT TIME, not at connection time.
   *
   * The previous version captured `socket.user` once when the connection
   * handler ran — if the io.use middleware silently failed to verify the
   * token verification (expired token, race during page-load, etc.), `socket.user` was
   * never populated and every subsequent `call:join` emitted
   * "Not authenticated" for the lifetime of the connection.
   *
   * Reading the auth token from `socket.handshake.auth` per event lets us
   * recover from a bad initial handshake without forcing the client to
   * reconnect. Successful re-auth caches the user back onto the socket
   * so future events skip token verification.
   */
  const resolveCaller = async () => {
    if (socket.user) return socket.user;
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) return null;
    try {
      const { user } = await verifyFirebaseTokenAndGetUser(token);
      if (user) {
        socket.user = user;
        return user;
      }
    } catch (err) {
      console.warn('[call] socket re-auth failed:', err.message);
    }
    return null;
  };

  // -------- Join --------
  socket.on('call:join', async ({ channelId } = {}) => {
    try {
      if (!channelId) return emitError('channelId required');
      const user = await resolveCaller();
      if (!user) return emitError('Not authenticated');
      const userId = String(user._id);
      const name = user.name || 'Guest';
      const avatar = user.avatar || '';

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

      // First joiner is the caller — ring every channel member except them.
      const wasEmpty = room.size === 0;

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

      // -------- Incoming-call ring --------
      if (wasEmpty) {
        // Caller starting a fresh call. Compute recipients (channel members
        // minus the caller) and emit `incoming-call` + persist a `call`
        // notification each of them. After RING_TIMEOUT_MS, anyone who
        // hasn't joined → missed-call.
        try {
          const team = await Team.findById(channel.teamId).select('members');
          const teamMemberIds = (team?.members || []).map((m) => String(m.userId));
          const isPrivate = channel.isPrivate || channel.type === 'private';
          const allowed = isPrivate
            ? teamMemberIds.filter((id) => (channel.members || []).some((m) => String(m) === id))
            : teamMemberIds;
          const recipients = allowed.filter((id) => id !== userId);

          // Real-time ring (transient — not persisted; the call notification below is)
          for (const uid of recipients) {
            io.to(`user_${uid}`).emit('incoming-call', {
              channelId,
              channelName: channel.name,
              callerUserId: userId,
              callerName: name,
              callerAvatar: avatar,
              startedAt: Date.now(),
            });
          }

          // Persist a `call` notification (so the bell shows it even if the
          // user is offline / inactive).
          await sendNotificationsToMany(io, recipients, {
            type: 'call',
            content: `Incoming call from ${name} in #${channel.name}`,
            channelId,
            redirectUrl: `/dashboard/channel/${channelId}`,
            meta: { channelName: channel.name, fromUserId: userId, fromName: name },
          });

          // Schedule missed-call check.
          const prev = ringing.get(channelId);
          if (prev?.timer) clearTimeout(prev.timer);
          const timer = setTimeout(async () => {
            const stillThere = callRooms.get(channelId);
            // Filter: any recipient who never joined the call → missed.
            const joinedUserIds = new Set(
              [...(stillThere?.values() || [])].map((m) => String(m.userId))
            );
            const missed = recipients.filter((id) => !joinedUserIds.has(id));
            if (missed.length) {
              try {
                await sendNotificationsToMany(io, missed, {
                  type: 'missed-call',
                  content: `Missed call from ${name} in #${channel.name}`,
                  channelId,
                  redirectUrl: `/dashboard/channel/${channelId}`,
                  meta: { channelName: channel.name, fromUserId: userId, fromName: name },
                });
              } catch (e) { console.warn('[call] missed-call notify failed:', e.message); }
            }
            // Tell every recipient's UI to dismiss the ring modal.
            for (const uid of recipients) {
              io.to(`user_${uid}`).emit('call:ring-stopped', { channelId });
            }
            ringing.delete(channelId);
          }, RING_TIMEOUT_MS);

          ringing.set(channelId, { callerUserId: userId, callerName: name, channelName: channel.name, recipients, timer });
        } catch (notifyErr) {
          console.warn('[call] incoming-call notify failed:', notifyErr.message);
        }
      } else {
        // A second+ user joined — ring is answered. Cancel the missed-call
        // timer and tell everyone to stop ringing.
        const r = ringing.get(channelId);
        if (r) {
          clearTimeout(r.timer);
          for (const uid of r.recipients) {
            io.to(`user_${uid}`).emit('call:ring-stopped', { channelId });
          }
          ringing.delete(channelId);
        }
      }
    } catch (err) {
      emitError(err.message || 'Failed to join call');
    }
  });

  // Explicit reject — recipient declined the ring.
  socket.on('call:reject', async ({ channelId } = {}) => {
    if (!channelId) return;
    const user = await resolveCaller();
    if (!user) return;
    const userId = String(user._id);
    // Tell the caller (if still ringing) that this user rejected.
    const r = ringing.get(channelId);
    if (r) {
      io.to(`user_${r.callerUserId}`).emit('call:rejected', {
        channelId, byUserId: userId, byName: user.name || 'Guest',
      });
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
  // Look up the caller's identity from any room the socket has joined.
  // Falls back to socket.user (which may be set after re-auth) so the peer
  // tile renders something sensible even if room metadata is missing.
  const callerMeta = () => {
    for (const room of callRooms.values()) {
      const meta = room.get(socket.id);
      if (meta) return meta;
    }
    return socket.user
      ? { userId: String(socket.user._id), name: socket.user.name || 'Guest', avatar: socket.user.avatar || '' }
      : { userId: null, name: 'Guest', avatar: '' };
  };

  socket.on('call:offer', ({ toSocketId, offer } = {}) => {
    if (!toSocketId || !offer) return;
    const me = callerMeta();
    io.to(toSocketId).emit('call:offer', {
      fromSocketId: socket.id,
      fromUserId: me.userId,
      fromName: me.name,
      fromAvatar: me.avatar,
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
