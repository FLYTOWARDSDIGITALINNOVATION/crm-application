import React from 'react';
import { Search, Bell, Sun, Moon, Clock, Menu } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useAppSelector } from '../../store';

interface NavbarProps {
  isSidebarCollapsed: boolean;
  onMenuToggle?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ isSidebarCollapsed, onMenuToggle }) => {
  const { user } = useAppSelector((state) => state.auth);
  const [isDark, setIsDark] = React.useState(false);
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
    : '??';

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  // Handle shortcut for search (Cmd+K or Ctrl+K)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
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

        <div 
          className="relative group cursor-pointer flex-1 max-w-[160px] sm:max-w-md"
          onClick={() => setIsSearchOpen(true)}
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          <input
            type="text"
            readOnly
            placeholder="Search... (⌘K)"
            className="w-full pl-9 pr-4 py-2 bg-slate-100 border-none rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 transition-all duration-200 cursor-pointer pointer-events-none"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-all"
          aria-label="Toggle theme"
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        <div className="relative">
          <button className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-all relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
          </button>
        </div>

        <div className="h-8 w-px bg-slate-200 mx-2"></div>

        <button className="flex items-center gap-3 p-1.5 pr-3 rounded-xl hover:bg-slate-100 transition-all">
          <div className="w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold border border-indigo-200">
            {initials}
          </div>
          <div className="hidden sm:flex flex-col items-start leading-tight">
            <span className="text-sm font-semibold text-slate-900">{user?.name || 'User'}</span>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{user?.role || 'Staff'}</span>
          </div>
        </button>
      </div>

      {/* Global Search Overlay (Mockup) */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in" onClick={() => setIsSearchOpen(false)}>
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100 flex items-center gap-4">
              <Search className="w-6 h-6 text-indigo-500" />
              <input 
                autoFocus 
                placeholder="Search leads, tasks, or customers..." 
                className="flex-1 bg-transparent border-none text-lg focus:ring-0 outline-none"
              />
              <div className="px-2 py-1 bg-slate-100 text-slate-400 text-[10px] font-black rounded-lg">ESC</div>
            </div>
            <div className="p-4 max-h-[400px] overflow-y-auto">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 mb-2">Recent Searches</div>
              <div className="space-y-1">
                {['Alice Johnson', 'TechCorp Proposal', 'Invoice #284'].map((item) => (
                  <div key={item} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 cursor-pointer transition-all group">
                    <Clock className="w-4 h-4 text-slate-300 group-hover:text-indigo-500" />
                    <span className="text-sm font-medium text-slate-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
