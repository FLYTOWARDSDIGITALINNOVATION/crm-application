import mongoose, { Schema, Document } from 'mongoose';

export interface IProject extends Document {
  name: string;
  description?: string;
  status: 'Active' | 'Completed' | 'On Hold';
  assignedEmployees: mongoose.Types.ObjectId[];
  createdBy: mongoose.Types.ObjectId;
  requirements?: string;
  files?: Array<{ name: string; url: string; uploadedAt: Date }>;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema: Schema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    status: {
      type: String,
      enum: ['Active', 'Completed', 'On Hold'],
      default: 'Active',
    },
    assignedEmployees: [
      { type: Schema.Types.ObjectId, ref: 'User' },
    ],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    requirements: { type: String, default: '' },
    files: [
      {
        name: { type: String },
        url: { type: String },
        uploadedAt: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);

export default mongoose.model<IProject>('Project', ProjectSchema);
