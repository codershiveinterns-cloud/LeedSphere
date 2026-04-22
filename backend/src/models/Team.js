import mongoose from 'mongoose';

const teamSchema = new mongoose.Schema({
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
  name: { type: String, required: true },
  members: [{
    name: { type: String, required: true },
    role: { type: String, default: 'Member' }
  }],
  channels: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Channel' }],
  projects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Project' }]
}, { timestamps: true });

export default mongoose.model('Team', teamSchema);
