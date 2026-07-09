import { Request, Response } from 'express';
import SupportTicket from '../models/SupportTicket';
import jwt from 'jsonwebtoken';
import User from '../models/User';

// Helper: decode token and get user from DB
const getUserFromToken = async (req: Request) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  try {
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    const user = await User.findById(decoded.id).select('-password');
    return user;
  } catch {
    return null;
  }
};

// @desc    Get all tickets
//          Admin/Sales see all; Employee sees only their own
// @route   GET /api/support
// @access  Private
export const getTickets = async (req: Request, res: Response) => {
  try {
    const user = await getUserFromToken(req);
    if (!user) return res.status(401).json({ message: 'Not authorised' });

    let tickets;
    if (user.role === 'admin' || user.role === 'sales') {
      tickets = await SupportTicket.find().sort({ updatedAt: -1 });
    } else {
      // employee sees only their own tickets
      tickets = await SupportTicket.find({ createdById: (user._id as any).toString() }).sort({ updatedAt: -1 });
    }

    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// @desc    Create a new ticket
// @route   POST /api/support
// @access  Private
export const createTicket = async (req: Request, res: Response) => {
  try {
    const user = await getUserFromToken(req);
    if (!user) return res.status(401).json({ message: 'Not authorised' });

    const { subject, description, priority } = req.body;

    if (!subject) return res.status(400).json({ message: 'Subject is required' });

    const ticket = await SupportTicket.create({
      subject,
      description: description || '',
      priority: priority || 'Medium',
      status: 'Open',
      createdBy: user.name,
      createdById: (user._id as any).toString(),
      createdByRole: user.role,
      messages: [],
    });

    res.status(201).json(ticket);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// @desc    Add a message to a ticket
// @route   POST /api/support/:id/message
// @access  Private
export const addMessage = async (req: Request, res: Response) => {
  try {
    const user = await getUserFromToken(req);
    if (!user) return res.status(401).json({ message: 'Not authorised' });

    const { text } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ message: 'Message text is required' });

    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    // Employees can only message their own tickets
    if (user.role === 'employee' && ticket.createdById !== (user._id as any).toString()) {
      return res.status(403).json({ message: 'Not authorised to message this ticket' });
    }

    ticket.messages.push({
      sender: user.name,
      senderId: (user._id as any).toString(),
      senderRole: user.role,
      text: text.trim(),
      timestamp: new Date(),
    });
    ticket.updatedAt = new Date();

    await ticket.save();
    res.json(ticket);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// @desc    Update ticket status
// @route   PATCH /api/support/:id/status
// @access  Private (admin/sales)
export const updateTicketStatus = async (req: Request, res: Response) => {
  try {
    const user = await getUserFromToken(req);
    if (!user) return res.status(401).json({ message: 'Not authorised' });

    const { status } = req.body;
    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    ticket.status = status;
    ticket.updatedAt = new Date();
    await ticket.save();

    res.json(ticket);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};
