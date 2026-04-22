import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema({
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  }],
  lastMessage: { type: String, default: '' },
  lastMessageAt: { type: Date, default: Date.now },
}, { timestamps: true });

// Ensure only one conversation between two users
conversationSchema.index({ members: 1 });

export default mongoose.model('Conversation', conversationSchema);
