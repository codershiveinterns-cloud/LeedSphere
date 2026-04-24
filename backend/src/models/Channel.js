import mongoose from 'mongoose';

const channelSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
  type: { type: String, enum: ['public', 'private'], default: 'public' },
  isPrivate: { type: Boolean, default: false },
  // Members only matter for private channels (subset of the team). For public channels,
  // every team member has implicit access — we do not mirror the full team here.
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

channelSchema.index({ teamId: 1 });
channelSchema.index({ workspaceId: 1 });

export default mongoose.model('Channel', channelSchema);
