import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Channel', required: true },
  senderName: { type: String, required: true },
  content: { type: String, required: true },
}, { timestamps: true });

const Message = mongoose.model('Message', messageSchema);
export default Message;
