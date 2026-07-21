import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../utils/api';

export interface Task {
  id: string;
  title: string;
  dueDate: string;
  priority: 'High' | 'Medium' | 'Low' | string;
  status: 'Pending' | 'In Progress' | 'Completed' | string;
  assignedTo: string;
  relatedTo: string;
  description?: string;
}

// Helper to map MongoDB _id -> id
const mapTask = (doc: any): Task => ({
  id: doc._id,
  title: doc.title,
  dueDate: doc.dueDate,
  priority: doc.priority,
  status: doc.status,
  assignedTo: doc.assignedTo,
  relatedTo: doc.relatedTo,
  description: doc.description,
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
  async ({ id, status, assignedTo, dueDate, description }: { id: string; status?: string; assignedTo?: string; dueDate?: string; description?: string }, { rejectWithValue }) => {
    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, assignedTo, dueDate, description }),
      });
      if (!res.ok) throw new Error('Failed to update task');
      const data = await res.json();
      return mapTask(data);
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
