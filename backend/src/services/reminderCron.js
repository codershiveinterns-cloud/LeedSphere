/**
 * Background reminders for time-based notifications.
 *
 *   Tasks  — fire `task-due` to assignees when a due date is within the next
 *            60 minutes. Each task is reminded at most once per due-date
 *            value (tracked via in-memory dedupe + a `dueReminderSentAt`
 *            field on the document).
 *   Events — fire `event-reminder` to attendees 10–15 minutes before
 *            startDate. Same dedupe rule.
 *
 * Implemented as a single `setInterval` so we don't add a cron dependency.
 * Granularity is 60 seconds, which is the right balance between "the user
 * gets reminded close to the right time" and "we don't hammer Mongo".
 */
import Task from '../models/Task.js';
import Event from '../models/Event.js';
import { getIO } from '../sockets/io.js';
import { sendNotificationsToMany, buildRedirect } from './notificationService.js';

const INTERVAL_MS = 60_000;
const TASK_LOOKAHEAD_MS  = 60 * 60 * 1000;       // 60 min
const EVENT_LOOKAHEAD_MS = 15 * 60 * 1000;       // 15 min
const EVENT_LEAD_MS      = 10 * 60 * 1000;       // don't fire later than 10 min before start

// In-memory dedupe so a server within the same tick doesn't double-emit.
// Maps "<id>:<isoDueDate>" → timestamp last fired.
const recentlyNotified = new Map();
const NOTIFY_DEDUPE_MS = 30 * 60 * 1000; // 30 min

const wasRecentlyNotified = (key) => {
  const last = recentlyNotified.get(key);
  if (!last) return false;
  if (Date.now() - last > NOTIFY_DEDUPE_MS) {
    recentlyNotified.delete(key);
    return false;
  }
  return true;
};
const markNotified = (key) => recentlyNotified.set(key, Date.now());

const runTaskReminders = async () => {
  const io = getIO();
  if (!io) return;
  const now    = new Date();
  const cutoff = new Date(now.getTime() + TASK_LOOKAHEAD_MS);

  const tasks = await Task.find({
    dueDate: { $gte: now, $lte: cutoff },
    status:  { $ne: 'Done' },
    assignees: { $exists: true, $ne: [] },
  }).select('title status dueDate assignees projectId').lean();

  for (const t of tasks) {
    const key = `task:${t._id}:${new Date(t.dueDate).toISOString()}`;
    if (wasRecentlyNotified(key)) continue;
    markNotified(key);

    const recipients = (t.assignees || []).map(String).filter(Boolean);
    if (!recipients.length) continue;

    const minutes = Math.max(1, Math.round((new Date(t.dueDate) - now) / 60000));
    await sendNotificationsToMany(io, recipients, {
      type: 'task-due',
      content: `“${t.title}” is due in ${minutes} minute${minutes === 1 ? '' : 's'}`,
      projectId: t.projectId,
      entityId: t._id,
      redirectUrl: buildRedirect.task(t.projectId, t._id),
      meta: { taskTitle: t.title, dueDate: t.dueDate, priority: 'high' },
    });
  }
};

const runEventReminders = async () => {
  const io = getIO();
  if (!io) return;
  const now    = new Date();
  const cutoff = new Date(now.getTime() + EVENT_LOOKAHEAD_MS);
  const earliest = new Date(now.getTime() + EVENT_LEAD_MS);

  const events = await Event.find({
    startDate: { $gte: earliest, $lte: cutoff },
    assignedTo: { $exists: true, $ne: [] },
  }).select('title startDate assignedTo workspaceId').lean();

  for (const ev of events) {
    const key = `event:${ev._id}:${new Date(ev.startDate).toISOString()}`;
    if (wasRecentlyNotified(key)) continue;
    markNotified(key);

    const recipients = (ev.assignedTo || []).map(String).filter(Boolean);
    if (!recipients.length) continue;

    const minutes = Math.max(1, Math.round((new Date(ev.startDate) - now) / 60000));
    await sendNotificationsToMany(io, recipients, {
      type: 'event-reminder',
      content: `“${ev.title}” starts in ${minutes} minute${minutes === 1 ? '' : 's'}`,
      entityId: ev._id,
      redirectUrl: buildRedirect.event(ev._id),
      meta: { eventTitle: ev.title, startDate: ev.startDate, priority: 'high' },
    });
  }
};

let _started = false;
export const startReminderCrons = () => {
  if (_started) return;
  _started = true;
  // Run shortly after boot (skip the first interval so we don't blast on
  // startup if the server was just restarted), then every minute.
  setTimeout(() => {
    runTaskReminders().catch((e) => console.warn('[cron] task reminders:', e.message));
    runEventReminders().catch((e) => console.warn('[cron] event reminders:', e.message));
  }, 30_000);
  setInterval(() => {
    runTaskReminders().catch((e) => console.warn('[cron] task reminders:', e.message));
    runEventReminders().catch((e) => console.warn('[cron] event reminders:', e.message));
  }, INTERVAL_MS);
  console.log('[cron] reminder crons started (1-min interval)');
};
