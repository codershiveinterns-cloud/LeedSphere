import mongoose from 'mongoose';

const roleSchema = new mongoose.Schema({
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
  name: { type: String, required: true },
  permissions: [{ type: String }],
  isCustom: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model('Role', roleSchema);
