import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../utils/api';

export interface SupportMessage {
  id: string | number;
  sender: string;
  senderId: string;
  senderRole: string;
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
  createdBy: string;
  createdById: string;
  createdByRole: string;
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
  items: [],
  isLoading: false,
  error: null,
};

// Helper mapping function
const mapTicket = (doc: any): SupportTicket => ({
  id: doc._id,
  subject: doc.subject,
  description: doc.description,
  status: doc.status,
  priority: doc.priority,
  customer: doc.createdBy || 'Unknown User',
  createdBy: doc.createdBy,
  createdById: doc.createdById,
  createdByRole: doc.createdByRole,
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt,
  messages: (doc.messages || []).map((msg: any) => ({
    id: msg._id || msg.id,
    sender: msg.sender,
    senderId: msg.senderId,
    senderRole: msg.senderRole,
    text: msg.text,
    timestamp: msg.timestamp,
  })),
});

// ─── Async Thunks ───────────────────────────────────────────────────────────

export const fetchTickets = createAsyncThunk(
  'support/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/support');
      return response.data.map(mapTicket);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch tickets');
    }
  }
);

export const createTicket = createAsyncThunk(
  'support/create',
  async (
    ticketData: { subject: string; description: string; priority: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.post('/support', ticketData);
      return mapTicket(response.data);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create ticket');
    }
  }
);

export const addMessageToTicket = createAsyncThunk(
  'support/addMessage',
  async (
    { ticketId, text }: { ticketId: string; text: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.post(`/support/${ticketId}/message`, { text });
      return mapTicket(response.data);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to send message');
    }
  }
);

export const updateTicketStatus = createAsyncThunk(
  'support/updateStatus',
  async (
    { id, status }: { id: string; status: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.patch(`/support/${id}/status`, { status });
      return mapTicket(response.data);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update ticket status');
    }
  }
);

const supportSlice = createSlice({
  name: 'support',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // fetchTickets
    builder
      .addCase(fetchTickets.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTickets.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload;
      })
      .addCase(fetchTickets.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // createTicket
    builder.addCase(createTicket.fulfilled, (state, action) => {
      state.items.unshift(action.payload);
    });

    // addMessageToTicket
    builder.addCase(addMessageToTicket.fulfilled, (state, action) => {
      const index = state.items.findIndex((t) => t.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
    });

    // updateTicketStatus
    builder.addCase(updateTicketStatus.fulfilled, (state, action) => {
      const index = state.items.findIndex((t) => t.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
    });
  },
});

export default supportSlice.reducer;
