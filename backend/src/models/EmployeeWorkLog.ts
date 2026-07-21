import mongoose, { Document, Model, Schema } from 'mongoose';

export type ProofType = 'text' | 'screenshot' | 'git-link' | 'multiple';

export interface IEmployeeWorkLog extends Document {
  employeeId: mongoose.Types.ObjectId;
  sharedSessionId: mongoose.Types.ObjectId;
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

const EmployeeWorkLogSchema = new Schema(
  {
    employeeId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    sharedSessionId: { type: Schema.Types.ObjectId, required: true, unique: true, index: true },
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

EmployeeWorkLogSchema.index({ employeeId: 1, loginAt: -1 });

const normalizeEmployeeKey = (employeeId: string) => employeeId.replace(/[^a-zA-Z0-9]/g, '_');

export const getEmployeeWorkLogCollectionName = (employeeId: string) =>
  `employee_work_logs_${normalizeEmployeeKey(employeeId)}`;

export const getEmployeeWorkLogModel = (employeeId: string) => {
  const safeKey = normalizeEmployeeKey(employeeId);
  const modelName = `EmployeeWorkLog_${safeKey}`;
  const collectionName = getEmployeeWorkLogCollectionName(employeeId);

  return (mongoose.models[modelName] as Model<IEmployeeWorkLog>) ||
    mongoose.model<IEmployeeWorkLog>(modelName, EmployeeWorkLogSchema, collectionName);
};

export const ensureEmployeeWorkLogCollection = async (employeeId: string) => {
  const model = getEmployeeWorkLogModel(employeeId);

  try {
    await model.createCollection();
  } catch (error: any) {
    const isNamespaceExists = error?.code === 48 || error?.codeName === 'NamespaceExists';

    if (!isNamespaceExists) {
      throw error;
    }
  }

  return model;
};

