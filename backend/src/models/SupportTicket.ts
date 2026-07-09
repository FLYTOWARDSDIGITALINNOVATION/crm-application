import mongoose, { Schema, Document } from 'mongoose';

export interface ISupportMessage {
  sender: string;      // user name
  senderId: string;    // user _id
  senderRole: string;  // 'admin' | 'employee' | 'sales'
  text: string;
  timestamp: Date;
}

export interface ISupportTicket extends Document {
  subject: string;
  description: string;
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  createdBy: string;      // user name
  createdById: string;    // user _id
  createdByRole: string;  // role of creator
  messages: ISupportMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const SupportMessageSchema = new Schema<ISupportMessage>(
  {
    sender: { type: String, required: true },
    senderId: { type: String, required: true },
    senderRole: { type: String, required: true },
    text: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: true }
);

const SupportTicketSchema = new Schema<ISupportTicket>(
  {
    subject: { type: String, required: true },
    description: { type: String, default: '' },
    status: {
      type: String,
      enum: ['Open', 'In Progress', 'Resolved', 'Closed'],
      default: 'Open',
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Urgent'],
      default: 'Medium',
    },
    createdBy: { type: String, required: true },
    createdById: { type: String, required: true },
    createdByRole: { type: String, required: true },
    messages: { type: [SupportMessageSchema], default: [] },
  },
  { timestamps: true }
);

export default mongoose.model<ISupportTicket>('SupportTicket', SupportTicketSchema);
