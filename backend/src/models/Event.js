import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  type: { type: String, enum: ['meeting', 'task', 'deadline', 'event'], default: 'event' },
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
  teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  allDay: { type: Boolean, default: false },
  location: { type: String, default: '' },
  meetingLink: { type: String, default: '' },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  // Backward compat
  date: { type: Date },
}, { timestamps: true });

eventSchema.index({ workspaceId: 1, startDate: 1 });

// Sync date <-> startDate for backward compat
eventSchema.pre('save', function () {
  if (this.startDate && !this.date) this.date = this.startDate;
  if (this.date && !this.startDate) this.startDate = this.date;
  if (!this.endDate) this.endDate = this.startDate;
});

export default mongoose.model('Event', eventSchema);
