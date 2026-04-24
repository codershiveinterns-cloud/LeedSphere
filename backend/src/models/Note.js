import mongoose from 'mongoose';

const noteSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  content: { type: mongoose.Schema.Types.Mixed, default: null },
  teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Note', default: null },
  icon: { type: String, default: '' },
}, { timestamps: true });

noteSchema.index({ teamId: 1, parentId: 1 });

export default mongoose.model('Note', noteSchema);
