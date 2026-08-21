import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  designation?: string;
  department?: string;
  joiningDate?: string;
  lastLoginAt?: string | null;
  lastLogoutAt?: string | null;
}

interface UserState {
  employees: User[];
  isLoading: boolean;
  error: string | null;
}

const initialState: UserState = {
  employees: [],
  isLoading: false,
  error: null,
};

export const fetchEmployees = createAsyncThunk('users/fetchEmployees', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get('/users/employees');
    return response.data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch employees');
  }
});

export const createEmployee = createAsyncThunk('users/createEmployee', async (userData: any, { rejectWithValue }) => {
  try {
    const response = await api.post('/users/employee', userData);
    return response.data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Failed to create employee');
  }
});

export const updateEmployeeDetails = createAsyncThunk('users/updateEmployeeDetails', async ({ id, data }: { id: string, data: any }, { rejectWithValue }) => {
  try {
    const response = await api.put(`/users/employees/${id}`, data);
    return response.data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || error.response?.data || error.message || 'Failed to update employee');
  }
});

const userSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchEmployees.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchEmployees.fulfilled, (state, action) => {
        state.isLoading = false;
        state.employees = action.payload;
      })
      .addCase(fetchEmployees.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(createEmployee.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createEmployee.fulfilled, (state, action) => {
        state.isLoading = false;
        state.employees.push(action.payload);
      })
      .addCase(createEmployee.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(updateEmployeeDetails.fulfilled, (state, action) => {
        const index = state.employees.findIndex(emp => emp._id === action.payload._id);
        if (index !== -1) {
          state.employees[index] = { ...state.employees[index], ...action.payload };
        }
      });
  },
});

export default userSlice.reducer;
