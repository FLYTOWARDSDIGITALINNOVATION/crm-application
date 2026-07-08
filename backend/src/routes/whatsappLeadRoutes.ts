import { Router, Request, Response } from 'express';
import { receiveWebhook, listWhatsAppLeads } from '../controllers/whatsappLeadController';

const router = Router();

// Verification endpoint for Meta webhook (GET)
router.get('/', (req: Request, res: Response) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    // @ts-ignore – challenge is string
    res.send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// Receive incoming WhatsApp messages (POST)
router.post('/', receiveWebhook);

// Optional endpoint to list stored WhatsApp leads
router.get('/list', listWhatsAppLeads);

export default router;
