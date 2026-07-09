import express from 'express';
import {
  getTickets,
  createTicket,
  addMessage,
  updateTicketStatus,
} from '../controllers/supportController';

const router = express.Router();

router.get('/', getTickets);
router.post('/', createTicket);
router.post('/:id/message', addMessage);
router.patch('/:id/status', updateTicketStatus);

export default router;
