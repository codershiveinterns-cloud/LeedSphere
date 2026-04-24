import mongoose from 'mongoose';

const workspaceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

workspaceSchema.index({ createdBy: 1 });

const Workspace = mongoose.model('Workspace', workspaceSchema);
export default Workspace;
