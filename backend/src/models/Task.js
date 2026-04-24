import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  status: { type: String, enum: ['Todo', 'In Progress', 'In Review', 'Done'], default: 'Todo' },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  assignee: { type: String, default: '' },
  dueDate: { type: Date, default: null },
  completedAt: { type: Date, default: null },
  order: { type: Number, default: 0 },
}, { timestamps: true });

taskSchema.index({ projectId: 1, status: 1, order: 1 });

export default mongoose.model('Task', taskSchema);
