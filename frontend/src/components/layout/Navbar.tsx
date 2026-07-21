import React from 'react';
import { Search, Bell, Sun, Moon, Clock, Menu, Monitor } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useAppDispatch, useAppSelector } from '../../store';
import GlobalSearch from './GlobalSearch';
import { useTheme } from '../ThemeProvider';
import { fetchTasks, deleteTask } from '../../store/slices/taskSlice';
import type { Task } from '../../store/slices/taskSlice';
import { format, isPast, isToday } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import EditNotificationModal from '../../features/leads/EditNotificationModal';
import { Edit2, Trash2 } from 'lucide-react';

interface NavbarProps {
  isSidebarCollapsed: boolean;
  onMenuToggle?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ isSidebarCollapsed, onMenuToggle }) => {
  const { user } = useAppSelector((state) => state.auth);
  const { items: tasks } = useAppSelector((state) => state.tasks);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { theme, setTheme, isDark } = useTheme();
  
  const [isThemeMenuOpen, setIsThemeMenuOpen] = React.useState(false);
  const [isNotifMenuOpen, setIsNotifMenuOpen] = React.useState(false);
  const [editingTask, setEditingTask] = React.useState<Task | null>(null);
  
  const themeMenuRef = React.useRef<HTMLDivElement>(null);
  const notifMenuRef = React.useRef<HTMLDivElement>(null);
  
  const initials = user?.name ? user.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : 'U';

  // Filter pending tasks to show as notifications
  const notifications = React.useMemo(() => {
    return tasks
      .filter(t => t.status === 'Pending' && t.dueDate)
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 5);
  }, [tasks]);

  React.useEffect(() => {
    dispatch(fetchTasks());
  }, [dispatch]);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (themeMenuRef.current && !themeMenuRef.current.contains(event.target as Node)) {
        setIsThemeMenuOpen(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(event.target as Node)) {
        setIsNotifMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

      <div className="flex items-center gap-4">
        <div className="relative" ref={themeMenuRef}>
          <button
            onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
            className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center justify-center"
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
            className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all relative flex items-center justify-center"
          >
            <Bell className="w-5 h-5" />
            {notifications.length > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white dark:border-slate-900"></span>
            )}
          </button>

          {isNotifMenuOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden z-50 animate-fade-in flex flex-col">
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center">
                <span className="font-bold text-sm text-slate-900 dark:text-white">Notifications</span>
                {notifications.length > 0 && (
                  <span className="bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {notifications.length} New
                  </span>
                )}
              </div>
              
              <div className="max-h-[350px] overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map(notif => {
                    const due = new Date(notif.dueDate);
                    const isValidDate = !isNaN(due.getTime());
                    const past = isValidDate ? isPast(due) : false;
                    const today = isValidDate ? isToday(due) : false;
                    return (
                      <div 
                        key={notif.id} 
                        onClick={() => {
                          setIsNotifMenuOpen(false);
                          if (notif.relatedTo) navigate(`/leads/${notif.relatedTo}`);
                          else navigate('/tasks');
                        }}
                        className="p-4 border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors cursor-pointer group flex flex-col"
                      >
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                            {notif.title}
                          </h4>
                        </div>
                        {notif.description && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                            {notif.description}
                          </p>
                        )}
                        <div className="flex items-center justify-between mt-3">
                          <span className={cn(
                            "text-[10px] font-bold px-2 py-1 rounded-md whitespace-nowrap",
                            past ? "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400" :
                            today ? "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" :
                            "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400"
                          )}>
                            {isValidDate ? format(due, 'MMM d, h:mm a') : 'No Date'}
                          </span>
                          
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsNotifMenuOpen(false);
                                setEditingTask(notif);
                              }}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 bg-white dark:bg-slate-800 shadow-sm rounded-md transition-colors border border-slate-200 dark:border-slate-700"
                              title="Edit notification"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-8 text-center flex flex-col items-center justify-center text-slate-500 dark:text-slate-400">
                    <Bell className="w-8 h-8 mb-2 opacity-20" />
                    <p className="text-sm">No new notifications</p>
                  </div>
                )}
              </div>
              
              {notifications.length > 0 && (
                <a href="/tasks" className="block text-center text-xs font-bold text-indigo-600 dark:text-indigo-400 py-3 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                  View All Tasks
                </a>
              )}
            </div>
          )}
        </div>

        <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 mx-2"></div>

        <button className="flex items-center gap-3 p-1.5 pr-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
          <div className="w-9 h-9 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-700 dark:text-indigo-400 font-bold border border-indigo-200 dark:border-indigo-800/50">
            {initials}
          </div>
          <div className="hidden sm:flex flex-col items-start leading-tight">
            <span className="text-sm font-semibold text-slate-900 dark:text-white">{user?.name || 'User'}</span>
            <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">{user?.role || 'Staff'}</span>
          </div>
        </button>
      </div>

      <EditNotificationModal 
        isOpen={!!editingTask}
        onClose={() => setEditingTask(null)}
        task={editingTask}
      />
    </header>
  );
};

export default Navbar;
