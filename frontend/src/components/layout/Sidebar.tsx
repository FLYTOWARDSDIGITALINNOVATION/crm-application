import React from 'react';
import logo from '../../assets/logo.jpg';
import { NavLink } from 'react-router-dom';
import { 
  BarChart3, 
  Users, 
  UserPlus, 
  CheckSquare, 
  MessageSquare, 
  ChevronLeft, 
  ChevronRight,
  LogOut,
  LayoutDashboard,
  FolderKanban,
  CalendarDays,
  ShieldCheck
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useAppDispatch, useAppSelector } from '../../store';
import { logoutUser } from '../../store/slices/authSlice';
import { useNavigate } from 'react-router-dom';
import EmployeeLogoutModal from './EmployeeLogoutModal';

interface SidebarProps {
  isCollapsed: boolean;
  toggleSidebar: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, toggleSidebar, isMobileOpen, onCloseMobile }) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = React.useState(false);

  const handleLogout = () => {
    if (user?.role === 'employee') {
      setIsLogoutModalOpen(true);
      return;
    }

    dispatch(logout());
    dispatch(logoutUser());
    navigate('/login');
  };

  let navItems = [
    { title: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { title: 'Leads', icon: UserPlus, path: '/leads' },
    { title: 'Customers', icon: Users, path: '/customers' },
    { title: 'Tasks', icon: CheckSquare, path: '/tasks' },
    { title: 'Support', icon: MessageSquare, path: '/support' },
    { title: 'Analytics', icon: BarChart3, path: '/analytics' },
  ];

  if (user?.role === 'employee') {
    navItems = [
      { title: 'Dashboard', icon: LayoutDashboard, path: '/' },
      { title: 'Projects', icon: FolderKanban, path: '/projects' },
      { title: 'Leaves', icon: CalendarDays, path: '/leaves' },
      { title: 'Support', icon: MessageSquare, path: '/support' },
    ];
  } else if (user?.role === 'admin') {
    navItems.push({ title: 'Employees', icon: Users, path: '/employees' });
    navItems.push({ title: 'Projects', icon: FolderKanban, path: '/projects' });
    navItems.push({ title: 'Leaves', icon: CalendarDays, path: '/leaves' });
  } else if (user?.role === 'superadmin') {
    navItems = [
      { title: 'Monitoring', icon: ShieldCheck, path: '/super-admin' },
    ];
  }

  return (
    <div
      className={cn(
        "fixed left-0 top-0 h-screen glass z-50 transition-all duration-300 flex flex-col",
        "w-64 -translate-x-full lg:translate-x-0",
        isMobileOpen && "translate-x-0",
        isCollapsed ? "lg:w-20" : "lg:w-64"
      )}
    >
      <div className="flex items-center justify-between p-6">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <img src={logo} alt="Fly-Towards Logo" className="w-8 h-8 rounded-lg object-contain bg-white" />
            <span className="font-bold text-xl tracking-tight text-slate-800 dark:text-white">FlyTowards</span>
          </div>
        )}
        {isCollapsed && (
          <img src={logo} alt="Fly-Towards Logo" className="w-8 h-8 rounded-lg object-contain bg-white mx-auto" />
        )}
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={onCloseMobile}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group",
                isActive 
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900/50" 
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
              )
            }
          >
            <item.icon className="w-5 h-5 min-w-[20px]" />
            <span className={cn("font-medium", isCollapsed ? "lg:hidden block" : "block")}>{item.title}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
        <button
          onClick={toggleSidebar}
          className="hidden lg:flex items-center gap-3 w-full px-3 py-3 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 transition-all duration-200"
        >
          {isCollapsed ? <ChevronRight className="w-5 h-5 mx-auto" /> : (
            <>
              <ChevronLeft className="w-5 h-5" />
              <span className="font-medium">Collapse Sidebar</span>
            </>
          )}
        </button>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-3 rounded-xl text-rose-500 hover:bg-rose-50/50 dark:hover:bg-rose-900/20 transition-all duration-200"
        >
          <LogOut className="w-5 h-5" />
          <span className={cn("font-medium", isCollapsed ? "lg:hidden block" : "block")}>Logout</span>
        </button>
      </div>

      <EmployeeLogoutModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
      />
    </div>
  );
};

export default Sidebar;
