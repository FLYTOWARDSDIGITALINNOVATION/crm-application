import React from 'react';
import logo from '../../assets/logo.jpg';
import { NavLink } from 'react-router-dom';
import { 
  BarChart3, 
  Users, 
  Target, 
  CheckSquare, 
  MessageSquare, 
  ChevronLeft, 
  ChevronRight,
  LayoutDashboard,
  BookOpen,
  CalendarDays,
  ShieldCheck,
  Bell,
  Building2
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useAppSelector } from '../../store';
import { isDigitalMarketingEmployee } from '../../utils/employee';

interface SidebarProps {
  isCollapsed: boolean;
  toggleSidebar: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, toggleSidebar, isMobileOpen, onCloseMobile }) => {
  const { user } = useAppSelector((state) => state.auth);
  const isMarketing = isDigitalMarketingEmployee(user);

  let navItems = [
    { title: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { title: 'Leads', icon: Target, path: '/leads' },
    { title: 'Tasks', icon: CheckSquare, path: '/tasks' },
    { title: 'Support', icon: MessageSquare, path: '/support' },
    { title: 'Analytics', icon: BarChart3, path: '/analytics' },
  ];

  if (user?.role === 'employee') {
    navItems = [
      { title: 'Dashboard', icon: LayoutDashboard, path: '/' },
      ...(isMarketing ? [{ title: 'Leads', icon: Target, path: '/leads' }] : []),
      { title: 'Tasks', icon: CheckSquare, path: '/tasks' },
      { title: 'Support', icon: MessageSquare, path: '/support' },
    ];
  } else if (user?.role === 'admin') {
    navItems = navItems.filter(item => item.title !== 'Analytics');
    navItems.push({ title: 'Employees', icon: Users, path: '/employees' });
    navItems.push({ title: 'Employee Approvals', icon: Bell, path: '/employee-approvals' });
    navItems.push({ title: 'Projects', icon: BookOpen, path: '/projects' });
    navItems.push({ title: 'Customers', icon: Building2, path: '/customers' });
    navItems.push({ title: 'Leaves', icon: CalendarDays, path: '/leaves' });
  } else if (user?.role === 'superadmin') {
    navItems = [
      { title: 'Monitoring', icon: ShieldCheck, path: '/super-admin' },
      { title: 'Leads', icon: Target, path: '/leads' },
      { title: 'Tasks', icon: CheckSquare, path: '/tasks' },
      { title: 'Support', icon: MessageSquare, path: '/support' },
      { title: 'Employees', icon: Users, path: '/employees' },
      { title: 'Projects', icon: BookOpen, path: '/projects' },
      { title: 'Customers', icon: Building2, path: '/customers' },
      { title: 'Employee Approvals', icon: Bell, path: '/employee-approvals' },
      { title: 'Leaves', icon: CalendarDays, path: '/leaves' }
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
        {/* Mobile Logo (Drawer is full width) */}
        <div className="flex items-center gap-2 lg:hidden">
          <img src={logo} alt="Fly-Towards Logo" className="w-8 h-8 rounded-lg object-contain bg-white" />
          <span className="font-bold text-xl tracking-tight text-slate-800 dark:text-white">FlyTowards</span>
        </div>
        {/* Desktop Logo */}
        <div className="hidden lg:flex lg:items-center lg:justify-center w-full">
          {isCollapsed ? (
            <img src={logo} alt="Fly-Towards Logo" className="w-8 h-8 rounded-lg object-contain bg-white" />
          ) : (
            <div className="flex items-center gap-2">
              <img src={logo} alt="Fly-Towards Logo" className="w-8 h-8 rounded-lg object-contain bg-white" />
              <span className="font-bold text-xl tracking-tight text-slate-800 dark:text-white">FlyTowards</span>
            </div>
          )}
        </div>
      </div>

      <nav className={cn(
        "flex-1 px-4 space-y-2 mt-4 min-h-0",
        isCollapsed ? "overflow-visible" : "overflow-y-auto overflow-x-hidden"
      )}>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={onCloseMobile}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative",
                isActive 
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900/50" 
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
              )
            }
          >
            <item.icon className="w-5 h-5 min-w-[20px]" />
            <span className={cn("font-medium", isCollapsed ? "lg:hidden block" : "block")}>{item.title}</span>
            
            {/* Hover Tooltip / Label */}
            {isCollapsed && (
              <div className="absolute left-16 invisible opacity-0 lg:group-hover:visible lg:group-hover:opacity-100 transition-all duration-200 bg-slate-900/95 dark:bg-slate-800/95 text-white text-xs font-semibold px-3 py-2 rounded-lg shadow-lg pointer-events-none whitespace-nowrap z-[60] ml-2 transform translate-x-2 lg:group-hover:translate-x-0">
                {item.title}
                {/* Tooltip arrow */}
                <div className="absolute top-1/2 -left-1 -translate-y-1/2 border-y-4 border-y-transparent border-r-4 border-r-slate-900 dark:border-r-slate-800"></div>
              </div>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;
