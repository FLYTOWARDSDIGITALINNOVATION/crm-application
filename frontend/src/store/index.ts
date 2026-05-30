import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import authReducer from './slices/authSlice';
import leadReducer from './slices/leadSlice';
import customerReducer from './slices/customerSlice';
import taskReducer from './slices/taskSlice';
import supportReducer from './slices/supportSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    leads: leadReducer,
    customers: customerReducer,
    tasks: taskReducer,
    support: supportReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
