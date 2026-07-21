import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, User, Briefcase, CheckSquare, X, Clock } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../store';
import { fetchLeads } from '../../store/slices/leadSlice';
import { fetchCustomers } from '../../store/slices/customerSlice';
import { fetchTasks } from '../../store/slices/taskSlice';

const GlobalSearch: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { items: leads } = useAppSelector((state) => state.leads);
  const { items: customers } = useAppSelector((state) => state.customers);
  const { items: tasks } = useAppSelector((state) => state.tasks);

  // Fetch all data when search opens
  useEffect(() => {
    if (isOpen) {
      dispatch(fetchLeads());
      dispatch(fetchCustomers());
      dispatch(fetchTasks());
    }
  }, [isOpen, dispatch]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchResults = useMemo(() => {
    if (!query.trim()) return { leads: [], customers: [], tasks: [] };
    
    const lowerQuery = query.toLowerCase();

    const filteredLeads = leads.filter(
      (l) => 
        l.name.toLowerCase().includes(lowerQuery) || 
        l.email.toLowerCase().includes(lowerQuery) ||
        (l.company && l.company.toLowerCase().includes(lowerQuery))
    ).slice(0, 4);

    const filteredCustomers = customers.filter(
      (c) => 
        c.name.toLowerCase().includes(lowerQuery) || 
        c.email.toLowerCase().includes(lowerQuery) ||
        (c.company && c.company.toLowerCase().includes(lowerQuery))
    ).slice(0, 4);

    const filteredTasks = tasks.filter(
      (t) => 
        t.title.toLowerCase().includes(lowerQuery) || 
        (t.description && t.description.toLowerCase().includes(lowerQuery))
    ).slice(0, 4);

    return { leads: filteredLeads, customers: filteredCustomers, tasks: filteredTasks };
  }, [query, leads, customers, tasks]);

  const handleNavigate = (path: string) => {
    navigate(path);
    setIsOpen(false);
    setQuery('');
  };

  const hasResults = searchResults.leads.length > 0 || searchResults.customers.length > 0 || searchResults.tasks.length > 0;

  return (
    <div className="relative group flex-1 max-w-[160px] sm:max-w-md" ref={dropdownRef}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          if (!isOpen) setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        placeholder="Search..."
        className="w-full pl-9 pr-8 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-indigo-500 transition-all duration-200 outline-none"
      />
      {query && (
        <button 
          onClick={() => {
            setQuery('');
            setIsOpen(false);
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors"
        >
          <X className="w-3 h-3" />
        </button>
      )}

      {/* Dropdown Results */}
      {isOpen && query.trim() && (
        <div className="absolute top-full left-0 mt-2 w-full sm:w-[500px] max-h-[70vh] bg-white dark:bg-slate-800 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-700 overflow-y-auto z-50 animate-slide-up">
          <div className="p-2 sm:p-4">
            {!hasResults ? (
              <div className="p-4 text-center text-slate-400 dark:text-slate-500">
                <p className="text-sm">No results found for "{query}".</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Leads */}
                {searchResults.leads.length > 0 && (
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-2 mb-2">Leads</div>
                    <div className="space-y-1">
                      {searchResults.leads.map((lead) => (
                        <div 
                          key={lead._id} 
                          onClick={() => handleNavigate(`/leads/${lead._id}`)}
                          className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-all group"
                        >
                          <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                            <User className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                              {lead.name}
                            </div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{lead.email}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Customers */}
                {searchResults.customers.length > 0 && (
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-2 mb-2">Customers</div>
                    <div className="space-y-1">
                      {searchResults.customers.map((customer) => (
                        <div 
                          key={customer._id} 
                          onClick={() => handleNavigate(`/customers/${customer._id}`)}
                          className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-all group"
                        >
                          <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                            <Briefcase className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                              {customer.name}
                            </div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{customer.email}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tasks */}
                {searchResults.tasks.length > 0 && (
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-2 mb-2">Tasks</div>
                    <div className="space-y-1">
                      {searchResults.tasks.map((task) => (
                        <div 
                          key={task.id} 
                          onClick={() => handleNavigate('/tasks')}
                          className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-all group"
                        >
                          <div className="w-8 h-8 rounded-full bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                            <CheckSquare className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                              {task.title}
                            </div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{task.description || task.status}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;
