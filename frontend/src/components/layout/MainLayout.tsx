import React, { useState, useEffect } from 'react';
import { Outlet, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { cn } from '../../utils/cn';
import { useAppDispatch, useAppSelector } from '../../store';
import { logoutUser } from '../../store/slices/authSlice';
import { LogOut, AlertTriangle } from 'lucide-react';
import NotificationManager from './NotificationManager';
import api from '../../utils/api';

const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [forceLogoutNotice, setForceLogoutNotice] = useState<string | null>(null);

  // Global force logout modal event listener
  useEffect(() => {
    const handleForceLogoutModal = (e: any) => {
      setForceLogoutNotice(e.detail?.message || 'You have been logged out by the Super Admin.');
    };
    window.addEventListener('show_force_logout_modal', handleForceLogoutModal);
    return () => window.removeEventListener('show_force_logout_modal', handleForceLogoutModal);
  }, []);

  // Heartbeat polling & cross-tab forced logout detection
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const currentUserId = (user as any).id || (user as any)._id;

    // 1. Periodic heartbeat to check session status
    const interval = setInterval(() => {
      api.get('/auth/me').catch(() => {
        // Handled automatically by api.ts 401 interceptor
      });
    }, 4000);

    // 2. BroadcastChannel listener for instant cross-tab logout
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('crm_session_channel');
      bc.onmessage = (event) => {
        if (event.data && event.data.type === 'FORCE_LOGOUT' && event.data.userId === currentUserId) {
          setForceLogoutNotice('You have been logged out by the Super Admin.');
        }
      };
    } catch (e) {}

    // 3. Storage event listener
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'force_logout_signal' && e.newValue) {
        try {
          const data = JSON.parse(e.newValue);
          if (data.userId === currentUserId) {
            setForceLogoutNotice('You have been logged out by the Super Admin.');
          }
        } catch (err) {}
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      clearInterval(interval);
      if (bc) bc.close();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [isAuthenticated, user]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const location = useLocation();

  // Employee onboarding / approval guard
  if (user?.role === 'employee') {
    if (!user.profileCompleted && location.pathname !== '/complete-profile') {
      return <Navigate to="/complete-profile" replace />;
    }

    if (user.profileCompleted && user.approvalStatus !== 'Approved' && location.pathname !== '/approval-status' && location.pathname !== '/complete-profile') {
      return <Navigate to="/approval-status" replace />;
    }
  }

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  // If logged-in user is a customer, show a sleek top-nav only layout
  if (user?.role === 'customer') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
        {/* Customer Top Nav */}
        <header className="fixed top-0 left-0 right-0 h-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 z-50 px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-xl">
              F
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight text-slate-800 dark:text-white">FlyTowards</span>
              <span className="text-[10px] text-slate-400 font-bold block leading-none">Customer Portal</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <span className="block text-sm font-bold text-slate-700 dark:text-slate-300">{user.name}</span>
              <span className="block text-[10px] text-slate-400 font-bold">Customer Account</span>
            </div>
            <button
              onClick={async () => {
                await dispatch(logoutUser());
                navigate('/login');
              }}
              className="flex items-center gap-2 px-4 py-2 border border-rose-200 text-rose-500 rounded-xl text-xs font-bold hover:bg-rose-50 transition-all"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 mt-20 p-4 sm:p-8 animate-fade-in bg-slate-50/50 dark:bg-slate-900/50">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>

        <NotificationManager />

        <footer className="py-6 px-8 text-center text-slate-400 text-xs border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          &copy; 2026 FlyTowards CRM. All rights reserved.
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex overflow-x-hidden">
      {/* Sidebar - Drawer style on mobile, fixed on desktop */}
      <Sidebar 
        isCollapsed={isSidebarCollapsed} 
        toggleSidebar={toggleSidebar} 
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Backdrop overlay for mobile sidebar */}
      {isMobileSidebarOpen && (
        <div 
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-45 lg:hidden transition-opacity duration-300"
        />
      )}

      {/* Content Area */}
      <div 
        className={cn(
          "flex-1 flex flex-col transition-all duration-300 min-h-screen",
          isSidebarCollapsed ? "lg:ml-20 ml-0" : "lg:ml-64 ml-0"
        )}
      >
        <Navbar 
          isSidebarCollapsed={isSidebarCollapsed} 
          onMenuToggle={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        />

        <main className="flex-1 mt-20 p-4 sm:p-8 animate-fade-in">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
        
        <NotificationManager />
        
        <footer className="py-6 px-8 text-center text-slate-400 text-xs border-t border-slate-100 dark:border-slate-800">
          &copy; 2026 FlyTowards CRM. All rights reserved.
        </footer>
      </div>

      {/* Centered Forced Logout Warning Modal */}
      {forceLogoutNotice && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 dark:border-slate-700 animate-in zoom-in-95 duration-200 text-center">
            <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">Session Terminated</h3>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
              {forceLogoutNotice}
            </p>
            <button
              onClick={() => {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/login';
              }}
              className="w-full py-3 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-lg shadow-indigo-200 dark:shadow-none transition-all transform hover:scale-[1.02] active:scale-[0.98]"
            >
              OK, Go to Login
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MainLayout;
