import { Request, Response } from 'express';
import WhatsAppLead from '../models/WhatsAppLead';

// POST /api/whatsapp-leads (Meta webhook)
export const receiveWebhook = async (req: Request, res: Response) => {
  try {
    // Meta webhook payload structure (simplified)
    // Expect: { entry: [{ changes: [{ value: { messages: [{ from, text, timestamp, profile }], metadata: { phone_number_id } } ] }] }
    const entry = req.body.entry?.[0];
    if (!entry) {
      return res.status(400).json({ message: 'Invalid payload' });
    }
    const changes = entry.changes?.[0];
    const value = changes?.value;
    const messages = value?.messages?.[0];
    if (!messages) {
      return res.status(200).json({ status: 'no_message' }); // ignore non-message events
    }
    const phoneNumber = messages.from;
    const message = messages.text?.body || '';
    const timestamp = new Date(parseInt(messages.timestamp, 10) * 1000);
    const profile = messages.profile || {};
    const name = profile.name;
    const profilePictureUrl = profile.profile_picture_url;
    const contactUrl = `https://wa.me/${phoneNumber}`;

    const lead = new WhatsAppLead({
      phoneNumber,
      name,
      message,
      timestamp,
      profilePictureUrl,
      contactUrl,
    });
    await lead.save();
    res.status(201).json({ status: 'saved', id: lead._id });
  } catch (error: any) {
    console.error('WhatsApp webhook error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// GET /api/whatsapp-leads
export const listWhatsAppLeads = async (req: Request, res: Response) => {
  try {
    const leads = await WhatsAppLead.find().sort({ createdAt: -1 }).limit(100);
    res.json(leads);
  } catch (error: any) {
    console.error('List WhatsApp leads error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};
