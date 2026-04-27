import mongoose from 'mongoose';

const TEAM_ROLE_RANK = { member: 1, manager: 2, admin: 3 };

const teamMemberSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, enum: ['admin', 'manager', 'member'], default: 'member' },
  designation: { type: String, default: '' },
  joinedAt: { type: Date, default: Date.now },
}, { _id: false });

const teamSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
  members: [teamMemberSchema],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

teamSchema.index({ workspaceId: 1 });

teamSchema.pre('save', function dedupeTeamMembers() {
  if (!Array.isArray(this.members) || this.members.length <= 1) return;

  const byUser = new Map();
  for (const member of this.members) {
    const uid = String(member.userId);
    const existing = byUser.get(uid);
    if (!existing) {
      byUser.set(uid, member);
      continue;
    }

    const currentRank = TEAM_ROLE_RANK[member.role] || TEAM_ROLE_RANK.member;
    const existingRank = TEAM_ROLE_RANK[existing.role] || TEAM_ROLE_RANK.member;
    if (currentRank > existingRank) existing.role = member.role;
    if (!existing.designation && member.designation) existing.designation = member.designation;
  }

  this.members = Array.from(byUser.values());
});

export default mongoose.model('Team', teamSchema);
