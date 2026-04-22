import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
  title: { type: String, required: true },
  description: { type: String },
  status: { type: String, enum: ['active', 'completed'], default: 'active' },
  assignedTeams: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Team' }]
}, { timestamps: true });

export default mongoose.model('Project', projectSchema);
