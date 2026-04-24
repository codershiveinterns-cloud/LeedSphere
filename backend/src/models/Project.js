import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
  teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['planning', 'active', 'completed', 'archived'], default: 'active' },
  startDate: { type: Date, default: null },
  endDate: { type: Date, default: null },
}, { timestamps: true });

projectSchema.index({ workspaceId: 1 });

export default mongoose.model('Project', projectSchema);
