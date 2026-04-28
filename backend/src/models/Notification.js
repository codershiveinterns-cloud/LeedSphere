import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  // Discriminator — drives icon, sound, priority on the frontend.
  //   message / mention / reply        — chat
  //   call / missed-call               — voice/video
  //   task / task-status / task-due    — projects
  //   event / event-reminder           — calendar
  //   channel-add / channel-remove     — membership changes
  //   invite / team / system           — legacy categories kept for backcompat
  type: {
    type: String,
    enum: [
      'message', 'mention', 'reply',
      'call', 'missed-call',
      'task', 'task-status', 'task-due',
      'event', 'event-reminder',
      'channel-add', 'channel-remove', 'channel-join',
      'invite', 'team', 'system',
    ],
    required: true,
  },
  content: { type: String, required: true },
  read: { type: Boolean, default: false },

  // Direct refs so the frontend can deep-link without parsing meta.
  channelId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Channel' },
  projectId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  entityId:    { type: mongoose.Schema.Types.ObjectId }, // messageId / taskId / eventId
  redirectUrl: { type: String, default: '' },             // /dashboard/channel/:id, etc.

  // Free-form additional context (sender name, preview, channel name, …).
  meta: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

export default mongoose.model('Notification', notificationSchema);
