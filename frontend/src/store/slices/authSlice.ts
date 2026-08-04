import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../utils/api';

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'superadmin' | 'admin' | 'sales' | 'customer' | 'employee';
  phone?: string;
  designation?: string;
  department?: string;
  joiningDate?: string;
  employeeId?: string;
  lastLoginAt?: string | null;
  lastLogoutAt?: string | null;
  profileCompleted?: boolean;
  approvalStatus?: 'NotSubmitted' | 'Pending' | 'Approved' | 'Rejected';
  profile?: {
    mobile?: string;
    aadhaar?: string;
    dob?: string;
    gender?: string;
    photo?: string;
    address?: string;
    pan?: string;
    bank?: {
      accountNumber?: string;
      ifsc?: string;
      accountType?: 'Savings' | 'Current' | 'Salary';
    };
    emergencyContact?: {
      name?: string;
      relation?: string;
      phone?: string;
    };
  };
}

interface EmployeeLogoutPayload {
  workSummary?: string;
  gitLink?: string;
  screenshot?: File | null;
  role: 'superadmin' | 'admin' | 'sales' | 'customer' | 'employee';
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Get user from local storage
const storedUser = localStorage.getItem('user');
const storedToken = localStorage.getItem('token');

const initialState: AuthState = {
  user: storedUser ? JSON.parse(storedUser) : null,
  token: storedToken || null,
  isAuthenticated: !!storedToken,
  isLoading: false,
  error: null,
};

// Async Thunks
export const login = createAsyncThunk('auth/login', async (credentials: any, { rejectWithValue }) => {
  try {
    const response = await api.post('/auth/login', credentials);
    const { token, ...user } = response.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    return { user, token };
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Login failed');
  }
});

export const register = createAsyncThunk('auth/register', async (userData: any, { rejectWithValue }) => {
  try {
    const response = await api.post('/auth/register', userData);
    const { token, ...user } = response.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    return { user, token };
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Registration failed');
  }
});

export const refreshUser = createAsyncThunk('auth/refreshUser', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/auth/me');
    const user = res.data;
    localStorage.setItem('user', JSON.stringify(user));
    return user;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Failed to refresh user');
  }
});

export const employeeLogout = createAsyncThunk(
  'auth/employeeLogout',
  async (payload: EmployeeLogoutPayload, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      if (payload.workSummary) {
        formData.append('workSummary', payload.workSummary);
      }
      if (payload.gitLink) {
        formData.append('gitLink', payload.gitLink);
      }
      if (payload.screenshot) {
        formData.append('screenshot', payload.screenshot);
      }

      const response = await api.post('/auth/logout', formData);

      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Logout failed');
    }
  }
);
export const logoutUser = createAsyncThunk('auth/logout', async () => {
  try {
    await api.post('/auth/logout');
  } catch {
    // Ignore error and proceed
  }
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  return null;
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.error = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action: PayloadAction<{ user: User; token: string }>) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Register
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action: PayloadAction<{ user: User; token: string }>) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Refresh user
      .addCase(refreshUser.fulfilled, (state, action: PayloadAction<User>) => {
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(refreshUser.rejected, (state) => {
        // ignore
      })
      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
      });
      // Employee Logout
      builder
        .addCase(employeeLogout.pending, (state) => {
          state.isLoading = true;
          state.error = null;
        })
        .addCase(employeeLogout.rejected, (state, action) => {
          state.isLoading = false;
          state.error = action.payload as string;
        });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
