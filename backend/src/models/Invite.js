import mongoose from 'mongoose';

const inviteSchema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true, trim: true },
  teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
  role: { type: String, enum: ['admin', 'manager', 'member'], default: 'member' },
  designation: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'accepted', 'declined'], default: 'pending' },
  invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

inviteSchema.index({ email: 1, status: 1 });
inviteSchema.index({ teamId: 1 });

export default mongoose.model('Invite', inviteSchema);
