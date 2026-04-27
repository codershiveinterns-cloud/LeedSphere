import mongoose from 'mongoose';

/**
 * Documents are persisted on the project so every team member sees them.
 * `dataUrl` holds a base64-encoded blob — fine for a few small files; if
 * you outgrow that, swap this for an S3 / GridFS reference later.
 */
const projectDocumentSchema = new mongoose.Schema({
  id: { type: String, required: true },           // client-generated stable id
  name: { type: String, required: true },
  size: { type: Number, default: 0 },
  mime: { type: String, default: '' },
  dataUrl: { type: String, required: true },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  uploadedByName: { type: String, default: '' },
  uploadedAt: { type: Date, default: Date.now },
}, { _id: false });

const projectSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
  // Multi-team support. `teamIds` is the source of truth; `teamId` kept for
  // backward compatibility with existing rows and old clients.
  teamIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Team' }],
  teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['planning', 'active', 'completed', 'archived'], default: 'active' },
  startDate: { type: Date, default: null },
  endDate: { type: Date, default: null },
  documents: { type: [projectDocumentSchema], default: [] },
}, { timestamps: true });

projectSchema.index({ workspaceId: 1 });
projectSchema.index({ teamIds: 1 });

export default mongoose.model('Project', projectSchema);
