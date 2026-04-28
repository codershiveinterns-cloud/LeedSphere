/**
 * Single entry point for "create a notification, persist it, and push it
 * over socket". Used by the message, mention, call, task, event, and
 * channel-membership paths.
 *
 * Convention: every authenticated socket auto-joins `user_${userId}` (see
 * socketHandler.js). Sending to that room delivers the notification to
 * every device the user has open.
 */
import Notification from '../models/Notification.js';

/**
 * Pre-built redirect URL helpers — keep deep-link strings centralized so a
 * route rename only changes one file.
 */
export const buildRedirect = {
  channel:        (channelId)              => `/dashboard/channel/${channelId}`,
  message:        (channelId, messageId)   => `/dashboard/channel/${channelId}?message=${messageId}`,
  thread:         (channelId, threadId)    => `/dashboard/channel/${channelId}?thread=${threadId}`,
  project:        (projectId)              => `/dashboard/projects?project=${projectId}`,
  task:           (projectId, taskId)      => `/dashboard/projects?project=${projectId}&task=${taskId}`,
  calendar:       ()                       => `/dashboard/calendar`,
  event:          (eventId)                => `/dashboard/calendar?event=${eventId}`,
};

/**
 * Persist + push one notification.
 *
 *   io           — Socket.IO server instance
 *   userId       — recipient's Mongo _id (string or ObjectId)
 *   type         — see Notification model enum
 *   content      — human-readable summary, e.g. "Priya assigned you to a task"
 *   channelId    — optional ObjectId (chat / channel notifications)
 *   projectId    — optional ObjectId (task / project notifications)
 *   entityId     — optional messageId / taskId / eventId for deep-link highlighting
 *   redirectUrl  — explicit URL to navigate to on click; falls back to a
 *                  best-effort default based on channelId / projectId
 *   meta         — { fromUserId, fromName, channelName, preview, ... }
 *
 * Returns the persisted document. Failures are swallowed and logged so a
 * notification crash never takes down the originating action.
 */
export const sendNotification = async (io, payload) => {
  if (!io || !payload?.userId || !payload?.type || !payload?.content) return null;
  const {
    userId, type, content,
    channelId = null, projectId = null, entityId = null,
    redirectUrl: explicitRedirect,
    meta = {},
  } = payload;

  // Default deep-link inference. Caller can always override via redirectUrl.
  const redirectUrl =
    explicitRedirect ||
    (entityId && channelId ? buildRedirect.message(channelId, entityId) :
     channelId ? buildRedirect.channel(channelId) :
     entityId && projectId ? buildRedirect.task(projectId, entityId) :
     projectId ? buildRedirect.project(projectId) :
     '');

  try {
    const notif = await Notification.create({
      userId, type, content,
      channelId, projectId, entityId,
      redirectUrl,
      meta,
    });
    io?.to(`user_${userId}`).emit('receive-notification', notif.toJSON());
    return notif;
  } catch (err) {
    console.warn('[notify] create+emit failed:', err.message);
    return null;
  }
};

/**
 * Fan out the same notification to many recipients (e.g. every channel
 * member except the sender). Sequential to keep DB write order stable —
 * fast enough for typical channel sizes (< 1k).
 */
export const sendNotificationsToMany = async (io, recipientIds, payload) => {
  if (!Array.isArray(recipientIds) || !recipientIds.length) return [];
  const out = [];
  for (const uid of recipientIds) {
    if (!uid) continue;
    const n = await sendNotification(io, { ...payload, userId: uid });
    if (n) out.push(n);
  }
  return out;
};

/**
 * Lightweight, transient broadcast to every user in a channel except the
 * actor. Used for "user joined the channel" — we don't always want to
 * persist these. If `persist` is true, also writes to the DB.
 */
export const broadcastChannelEvent = async (io, channelMemberIds, actorId, payload, { persist = false } = {}) => {
  const recipients = channelMemberIds.filter((id) => String(id) !== String(actorId));
  if (persist) {
    return sendNotificationsToMany(io, recipients, payload);
  }
  for (const uid of recipients) {
    io?.to(`user_${uid}`).emit('receive-notification', { ...payload, userId: uid, transient: true });
  }
  return [];
};
