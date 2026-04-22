import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
  title: { type: String, required: true },
  date: { type: Date, required: true },
  description: { type: String }
}, { timestamps: true });

export default mongoose.model('Event', eventSchema);
