import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../utils/api';

export interface Task {
  id: string;
  title: string;
  startDate?: string;
  dueDate: string;
  priority: 'High' | 'Medium' | 'Low' | string;
  status: 'To Do' | 'In Progress' | 'Review' | 'Completed' | 'Pending' | string;
  progress?: number;
  assignedTo: string;
  relatedTo: string;
  projectId?: string;
  description?: string;
  completedBy?: string;
}

// Helper to map MongoDB _id -> id
const mapTask = (doc: any): Task => ({
  id: doc._id,
  title: doc.title,
  startDate: doc.startDate || doc.createdAt ? new Date(doc.startDate || doc.createdAt).toISOString().split('T')[0] : '',
  dueDate: doc.dueDate,
  priority: doc.priority,
  status: doc.status || 'To Do',
  progress: typeof doc.progress === 'number' ? doc.progress : (doc.status === 'Completed' ? 100 : doc.status === 'In Progress' ? 50 : 0),
  assignedTo: Array.isArray(doc.assignedTo) ? doc.assignedTo.join(', ') : (doc.assignedTo || ''),
  relatedTo: doc.relatedTo,
  projectId: doc.projectId,
  description: doc.description,
  completedBy: doc.completedBy,
});

interface TaskState {
  items: Task[];
  isLoading: boolean;
  error: string | null;
}

const initialState: TaskState = {
  items: [],
  isLoading: false,
  error: null,
};

// ─── Async Thunks ───────────────────────────────────────────────────────────

export const fetchTasks = createAsyncThunk(
  'tasks/fetchAll',
  async (projectId: string | undefined = undefined, { rejectWithValue }) => {
    try {
      const params = projectId ? { projectId } : {};
      const res = await api.get('/tasks', { params });
      return res.data.map(mapTask);
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const createTask = createAsyncThunk(
  'tasks/create',
  async (task: Omit<Task, 'id'>, { rejectWithValue }) => {
    try {
      const res = await api.post('/tasks', task);
      return mapTask(res.data);
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const toggleTaskStatus = createAsyncThunk(
  'tasks/toggle',
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await api.patch(`/tasks/${id}/toggle`);
      return mapTask(res.data);
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const updateTask = createAsyncThunk(
  'tasks/update',
  async (updates: Partial<Task> & { id: string }, { rejectWithValue }) => {
    try {
      const { id, ...data } = updates;
      const res = await api.patch(`/tasks/${id}`, data);
      return mapTask(res.data);
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const deleteTask = createAsyncThunk(
  'tasks/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await api.delete(`/tasks/${id}`);
      return id;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// ─── Slice ───────────────────────────────────────────────────────────────────

const taskSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    clearProjectTasks: (state) => {
      state.items = [];
    },
  },
  extraReducers: (builder) => {
    // fetchTasks
    builder
      .addCase(fetchTasks.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(fetchTasks.fulfilled, (state, action) => { state.isLoading = false; state.items = action.payload; })
      .addCase(fetchTasks.rejected, (state, action) => { state.isLoading = false; state.error = action.payload as string; });

    // createTask
    builder
      .addCase(createTask.fulfilled, (state, action) => { state.items.unshift(action.payload); });

    // toggleTaskStatus
    builder
      .addCase(toggleTaskStatus.fulfilled, (state, action: PayloadAction<Task>) => {
        const idx = state.items.findIndex(t => t.id === action.payload.id);
        if (idx !== -1) state.items[idx] = action.payload;
      });

    // updateTask
    builder
      .addCase(updateTask.fulfilled, (state, action: PayloadAction<Task>) => {
        const idx = state.items.findIndex(t => t.id === action.payload.id);
        if (idx !== -1) state.items[idx] = action.payload;
      });

    // deleteTask
    builder
      .addCase(deleteTask.fulfilled, (state, action: PayloadAction<string>) => {
        state.items = state.items.filter(t => t.id !== action.payload);
      });
  },
});

export const { clearProjectTasks } = taskSlice.actions;
export default taskSlice.reducer;
