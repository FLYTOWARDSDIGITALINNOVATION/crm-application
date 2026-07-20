import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import authReducer from './slices/authSlice';
import leadReducer from './slices/leadSlice';
import customerReducer from './slices/customerSlice';
import taskReducer from './slices/taskSlice';
import supportReducer from './slices/supportSlice';
import userReducer from './slices/userSlice';
import projectReducer from './slices/projectSlice';
import workLogReducer from './slices/workLogSlice';
import leaveReducer from './slices/leaveSlice';
import superAdminReducer from './slices/superAdminSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    leads: leadReducer,
    customers: customerReducer,
    tasks: taskReducer,
    support: supportReducer,
    users: userReducer,
    projects: projectReducer,
    workLogs: workLogReducer,
    leaves: leaveReducer,
    superAdmin: superAdminReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
