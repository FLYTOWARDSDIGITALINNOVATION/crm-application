import React, { useEffect, useMemo } from 'react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, PieChart, Pie, Cell 
} from 'recharts';
import { 
  Users, UserPlus, TrendingUp, DollarSign, 
  ArrowUpRight, ArrowDownRight, MoreVertical 
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useAppSelector, useAppDispatch } from '../../store';
import { fetchLeads } from '../../store/slices/leadSlice';
import { fetchCustomers } from '../../store/slices/customerSlice';

const Dashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const leads = useAppSelector((state) => state.leads.items);
  const customers = useAppSelector((state) => state.customers.items);

  // Fetch data on mount if not already loaded
  useEffect(() => {
    if (leads.length === 0) dispatch(fetchLeads());
    if (customers.length === 0) dispatch(fetchCustomers());
  }, [dispatch]);

  // Compute real stats
  const totalLeads = leads.length;
  const convertedLeads = leads.filter((l) => l.status === 'Converted').length;
  const conversionRate = totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(1) : '0.0';
  const leadsWithValue = leads.filter((l) => l.value && l.value > 0);
  const avgDealSize = leadsWithValue.length > 0
    ? Math.round(leadsWithValue.reduce((sum, l) => sum + (l.value || 0), 0) / leadsWithValue.length)
    : 0;

  const stats = [
    { title: 'Total Leads', value: totalLeads.toLocaleString(), change: '', isPositive: true, icon: UserPlus, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { title: 'Converted', value: convertedLeads.toLocaleString(), change: '', isPositive: true, icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { title: 'Conversion Rate', value: `${conversionRate}%`, change: '', isPositive: true, icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'Avg Deal Size', value: avgDealSize > 0 ? `₹${avgDealSize.toLocaleString()}` : 'N/A', change: '', isPositive: true, icon: DollarSign, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  // Build monthly chart data from real lead creation dates (last 6 months)
  const monthlyData = useMemo(() => {
    const now = new Date();
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
      return {
        name: d.toLocaleString('default', { month: 'short' }),
        year: d.getFullYear(),
        month: d.getMonth(),
        leads: 0,
        customers: 0,
      };
    });

    leads.forEach((lead) => {
      const d = new Date(lead.createdAt);
      const entry = months.find((m) => m.year === d.getFullYear() && m.month === d.getMonth());
      if (entry) entry.leads += 1;
    });

    customers.forEach((customer) => {
      const d = new Date(customer.createdAt);
      const entry = months.find((m) => m.year === d.getFullYear() && m.month === d.getMonth());
      if (entry) entry.customers += 1;
    });

    return months;
  }, [leads, customers]);

  // Build lead source data from real leads
  const sourceData = useMemo(() => {
    const sourceCounts: Record<string, number> = {};
    leads.forEach((lead) => {
      const source = lead.source || 'Unknown';
      sourceCounts[source] = (sourceCounts[source] || 0) + 1;
    });
    const entries = Object.entries(sourceCounts).map(([name, value]) => ({ name, value }));
    return entries.length > 0 ? entries : [{ name: 'No Data', value: 1 }];
  }, [leads]);

  const totalSourceValue = sourceData.reduce((sum, s) => sum + s.value, 0);

  const COLORS = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Dashboard Overview</h1>
          <p className="text-slate-500">Welcome back, John! Here's what's happening today.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all">
            Export CSV
          </button>
          <button className="px-4 py-2 bg-indigo-600 rounded-xl text-sm font-semibold text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all">
            Add New Lead
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="glass p-6 rounded-2xl hover:translate-y-[-4px] transition-all duration-300">
            <div className="flex items-start justify-between">
              <div className={cn("p-3 rounded-xl", stat.bg)}>
                <stat.icon className={cn("w-6 h-6", stat.color)} />
              </div>
              {stat.change && (
                <div className={cn(
                  "flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full",
                  stat.isPositive ? "text-emerald-600 bg-emerald-50" : "text-rose-600 bg-rose-50"
                )}>
                  {stat.isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {stat.change}
                </div>
              )}
            </div>
            <div className="mt-4">
              <span className="text-slate-500 text-sm font-medium">{stat.title}</span>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold text-slate-900">Lead Conversion Growth</h3>
            <button className="p-2 text-slate-400 hover:text-slate-600">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} 
                />
                <Area type="monotone" dataKey="leads" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorLeads)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass p-6 rounded-2xl">
          <h3 className="text-lg font-bold text-slate-900 mb-8">Leads by Source</h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sourceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {sourceData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-6 space-y-3">
            {sourceData.map((source, index) => (
              <div key={source.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{backgroundColor: COLORS[index]}}></div>
                  <span className="text-slate-600">{source.name}</span>
                </div>
                <span className="font-bold text-slate-900">{totalSourceValue > 0 ? ((source.value / totalSourceValue) * 100).toFixed(0) : 0}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
