import mongoose, { Schema, Document } from 'mongoose';

export type ProofType = 'text' | 'screenshot' | 'git-link' | 'multiple';

export interface IEmployeeSession extends Document {
  userId: mongoose.Types.ObjectId;
  userName: string;
  userEmail: string;
  loginAt: Date;
  logoutAt?: Date;
  workSummary?: string;
  gitLink?: string;
  screenshot?: string;
  proofType?: ProofType;
  status: 'active' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

const EmployeeSessionSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    userName: { type: String, required: true },
    userEmail: { type: String, required: true },
    loginAt: { type: Date, required: true, default: Date.now },
    logoutAt: { type: Date },
    workSummary: { type: String },
    gitLink: { type: String },
    screenshot: { type: String },
    proofType: {
      type: String,
      enum: ['text', 'screenshot', 'git-link', 'multiple'],
    },
    status: {
      type: String,
      enum: ['active', 'completed'],
      default: 'active',
    },
  },
  { timestamps: true }
);

EmployeeSessionSchema.index({ userId: 1, status: 1, loginAt: -1 });

export default mongoose.model<IEmployeeSession>('EmployeeSession', EmployeeSessionSchema);
