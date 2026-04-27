import mongoose from 'mongoose';

const WORKSPACE_ROLE_RANK = { member: 1, manager: 2, admin: 3 };

const workspaceMemberSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, enum: ['admin', 'manager', 'member'], default: 'member' },
  joinedAt: { type: Date, default: Date.now },
}, { _id: false });

const workspaceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: { type: [workspaceMemberSchema], default: [] },
}, { timestamps: true });

workspaceSchema.index({ createdBy: 1 });
workspaceSchema.index({ 'members.userId': 1 });

workspaceSchema.pre('save', function dedupeWorkspaceMembers() {
  if (!Array.isArray(this.members) || this.members.length <= 1) return;

  const byUser = new Map();
  for (const member of this.members) {
    const uid = String(member.userId);
    const existing = byUser.get(uid);
    if (!existing) {
      byUser.set(uid, member);
      continue;
    }
    const currentRank = WORKSPACE_ROLE_RANK[member.role] || WORKSPACE_ROLE_RANK.member;
    const existingRank = WORKSPACE_ROLE_RANK[existing.role] || WORKSPACE_ROLE_RANK.member;
    if (currentRank > existingRank) existing.role = member.role;
  }

  this.members = Array.from(byUser.values());
});

const Workspace = mongoose.model('Workspace', workspaceSchema);
export default Workspace;
