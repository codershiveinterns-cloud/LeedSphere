import mongoose from 'mongoose';

const channelSchema = new mongoose.Schema({
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
  name: { type: String, required: true },
  isPrivate: { type: Boolean, default: false },
}, { timestamps: true });

const Channel = mongoose.model('Channel', channelSchema);
export default Channel;
