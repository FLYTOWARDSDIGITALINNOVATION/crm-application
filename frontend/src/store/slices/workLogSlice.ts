import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../utils/api';

export interface WorkLog {
  _id: string;
  task: string;
  project: string;
  employeeId: string;
  employeeName: string;
  description: string;
  images: string[];
  createdAt: string;
  updatedAt: string;
}

interface WorkLogState {
  logsByTaskId: Record<string, WorkLog[]>;
  isLoading: boolean;
  isUploading: boolean;
  error: string | null;
}

const initialState: WorkLogState = {
  logsByTaskId: {},
  isLoading: false,
  isUploading: false,
  error: null,
};

// ─── Async Thunks ─────────────────────────────────────────────────────────

export const fetchWorkLogsForTask = createAsyncThunk(
  'workLogs/fetchForTask',
  async (taskId: string, { rejectWithValue }) => {
    try {
      const res = await api.get(`/work-logs/task/${taskId}`);
      return { taskId, logs: res.data as WorkLog[] };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch work logs');
    }
  }
);

export const createWorkLog = createAsyncThunk(
  'workLogs/create',
  async (formData: FormData, { rejectWithValue }) => {
    try {
      const res = await api.post('/work-logs', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data as WorkLog;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to create work log');
    }
  }
);

export const deleteWorkLog = createAsyncThunk(
  'workLogs/delete',
  async ({ logId, taskId }: { logId: string; taskId: string }, { rejectWithValue }) => {
    try {
      await api.delete(`/work-logs/${logId}`);
      return { logId, taskId };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to delete work log');
    }
  }
);

// ─── Slice ────────────────────────────────────────────────────────────────

const workLogSlice = createSlice({
  name: 'workLogs',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // fetchWorkLogsForTask
    builder
      .addCase(fetchWorkLogsForTask.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(fetchWorkLogsForTask.fulfilled, (state, action: PayloadAction<{ taskId: string; logs: WorkLog[] }>) => {
        state.isLoading = false;
        state.logsByTaskId[action.payload.taskId] = action.payload.logs;
      })
      .addCase(fetchWorkLogsForTask.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // createWorkLog
    builder
      .addCase(createWorkLog.pending, (state) => { state.isUploading = true; state.error = null; })
      .addCase(createWorkLog.fulfilled, (state, action: PayloadAction<WorkLog>) => {
        state.isUploading = false;
        const taskId = action.payload.task;
        if (!state.logsByTaskId[taskId]) state.logsByTaskId[taskId] = [];
        state.logsByTaskId[taskId].unshift(action.payload);
      })
      .addCase(createWorkLog.rejected, (state, action) => {
        state.isUploading = false;
        state.error = action.payload as string;
      });

    // deleteWorkLog
    builder
      .addCase(deleteWorkLog.fulfilled, (state, action: PayloadAction<{ logId: string; taskId: string }>) => {
        const { logId, taskId } = action.payload;
        if (state.logsByTaskId[taskId]) {
          state.logsByTaskId[taskId] = state.logsByTaskId[taskId].filter(l => l._id !== logId);
        }
      });
  },
});

export default workLogSlice.reducer;
