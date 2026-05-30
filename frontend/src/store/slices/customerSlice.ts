import { createSlice, createAsyncThunk, PayloadAction, isAnyOf } from '@reduxjs/toolkit';
import api from '../../utils/api';
import { convertLead } from './leadSlice';

export interface Customer {
  _id: string;
  leadId?: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  sector?: string;
  totalSpent: number;
  status: 'Active' | 'VIP' | 'New' | 'Inactive';
  notes?: string;
  timeline?: Array<{
    _id: string;
    type: 'note' | 'call' | 'email' | 'status';
    content: string;
    user: string;
    createdAt: string;
  }>;
  joinedAt: string;
  createdAt: string;
  updatedAt: string;
  portalPassword?: string;
}

interface CustomerState {
  items: Customer[];
  isLoading: boolean;
  error: string | null;
}

const initialState: CustomerState = {
  items: [],
  isLoading: false,
  error: null,
};

// Async Thunks
export const fetchCustomers = createAsyncThunk('customers/fetchCustomers', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get('/customers');
    return response.data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch customers');
  }
});

export const fetchCustomerById = createAsyncThunk(
  'customers/fetchCustomerById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await api.get(`/customers/${id}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch customer');
    }
  }
);

export const deleteCustomer = createAsyncThunk(
  'customers/deleteCustomer',
  async (id: string, { rejectWithValue }) => {
    try {
      await api.delete(`/customers/${id}`);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete customer');
    }
  }
);

export const updateCustomer = createAsyncThunk(
  'customers/updateCustomer',
  async ({ id, data }: { id: string; data: Partial<Customer> }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/customers/${id}`, data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update customer');
    }
  }
);

export const addCustomerTimelineEntry = createAsyncThunk(
  'customers/addTimelineEntry',
  async ({ id, entry }: { id: string; entry: any }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/customers/${id}/timeline`, entry);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add timeline entry');
    }
  }
);

const customerSlice = createSlice({
  name: 'customers',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCustomers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCustomers.fulfilled, (state, action: PayloadAction<Customer[]>) => {
        state.isLoading = false;
        state.items = action.payload;
      })
      .addCase(fetchCustomers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Handle Lead Conversion
      .addCase(convertLead.fulfilled, (state, action) => {
        state.items.unshift(action.payload.customer);
      })
      // Handle Delete Customer
      .addCase(deleteCustomer.fulfilled, (state, action) => {
        state.items = state.items.filter(item => item._id !== action.payload);
      })
      // Update Customer / Add Timeline / Fetch Single Customer
      .addMatcher(
        isAnyOf(updateCustomer.fulfilled, addCustomerTimelineEntry.fulfilled, fetchCustomerById.fulfilled),
        (state, action: PayloadAction<Customer>) => {
          state.isLoading = false;
          const index = state.items.findIndex(item => item._id === action.payload._id);
          if (index !== -1) {
            state.items[index] = action.payload;
          } else {
            state.items.unshift(action.payload);
          }
        }
      )
      .addMatcher(
        isAnyOf(updateCustomer.pending, addCustomerTimelineEntry.pending),
        (state) => {
          state.isLoading = true;
          state.error = null;
        }
      )
      .addMatcher(
        isAnyOf(updateCustomer.rejected, addCustomerTimelineEntry.rejected),
        (state, action) => {
          state.isLoading = false;
          state.error = action.payload as string;
        }
      );
  },
});

export default customerSlice.reducer;
