import React, { useState } from 'react';
import { 
  Users, Mail, Phone, Building2, Calendar, 
  Search, Download,
  ArrowUpRight, Star, ExternalLink
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../../utils/cn';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchCustomers } from '../../store/slices/customerSlice';

const CustomerList: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { items: customers, isLoading } = useAppSelector((state) => state.customers);
  const [searchTerm, setSearchTerm] = useState('');

  React.useEffect(() => {
    dispatch(fetchCustomers());
  }, [dispatch]);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'VIP': return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/50';
      case 'Active': return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50';
      case 'Inactive': return 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/50';
      default: return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  const filteredCustomers = customers.filter(customer => 
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (customer.company && customer.company.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalSpent = customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0);

  const handleExport = () => {
    if (customers.length === 0) return;

    // CSV Headers
    const headers = ['Name', 'Email', 'Phone', 'Company', 'Sector', 'Status', 'Total Spent', 'Joined At'];
    
    // CSV Rows
    const rows = filteredCustomers.map(c => [
      c.name,
      c.email,
      c.phone || '',
      c.company || '',
      c.sector || '',
      c.status,
      c.totalSpent,
      new Date(c.joinedAt).toLocaleDateString()
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `customers_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading && customers.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Customer Directory</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Manage your long-term business relationships and lifetime value.</p>
        </div>
        {user?.role === 'superadmin' && (
          <div className="flex items-center gap-3">
            <button 
              onClick={handleExport}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export data</span>
            </button>
          </div>
        )}
      </div>

      {/* KPI Cards for Customers - Only for superadmin */}
      {user?.role === 'superadmin' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass p-6 rounded-2xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <span className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider">Total Customers</span>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{customers.length}</h3>
            </div>
          </div>
          <div className="glass p-6 rounded-2xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <ArrowUpRight className="w-6 h-6" />
            </div>
            <div>
              <span className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider">Retention Rate</span>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">94.2%</h3>
            </div>
          </div>
          <div className="glass p-6 rounded-2xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Star className="w-6 h-6" />
            </div>
            <div>
              <span className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider">Total Revenue</span>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">₹{(totalSpent / 1000).toFixed(1)}k</h3>
            </div>
          </div>
        </div>
      )}

      {/* Search & Filter */}
      <div className="glass p-4 rounded-2xl">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Search by customer name or company..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Grid Layout for Customers */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {filteredCustomers.map((customer) => (
          <div key={customer._id} className="glass p-6 rounded-3xl group hover:shadow-2xl dark:hover:shadow-indigo-900/10 transition-all duration-300 border-2 border-transparent hover:border-indigo-100 dark:hover:border-indigo-900/50">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 font-bold text-xl group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                  {customer.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{customer.name}</h3>
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-bold border",
                      getStatusStyle(customer.status)
                    )}>
                      {customer.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 text-sm mt-0.5 font-medium">
                    <Building2 className="w-3 h-3" />
                    {customer.company || 'No Company'}
                  </div>
                </div>
              </div>
              <Link 
                to={`/customers/${customer._id}`}
                className="p-2 text-slate-300 dark:text-slate-600 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-xl transition-all"
              >
                <ExternalLink className="w-5 h-5" />
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-8">
              {user?.role === 'superadmin' ? (
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-widest">Total Spent</span>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">₹{customer.totalSpent?.toLocaleString() || 0}</p>
                </div>
              ) : (
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-widest">Status</span>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{customer.status}</p>
                </div>
              )}
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-widest">Sector</span>
                <p className="text-sm font-bold text-slate-900 dark:text-white">{customer.sector || 'N/A'}</p>
              </div>
            </div>

            <div className="h-px bg-slate-100 dark:bg-slate-700/50 my-6"></div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-1.5 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer transition-colors">
                  <Mail className="w-4 h-4" />
                </div>
                <div className="flex items-center gap-1.5 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer transition-colors">
                  <Phone className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 text-xs font-medium italic">
                <Calendar className="w-3.5 h-3.5" />
                Joined {new Date(customer.joinedAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CustomerList;
