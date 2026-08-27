import mongoose, { Schema, Document } from 'mongoose';

export interface ITask extends Document {
  title: string;
  description?: string;
  startDate?: string;
  dueDate: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'To Do' | 'In Progress' | 'Review' | 'Completed' | 'Pending';
  progress?: number;
  assignedTo: string[];
  relatedTo: string;
  projectId?: mongoose.Types.ObjectId;
  completedBy?: string;
  notified?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema: Schema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: false },
    startDate: { type: String, default: '' },
    dueDate: { type: String, required: true },
    priority: {
      type: String,
      enum: ['High', 'Medium', 'Low'],
      default: 'Medium',
    },
    status: {
      type: String,
      enum: ['To Do', 'In Progress', 'Review', 'Completed', 'Pending'],
      default: 'To Do',
    },
    progress: { type: Number, default: 0 },
    assignedTo: { type: [String], required: true, default: [] },
    relatedTo: { type: String, default: '' },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: false },
    completedBy: { type: String, default: '' },
    notified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model<ITask>('Task', TaskSchema);
