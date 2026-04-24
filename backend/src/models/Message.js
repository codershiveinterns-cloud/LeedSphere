import mongoose from 'mongoose';

const reactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  emoji: { type: String, required: true },
}, { _id: false });

const messageSchema = new mongoose.Schema({
  channelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Channel', required: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  senderName: { type: String, required: true },
  content: { type: String, required: true },
  threadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Message', default: null },
  reactions: [reactionSchema],
  replyCount: { type: Number, default: 0 },
  attachments: [{ type: String }],
  edited: { type: Boolean, default: false },
  conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Channel' },
}, { timestamps: true });

messageSchema.index({ channelId: 1, createdAt: 1 });
messageSchema.index({ threadId: 1, createdAt: 1 });

messageSchema.pre('save', function () {
  if (this.channelId && !this.conversationId) this.conversationId = this.channelId;
  if (this.conversationId && !this.channelId) this.channelId = this.conversationId;
});

export default mongoose.model('Message', messageSchema);
