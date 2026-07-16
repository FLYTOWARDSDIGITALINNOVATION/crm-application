import mongoose, { Schema, Document } from 'mongoose';

export interface ILead extends Document {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  status: 'New' | 'Contacted' | 'Qualified' | 'Proposal' | 'Negotiation' | 'Converted' | 'Not Interested' | 'Follow Up' | 'Direct Visit';
  source?: string;
  assignedTo?: string;
  value?: number;
  notes?: string;
  timeline?: Array<{
    type: 'note' | 'call' | 'email' | 'status';
    content: string;
    user: string;
    createdAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const LeadSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },
    company: { type: String },
    status: {
      type: String,
      enum: ['New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Converted', 'Not Interested', 'Follow Up', 'Direct Visit'],
      default: 'New',
    },
    source: { type: String },
    assignedTo: { type: String },
    value: { type: Number, default: 0 },
    notes: { type: String },
    timeline: [
      {
        type: { type: String, enum: ['note', 'call', 'email', 'status'] },
        content: { type: String },
        user: { type: String },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model<ILead>('Lead', LeadSchema);
