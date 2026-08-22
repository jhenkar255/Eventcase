import mongoose, { Schema, Document } from 'mongoose';

export type TaskStatus = 'pending' | 'in-progress' | 'completed';

export interface ITask extends Document {
  eventId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  date: Date;
  startTime: string;
  endTime: string;
  assignedTo?: string;
  status: TaskStatus;
  createdAt: Date;
  updatedAt: Date;
}

const taskSchema = new Schema<ITask>(
  {
    eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
    title: { type: String, required: [true, 'Task title is required'], trim: true, maxlength: 150 },
    description: { type: String, trim: true, maxlength: 1000 },
    date: { type: Date, required: [true, 'Task date is required'] },
    startTime: { type: String, default: '' },
    endTime: { type: String, default: '' },
    assignedTo: { type: String, trim: true },
    status: { type: String, enum: ['pending', 'in-progress', 'completed'], default: 'pending', index: true },
  },
  { timestamps: true }
);

taskSchema.index({ eventId: 1, date: 1 });

export const Task = mongoose.model<ITask>('Task', taskSchema);
