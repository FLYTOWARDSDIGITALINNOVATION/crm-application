import mongoose, { Schema, Document } from 'mongoose';

export interface ICustomer extends Document {
  leadId?: mongoose.Types.ObjectId;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  sector?: string;
  totalSpent: number;
  status: 'Active' | 'VIP' | 'New' | 'Inactive';
  notes?: string;
  timeline?: Array<{
    type: 'note' | 'call' | 'email' | 'status';
    content: string;
    user: string;
    createdAt: Date;
  }>;
  joinedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  portalPassword?: string;
  requirements?: string;
  files?: Array<{ name: string; url: string; uploadedAt: Date }>;
}

const CustomerSchema: Schema = new Schema(
  {
    leadId: { type: Schema.Types.ObjectId, ref: 'Lead' },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String },
    company: { type: String },
    sector: { type: String },
    totalSpent: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['Active', 'VIP', 'New', 'Inactive'],
      default: 'Active',
    },
    notes: { type: String },
    timeline: [
      {
        type: { type: String, enum: ['note', 'call', 'email', 'status'] },
        content: { type: String },
        user: { type: String },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    joinedAt: { type: Date, default: Date.now },
    portalPassword: { type: String },
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

export default mongoose.model<ICustomer>('Customer', CustomerSchema);
