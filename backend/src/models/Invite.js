import mongoose from 'mongoose';

const inviteSchema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true, trim: true },
  teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
  role: { type: String, enum: ['admin', 'manager', 'member'], default: 'member' },
  designation: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'accepted', 'declined'], default: 'pending' },
  invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // Token-based magic-link flow. The token is a crypto-strong opaque string
  // delivered by email; the recipient never logs in to find their invite.
  // Sparse index so legacy invites (no token) don't violate uniqueness.
  token:     { type: String, unique: true, sparse: true, index: true },
  expiresAt: { type: Date },
  // `accepted` is a convenience boolean kept in sync with `status === 'accepted'`.
  // Lets the new public endpoint return a clean { valid, accepted } shape
  // without inferring from the enum.
  accepted:  { type: Boolean, default: false },
}, { timestamps: true });

inviteSchema.index({ email: 1, status: 1 });
inviteSchema.index({ teamId: 1 });

export default mongoose.model('Invite', inviteSchema);
