import React, { useState } from 'react';
import { Outlet, Navigate, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { cn } from '../../utils/cn';
import { useAppDispatch, useAppSelector } from '../../store';
import { logout } from '../../store/slices/authSlice';
import { LogOut } from 'lucide-react';

const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  // If logged-in user is a customer, show a sleek top-nav only layout
  if (user?.role === 'customer') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        {/* Customer Top Nav */}
        <header className="fixed top-0 left-0 right-0 h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 z-50 px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-xl">
              F
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight text-slate-800">FlyTowards</span>
              <span className="text-[10px] text-slate-400 font-bold block leading-none">Customer Portal</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <span className="block text-sm font-bold text-slate-700">{user.name}</span>
              <span className="block text-[10px] text-slate-400 font-bold">Customer Account</span>
            </div>
            <button
              onClick={() => {
                dispatch(logout());
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
        <main className="flex-1 mt-20 p-4 sm:p-8 animate-fade-in bg-slate-50/50">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>

        <footer className="py-6 px-8 text-center text-slate-400 text-xs border-t border-slate-100 bg-white">
          &copy; 2026 FlyTowards CRM. All rights reserved.
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex overflow-x-hidden">
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
        
        <footer className="py-6 px-8 text-center text-slate-400 text-xs border-t border-slate-100">
          &copy; 2026 FlyTowards CRM. All rights reserved.
        </footer>
      </div>
    </div>
  );
};

export default MainLayout;
