import mongoose from 'mongoose';

const workspaceMemberSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  // Workspace-level role. Owner of the workspace + future workspace admins;
  // team-level roles still live on Team.members[]. We deliberately keep
  // these distinct so being an admin in Team A doesn't make you an admin of
  // the whole workspace.
  role: { type: String, enum: ['admin', 'member'], default: 'member' },
  joinedAt: { type: Date, default: Date.now },
}, { _id: false });

const workspaceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: { type: [workspaceMemberSchema], default: [] },
}, { timestamps: true });

workspaceSchema.index({ createdBy: 1 });
workspaceSchema.index({ 'members.userId': 1 });

const Workspace = mongoose.model('Workspace', workspaceSchema);
export default Workspace;
