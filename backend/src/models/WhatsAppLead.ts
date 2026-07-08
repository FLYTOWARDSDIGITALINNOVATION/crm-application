import mongoose, { Schema, Document } from 'mongoose';

export interface IWhatsAppLead extends Document {
  phoneNumber: string;
  name?: string;
  message: string;
  timestamp: Date;
  profilePictureUrl?: string;
  contactUrl?: string;
}

const WhatsAppLeadSchema: Schema = new Schema(
  {
    phoneNumber: { type: String, required: true },
    name: { type: String },
    message: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    profilePictureUrl: { type: String },
    contactUrl: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<IWhatsAppLead>('WhatsAppLead', WhatsAppLeadSchema);
