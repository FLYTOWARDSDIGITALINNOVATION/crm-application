import mongoose, { Schema, Document } from 'mongoose';

export interface ILeaveRequest extends Document {
  employeeId: mongoose.Types.ObjectId;
  employeeName: string;
  startDate: string;
  endDate: string;
  type: 'Sick' | 'Casual' | 'Paid' | 'Unpaid';
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  approvedOrRejectedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const LeaveRequestSchema: Schema = new Schema(
  {
    employeeId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    employeeName: { type: String, required: true },
    startDate: { type: String, required: true },
    endDate: { type: String, required: true },
    type: {
      type: String,
      enum: ['Sick', 'Casual', 'Paid', 'Unpaid'],
      default: 'Casual',
    },
    reason: { type: String, required: true },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Pending',
    },
    approvedOrRejectedBy: { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.model<ILeaveRequest>('LeaveRequest', LeaveRequestSchema);
