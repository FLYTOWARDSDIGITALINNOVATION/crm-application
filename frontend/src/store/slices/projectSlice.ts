import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../utils/api';

export interface ProjectEmployee {
  _id: string;
  name: string;
  email: string;
  role: string;
  designation?: string;
}

export interface Project {
  _id: string;
  name: string;
  description: string;
  status: 'Active' | 'Completed' | 'On Hold';
  assignedEmployees: ProjectEmployee[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface ProjectState {
  items: Project[];
  isLoading: boolean;
  error: string | null;
}

const initialState: ProjectState = {
  items: [],
  isLoading: false,
  error: null,
};

// ─── Async Thunks ──────────────────────────────────────────────────────────

export const fetchProjects = createAsyncThunk(
  'projects/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/projects');
      return res.data as Project[];
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch projects');
    }
  }
);

export const createProject = createAsyncThunk(
  'projects/create',
  async (data: { name: string; description?: string; status?: string }, { rejectWithValue }) => {
    try {
      const res = await api.post('/projects', data);
      return res.data as Project;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to create project');
    }
  }
);

export const updateProject = createAsyncThunk(
  'projects/update',
  async (
    { id, ...updates }: { id: string; name?: string; description?: string; status?: string },
    { rejectWithValue }
  ) => {
    try {
      const res = await api.patch(`/projects/${id}`, updates);
      return res.data as Project;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update project');
    }
  }
);

export const deleteProject = createAsyncThunk(
  'projects/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await api.delete(`/projects/${id}`);
      return id;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to delete project');
    }
  }
);

export const assignEmployeesToProject = createAsyncThunk(
  'projects/assignEmployees',
  async ({ id, employeeIds }: { id: string; employeeIds: string[] }, { rejectWithValue }) => {
    try {
      const res = await api.patch(`/projects/${id}/assign`, { employeeIds });
      return res.data as Project;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to assign employees');
    }
  }
);

// ─── Slice ─────────────────────────────────────────────────────────────────

const projectSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // fetchProjects
    builder
      .addCase(fetchProjects.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload;
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // createProject
    builder.addCase(createProject.fulfilled, (state, action: PayloadAction<Project>) => {
      state.items.unshift(action.payload);
    });

    // updateProject
    builder.addCase(updateProject.fulfilled, (state, action: PayloadAction<Project>) => {
      const idx = state.items.findIndex(p => p._id === action.payload._id);
      if (idx !== -1) state.items[idx] = action.payload;
    });

    // deleteProject
    builder.addCase(deleteProject.fulfilled, (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(p => p._id !== action.payload);
    });

    // assignEmployeesToProject
    builder.addCase(assignEmployeesToProject.fulfilled, (state, action: PayloadAction<Project>) => {
      const idx = state.items.findIndex(p => p._id === action.payload._id);
      if (idx !== -1) state.items[idx] = action.payload;
    });
  },
});

export default projectSlice.reducer;
