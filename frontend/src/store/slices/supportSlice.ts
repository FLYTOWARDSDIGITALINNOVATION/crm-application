import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface SupportMessage {
  id: string | number;
  sender: 'agent' | 'customer';
  text: string;
  timestamp: string;
}

export interface SupportTicket {
  id: string;
  subject: string;
  description: string;
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed' | string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent' | string;
  customer: string;
  createdAt: string;
  updatedAt: string;
  messages: SupportMessage[];
}

interface SupportState {
  items: SupportTicket[];
  isLoading: boolean;
  error: string | null;
}

const initialState: SupportState = {
  items: [
    {
      id: 'sup1',
      subject: 'Unable to login to portal',
      description: 'Customer is facing issues while trying to login to the customer portal.',
      status: 'Open',
      priority: 'High',
      customer: 'Alice Johnson',
      createdAt: '2026-05-29T10:00:00Z',
      updatedAt: '2026-05-29T10:00:00Z',
      messages: [
        { id: 1, sender: 'customer', text: 'Hi, I cannot access my dashboard.', timestamp: '2026-05-29T10:00:00Z' },
        { id: 2, sender: 'agent', text: 'Hi Alice, I noticed you were having trouble. Have you tried clearing your browser cache?', timestamp: '2026-05-29T10:05:00Z' }
      ]
    },
    {
      id: 'sup2',
      subject: 'Billing discrepancy',
      description: 'Invoice amount does not match the agreed contract terms.',
      status: 'In Progress',
      priority: 'Medium',
      customer: 'Bob Smith',
      createdAt: '2026-05-28T14:30:00Z',
      updatedAt: '2026-05-29T09:15:00Z',
      messages: []
    },
  ],
  isLoading: false,
  error: null,
};

const supportSlice = createSlice({
  name: 'support',
  initialState,
  reducers: {
    addTicket: (state, action: PayloadAction<SupportTicket>) => {
      state.items.unshift(action.payload);
    },
    updateTicket: (state, action: PayloadAction<SupportTicket>) => {
      const index = state.items.findIndex(t => t.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
    },
    deleteTicket: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(t => t.id !== action.payload);
    },
    updateTicketStatus: (state, action: PayloadAction<{ id: string; status: string }>) => {
      const ticket = state.items.find(t => t.id === action.payload.id);
      if (ticket) {
        ticket.status = action.payload.status;
        ticket.updatedAt = new Date().toISOString();
      }
    },
    addMessageToTicket: (state, action: PayloadAction<{ ticketId: string, message: SupportMessage }>) => {
      const ticket = state.items.find(t => t.id === action.payload.ticketId);
      if (ticket) {
        if (!ticket.messages) ticket.messages = [];
        ticket.messages.push(action.payload.message);
        ticket.updatedAt = new Date().toISOString();
      }
    }
  }
});

export const { addTicket, updateTicket, deleteTicket, updateTicketStatus, addMessageToTicket } = supportSlice.actions;
export default supportSlice.reducer;
