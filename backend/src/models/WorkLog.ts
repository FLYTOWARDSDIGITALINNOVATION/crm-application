import mongoose, { Schema, Document } from 'mongoose';

export interface IWorkLog extends Document {
  task: mongoose.Types.ObjectId;
  project: mongoose.Types.ObjectId;
  employeeId: mongoose.Types.ObjectId;
  employeeName: string;
  description: string;
  images: string[];
  createdAt: Date;
  updatedAt: Date;
}

const WorkLogSchema: Schema = new Schema(
  {
    task: { type: Schema.Types.ObjectId, ref: 'Task', required: true },
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    employeeId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    employeeName: { type: String, required: true },
    description: { type: String, required: true },
    images: { type: [String], default: [] },
  },
  { timestamps: true }
);

export default mongoose.model<IWorkLog>('WorkLog', WorkLogSchema);
