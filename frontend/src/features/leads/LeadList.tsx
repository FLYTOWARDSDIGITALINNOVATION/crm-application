import React, { useState } from 'react';
import { 
  Search, Filter, Plus, MoreHorizontal, 
  Mail, Building2, Calendar,
  ChevronLeft, ChevronRight, Download, Trash2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchLeads, deleteLead } from '../../store/slices/leadSlice';
import { cn } from '../../utils/cn';

const formatDate = (raw: string) => {
  if (!raw) return '—';
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const LeadList: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { items: leads, isLoading } = useAppSelector((state) => state.leads);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  React.useEffect(() => {
    dispatch(fetchLeads());
  }, [dispatch]);

  const statusColors = {
    'New': 'bg-blue-50 text-blue-700 border-blue-100',
    'Contacted': 'bg-amber-50 text-amber-700 border-amber-100',
    'Qualified': 'bg-indigo-50 text-indigo-700 border-indigo-100',
    'Lost': 'bg-slate-50 text-slate-700 border-slate-100',
    'Converted': 'bg-emerald-50 text-emerald-700 border-emerald-100',
    'Proposal': 'bg-violet-50 text-violet-700 border-violet-100',
    'Negotiation': 'bg-rose-50 text-rose-700 border-rose-100',
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (lead.company && lead.company.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'All' || lead.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleExport = () => {
    if (filteredLeads.length === 0) {
      alert('No leads to export');
      return;
    }

    const headers = ['Name', 'Email', 'Phone', 'Company', 'Status', 'Source', 'Created At'];
    const csvContent = [
      headers.join(','),
      ...filteredLeads.map(lead => [
        `"${lead.name || ''}"`,
        `"${lead.email || ''}"`,
        `"${lead.phone || ''}"`,
        `"${lead.company || ''}"`,
        `"${lead.status || ''}"`,
        `"${lead.source || ''}"`,
        `"${lead.createdAt || ''}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `leads_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this lead?')) {
      try {
        await dispatch(deleteLead(id)).unwrap();
      } catch (error) {
        console.error('Failed to delete lead:', error);
      }
    }
  };

  if (isLoading && leads.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Leads Management</h1>
          <p className="text-slate-500 text-sm">Track and manage your potential customers lifecycle.</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
          <button 
            onClick={() => navigate('/leads/create')}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-indigo-600 rounded-xl text-sm font-semibold text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add New Lead</span>
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="glass p-4 rounded-2xl flex flex-col gap-4">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search leads by name, email, or company..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <div className="flex items-center gap-2 mr-2 border-r border-slate-200 pr-3 shrink-0">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-medium text-slate-500 whitespace-nowrap">Filter:</span>
          </div>
          {['All', 'New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Converted', 'Lost'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap shrink-0",
                statusFilter === status 
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-100" 
                  : "text-slate-500 hover:bg-slate-50"
              )}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {filteredLeads.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center text-slate-400 text-sm">No leads found.</div>
        ) : filteredLeads.map((lead) => (
          <div
            key={lead._id}
            className="glass rounded-2xl p-4 cursor-pointer hover:shadow-md transition-all"
            onClick={() => navigate(`/leads/${lead._id}`)}
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-900 truncate">{lead.name}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                  <span className="text-xs text-slate-500 truncate">{lead.email}</span>
                </div>
              </div>
              <span className={cn(
                "px-2.5 py-1 rounded-full text-xs font-bold border shrink-0",
                statusColors[lead.status as keyof typeof statusColors]
              )}>
                {lead.status}
              </span>
            </div>
            <div className="flex flex-col gap-1.5 text-xs text-slate-500">
              <div className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{lead.company || '—'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="whitespace-nowrap">{formatDate(lead.createdAt)}</span>
              </div>
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
              <span className="text-xs text-slate-400 font-medium">Source: {lead.source || '—'}</span>
              <button
                onClick={(e) => handleDelete(e, lead._id)}
                className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                title="Delete Lead"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block glass rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Lead Info</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Company</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Source</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Created At</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLeads.map((lead) => (
                <tr 
                  key={lead._id} 
                  className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                  onClick={() => navigate(`/leads/${lead._id}`)}
                >
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{lead.name}</span>
                      <div className="flex items-center gap-2 mt-1">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span className="text-xs text-slate-500">{lead.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-slate-400" />
                      <span className="text-sm font-medium text-slate-700">{lead.company}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2.5 py-1 rounded-full text-xs font-bold border",
                      statusColors[lead.status as keyof typeof statusColors]
                    )}>
                      {lead.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-600">{lead.source}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Calendar className="w-4 h-4" />
                      {formatDate(lead.createdAt)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={(e) => handleDelete(e, lead._id)}
                        className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                        title="Delete Lead"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 sm:px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Showing {filteredLeads.length} leads</span>
          <div className="flex items-center gap-2">
            <button className="p-2 text-slate-400 hover:text-slate-900 bg-white border border-slate-200 rounded-lg disabled:opacity-50" disabled>
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1">
              <button className="w-8 h-8 flex items-center justify-center text-sm font-bold bg-indigo-600 text-white rounded-lg shadow-sm">1</button>
              <button className="w-8 h-8 flex items-center justify-center text-sm font-bold text-slate-500 hover:bg-white hover:shadow-sm rounded-lg">2</button>
              <button className="w-8 h-8 flex items-center justify-center text-sm font-bold text-slate-500 hover:bg-white hover:shadow-sm rounded-lg">3</button>
            </div>
            <button className="p-2 text-slate-400 hover:text-slate-900 bg-white border border-slate-200 rounded-lg">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeadList;
