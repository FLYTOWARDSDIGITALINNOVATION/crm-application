import mongoose, { Schema, Document } from 'mongoose';

export interface ITask extends Document {
  title: string;
  description?: string;
  dueDate: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Pending' | 'In Progress' | 'Completed';
  assignedTo: string[];
  relatedTo: string;
  projectId?: mongoose.Types.ObjectId;
  completedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema: Schema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: false },
    dueDate: { type: String, required: true },
    priority: {
      type: String,
      enum: ['High', 'Medium', 'Low'],
      default: 'Medium',
    },
    status: {
      type: String,
      enum: ['Pending', 'In Progress', 'Completed'],
      default: 'Pending',
    },
    // Support multiple assignees as array of strings (names or identifiers)
    assignedTo: { type: [String], required: true, default: [] },
    relatedTo: { type: String, default: '' },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: false },
    completedBy: { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.model<ITask>('Task', TaskSchema);
