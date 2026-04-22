import mongoose from 'mongoose';

const noteSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  content: { type: String, default: '' },
  teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

noteSchema.index({ teamId: 1 });

export default mongoose.model('Note', noteSchema);
