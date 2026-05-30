import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Task {
  id: string;
  title: string;
  dueDate: string;
  priority: 'High' | 'Medium' | 'Low' | string;
  status: 'Pending' | 'In Progress' | 'Completed' | string;
  assignedTo: string;
  relatedTo: string;
}

interface TaskState {
  items: Task[];
  isLoading: boolean;
  error: string | null;
}

const initialState: TaskState = {
  items: [
    { id: 't1', title: 'Follow up with Alice Johnson', dueDate: '2026-04-07', priority: 'High', status: 'Pending', assignedTo: 'John Doe', relatedTo: 'TechCorp' },
    { id: 't2', title: 'Prepare demo for Bob Smith', dueDate: '2026-04-08', priority: 'Medium', status: 'In Progress', assignedTo: 'John Doe', relatedTo: 'Build-it Inc' },
    { id: 't3', title: 'Contract review for Apex Logistics', dueDate: '2026-04-06', priority: 'High', status: 'Completed', assignedTo: 'Sarah Miller', relatedTo: 'Apex Logistics' },
    { id: 't4', title: 'Initial discovery call - Fiona', dueDate: '2026-04-10', priority: 'Low', status: 'Pending', assignedTo: 'John Doe', relatedTo: 'Southside Deli' },
  ],
  isLoading: false,
  error: null,
};

const taskSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    addTask: (state, action: PayloadAction<Task>) => {
      state.items.unshift(action.payload);
    },
    updateTask: (state, action: PayloadAction<Task>) => {
      const index = state.items.findIndex(t => t.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
    },
    deleteTask: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(t => t.id !== action.payload);
    },
    toggleTaskStatus: (state, action: PayloadAction<string>) => {
      const task = state.items.find(t => t.id === action.payload);
      if (task) {
        task.status = task.status === 'Completed' ? 'Pending' : 'Completed';
      }
    }
  }
});

export const { addTask, updateTask, deleteTask, toggleTaskStatus } = taskSlice.actions;
export default taskSlice.reducer;
