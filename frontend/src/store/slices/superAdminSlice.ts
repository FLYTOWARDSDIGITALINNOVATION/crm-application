import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../utils/api';
import type { WorkLog } from './workLogSlice';
import type { LeaveRequest } from './leaveSlice';

export interface EmployeeOverview {
  _id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  designation?: string;
  department?: string;
  joiningDate?: string;
  lastLoginAt?: string;
  lastLogoutAt?: string;
  isOnline?: boolean;
  projects: Array<{ _id: string; name: string; status: string }>;
  taskCount: number;
  completedTaskCount: number;
  workLogCount: number;
}

export interface ProjectOverview {
  _id: string;
  name: string;
  description: string;
  status: string;
  assignedEmployees: Array<{
    _id: string;
    name: string;
    email: string;
    designation: string;
    department: string;
    isOnline: boolean;
    lastLoginAt?: string;
  }>;
}

interface SuperAdminState {
  employees: EmployeeOverview[];
  workLogs: WorkLog[];
  leaves: LeaveRequest[];
  projects: ProjectOverview[];
  isLoading: boolean;
  error: string | null;
}

const initialState: SuperAdminState = {
  employees: [],
  workLogs: [],
  leaves: [],
  projects: [],
  isLoading: false,
  error: null,
};

// ─── Async Thunks ───────────────────────────────────────────────────────────

export const fetchEmployeeOverview = createAsyncThunk(
  'superAdmin/fetchEmployees',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/super-admin/employees');
      return res.data as EmployeeOverview[];
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch employee activity');
    }
  }
);

export const fetchAllWorkLogsForSuperAdmin = createAsyncThunk(
  'superAdmin/fetchWorkLogs',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/super-admin/work-logs');
      return res.data as WorkLog[];
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch work logs');
    }
  }
);

export const fetchAllLeavesForSuperAdmin = createAsyncThunk(
  'superAdmin/fetchLeaves',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/super-admin/leaves');
      return res.data as LeaveRequest[];
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch leave requests');
    }
  }
);

export const fetchAllProjectsOverview = createAsyncThunk(
  'superAdmin/fetchProjects',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/super-admin/projects');
      return res.data as ProjectOverview[];
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch project overview');
    }
  }
);

// ─── Slice ───────────────────────────────────────────────────────────────────

const superAdminSlice = createSlice({
  name: 'superAdmin',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // fetchEmployeeOverview
    builder
      .addCase(fetchEmployeeOverview.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(fetchEmployeeOverview.fulfilled, (state, action: PayloadAction<EmployeeOverview[]>) => {
        state.isLoading = false;
        state.employees = action.payload;
      })
      .addCase(fetchEmployeeOverview.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // fetchAllWorkLogsForSuperAdmin
    builder
      .addCase(fetchAllWorkLogsForSuperAdmin.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(fetchAllWorkLogsForSuperAdmin.fulfilled, (state, action: PayloadAction<WorkLog[]>) => {
        state.isLoading = false;
        state.workLogs = action.payload;
      })
      .addCase(fetchAllWorkLogsForSuperAdmin.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // fetchAllLeavesForSuperAdmin
    builder
      .addCase(fetchAllLeavesForSuperAdmin.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(fetchAllLeavesForSuperAdmin.fulfilled, (state, action: PayloadAction<LeaveRequest[]>) => {
        state.isLoading = false;
        state.leaves = action.payload;
      })
      .addCase(fetchAllLeavesForSuperAdmin.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // fetchAllProjectsOverview
    builder
      .addCase(fetchAllProjectsOverview.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(fetchAllProjectsOverview.fulfilled, (state, action: PayloadAction<ProjectOverview[]>) => {
        state.isLoading = false;
        state.projects = action.payload;
      })
      .addCase(fetchAllProjectsOverview.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export default superAdminSlice.reducer;
