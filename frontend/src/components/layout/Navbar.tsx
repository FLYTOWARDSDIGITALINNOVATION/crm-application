import React from 'react';
import { Search, Bell, Sun, Moon, Menu, Monitor, LogOut, Edit2 } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useAppDispatch, useAppSelector } from '../../store';
import GlobalSearch from './GlobalSearch';
import { useTheme } from '../ThemeProvider';
import { fetchTasks } from '../../store/slices/taskSlice';
import { fetchEmployees } from '../../store/slices/userSlice';
import { logoutUser } from '../../store/slices/authSlice';
import type { Task } from '../../store/slices/taskSlice';
import { format, isPast, isToday } from 'date-fns';
import { useLocation, useNavigate } from 'react-router-dom';
import EditNotificationModal from '../../features/leads/EditNotificationModal';
import EmployeeLogoutModal from './EmployeeLogoutModal';
import LogoutConfirmModal from './LogoutConfirmModal';

interface NavbarProps {
  isSidebarCollapsed: boolean;
  onMenuToggle?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ isSidebarCollapsed, onMenuToggle }) => {
  const { user } = useAppSelector((state) => state.auth);
  const { items: tasks } = useAppSelector((state) => state.tasks);
  const { employees } = useAppSelector((state) => state.users);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  
  const [isThemeMenuOpen, setIsThemeMenuOpen] = React.useState(false);
  const [isNotifMenuOpen, setIsNotifMenuOpen] = React.useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = React.useState(false);
  const [isStandardLogoutModalOpen, setIsStandardLogoutModalOpen] = React.useState(false);
  const [editingTask, setEditingTask] = React.useState<Task | null>(null);
  
  const themeMenuRef = React.useRef<HTMLDivElement>(null);
  const notifMenuRef = React.useRef<HTMLDivElement>(null);
  
  const initials = user?.name ? user.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : 'U';

  // Filter pending tasks and approvals to show as notifications
  const notifications = React.useMemo(() => {
    const taskNotifs = tasks
      .filter(t => t.status === 'Pending' && t.dueDate)
      .map(t => ({
        id: t.id,
        title: t.title,
        description: t.description || 'Task is pending',
        dueDate: t.dueDate,
        relatedTo: t.relatedTo,
        type: 'task'
      }));

    const approvalNotifs = user?.role === 'superadmin' ? employees
      .filter((emp: any) => emp.approvalStatus === 'Pending')
      .map((emp: any) => ({
        id: `approval_${emp._id}`,
        title: 'Pending Employee Approval',
        description: `${emp.name} is waiting for approval.`,
        dueDate: new Date().toISOString(), // Treat as now
        relatedTo: 'employee-approvals',
        type: 'approval'
      })) : [];

    return [...taskNotifs, ...approvalNotifs]
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 5);
  }, [tasks, employees, user?.role]);

  React.useEffect(() => {
    dispatch(fetchTasks());
    if (user?.role === 'superadmin') {
      dispatch(fetchEmployees());
    }
  }, [dispatch, user?.role]);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (themeMenuRef.current && !themeMenuRef.current.contains(event.target as Node)) {
        setIsThemeMenuOpen(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(event.target as Node)) {
        setIsNotifMenuOpen(false);
      }
    };

    const handleTriggerLogout = () => {
      if (user?.role === 'superadmin') {
        setIsStandardLogoutModalOpen(true);
      } else {
        setIsLogoutModalOpen(true);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('trigger_logout_modal', handleTriggerLogout);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('trigger_logout_modal', handleTriggerLogout);
    };
  }, [user?.role]);

  return (
    <header
      className={cn(
        "fixed top-0 right-0 h-20 glass z-40 transition-all duration-300 px-4 sm:px-8 flex items-center justify-between",
        "left-0 lg:left-64",
        isSidebarCollapsed && "lg:left-20"
      )}
    >
      <div className="flex items-center gap-2 flex-1 max-w-xl">
        <button
          onClick={onMenuToggle}
          className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-all lg:hidden mr-1"
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <GlobalSearch />
      </div>

      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        <div className="relative" ref={themeMenuRef}>
          <button
            onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
            className="p-1.5 sm:p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center justify-center"
            aria-label="Toggle theme"
          >
            {theme === 'system' ? <Monitor className="w-5 h-5" /> : theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </button>
          
          {isThemeMenuOpen && (
            <div className="absolute right-0 mt-2 w-36 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 py-2 z-50 animate-fade-in">
              <button 
                onClick={() => { setTheme('light'); setIsThemeMenuOpen(false); }}
                className={cn("w-full px-4 py-2 text-left text-sm flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700/50", theme === 'light' ? "text-indigo-600 font-bold" : "text-slate-700 dark:text-slate-300")}
              >
                <Sun className="w-4 h-4" /> Light
              </button>
              <button 
                onClick={() => { setTheme('dark'); setIsThemeMenuOpen(false); }}
                className={cn("w-full px-4 py-2 text-left text-sm flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700/50", theme === 'dark' ? "text-indigo-600 font-bold" : "text-slate-700 dark:text-slate-300")}
              >
                <Moon className="w-4 h-4" /> Dark
              </button>
              <button 
                onClick={() => { setTheme('system'); setIsThemeMenuOpen(false); }}
                className={cn("w-full px-4 py-2 text-left text-sm flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700/50", theme === 'system' ? "text-indigo-600 font-bold" : "text-slate-700 dark:text-slate-300")}
              >
                <Monitor className="w-4 h-4" /> System
              </button>
            </div>
          )}
        </div>

        <div className="relative" ref={notifMenuRef}>
          <button 
            onClick={() => setIsNotifMenuOpen(!isNotifMenuOpen)}
            className="p-1.5 sm:p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all relative flex items-center justify-center"
          >
            <Bell className="w-5 h-5" />
            {notifications.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white dark:border-slate-900"></span>
            )}
          </button>
        </div>

        <button
          onClick={() => {
            if (user?.role === 'superadmin') {
              setIsStandardLogoutModalOpen(true);
            } else {
              setIsLogoutModalOpen(true);
            }
          }}
          className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50/80 px-2 sm:px-3 py-1.5 text-rose-600 shadow-sm transition-all hover:bg-rose-100 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-400 dark:hover:bg-rose-900/50 cursor-pointer shrink-0"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span className="hidden sm:inline text-xs sm:text-sm font-bold">Logout</span>
        </button>

        <button
          type="button"
          onClick={() => {
            if (user?.role === 'employee') {
              navigate(`${location.pathname}?profile=true`, { replace: true });
            }
          }}
          className="hidden sm:flex items-center gap-2 p-1 pr-2.5 rounded-xl bg-slate-100/80 dark:bg-slate-900/70 transition-all hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer shrink-0"
          title={user?.role === 'employee' ? 'Open your profile' : undefined}
        >
          <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-700 dark:text-indigo-400 font-bold border border-indigo-200 dark:border-indigo-800/50 text-xs">
            {initials}
          </div>
          <div className="flex flex-col items-start leading-tight">
            <span className="text-xs font-semibold text-slate-900 dark:text-white">{user?.name || 'User'}</span>
            <span className="text-[9px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">{user?.role || 'Staff'}</span>
          </div>
        </button>
      </div>

      <EditNotificationModal 
        isOpen={!!editingTask}
        onClose={() => setEditingTask(null)}
        task={editingTask}
      />

      <EmployeeLogoutModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
      />

      <LogoutConfirmModal
        isOpen={isStandardLogoutModalOpen}
        onClose={() => setIsStandardLogoutModalOpen(false)}
        onConfirm={async () => {
          setIsStandardLogoutModalOpen(false);
          await dispatch(logoutUser());
          navigate('/login');
        }}
      />
    </header>
  );
};

export default Navbar;
