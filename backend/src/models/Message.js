import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  channelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Channel', required: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  senderName: { type: String, required: true },
  content: { type: String, required: true },
  threadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Message', default: null },
  attachments: [{ type: String }],
  edited: { type: Boolean, default: false },
  // Backward compat alias
  conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Channel' },
}, { timestamps: true });

messageSchema.index({ channelId: 1, createdAt: 1 });
messageSchema.index({ threadId: 1, createdAt: 1 });

// Sync conversationId <-> channelId for backward compatibility
messageSchema.pre('save', function () {
  if (this.channelId && !this.conversationId) this.conversationId = this.channelId;
  if (this.conversationId && !this.channelId) this.channelId = this.conversationId;
});

export default mongoose.model('Message', messageSchema);
