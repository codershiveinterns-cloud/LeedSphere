import mongoose from 'mongoose';

const directMessageSchema = new mongoose.Schema({
  conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
}, { timestamps: true });

directMessageSchema.index({ conversationId: 1, createdAt: 1 });

export default mongoose.model('DirectMessage', directMessageSchema);
