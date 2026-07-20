import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../utils/api';

export interface LeaveRequest {
  _id: string;
  employeeId: string;
  employeeName: string;
  startDate: string;
  endDate: string;
  type: 'Sick' | 'Casual' | 'Paid' | 'Unpaid';
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  approvedOrRejectedBy?: string;
  createdAt: string;
  updatedAt: string;
}

interface LeaveState {
  items: LeaveRequest[];
  isLoading: boolean;
  error: string | null;
}

const initialState: LeaveState = {
  items: [],
  isLoading: false,
  error: null,
};

// ─── Async Thunks ───────────────────────────────────────────────────────────

export const fetchLeaves = createAsyncThunk(
  'leaves/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/leaves');
      return res.data as LeaveRequest[];
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch leaves');
    }
  }
);

export const createLeave = createAsyncThunk(
  'leaves/create',
  async (
    leaveData: { startDate: string; endDate: string; type: string; reason: string },
    { rejectWithValue }
  ) => {
    try {
      const res = await api.post('/leaves', leaveData);
      return res.data as LeaveRequest;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to submit leave request');
    }
  }
);

export const updateLeaveStatus = createAsyncThunk(
  'leaves/updateStatus',
  async ({ id, status }: { id: string; status: 'Approved' | 'Rejected' }, { rejectWithValue }) => {
    try {
      const res = await api.patch(`/leaves/${id}/status`, { status });
      return res.data as LeaveRequest;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update leave status');
    }
  }
);

// ─── Slice ───────────────────────────────────────────────────────────────────

const leaveSlice = createSlice({
  name: 'leaves',
  initialState,
  reducers: {
    clearLeaves: (state) => {
      state.items = [];
    },
  },
  extraReducers: (builder) => {
    // fetchLeaves
    builder
      .addCase(fetchLeaves.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(fetchLeaves.fulfilled, (state, action: PayloadAction<LeaveRequest[]>) => {
        state.isLoading = false;
        state.items = action.payload;
      })
      .addCase(fetchLeaves.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // createLeave
    builder.addCase(createLeave.fulfilled, (state, action: PayloadAction<LeaveRequest>) => {
      state.items.unshift(action.payload);
    });

    // updateLeaveStatus
    builder.addCase(updateLeaveStatus.fulfilled, (state, action: PayloadAction<LeaveRequest>) => {
      const idx = state.items.findIndex(l => l._id === action.payload._id);
      if (idx !== -1) {
        state.items[idx] = action.payload;
      }
    });
  },
});

export const { clearLeaves } = leaveSlice.actions;
export default leaveSlice.reducer;
