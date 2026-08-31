import React, { useState } from 'react';
import { 
  Search, Filter, Plus, MoreHorizontal, 
  Mail, Phone, Building2, Calendar,
  ChevronLeft, ChevronRight, Download, Trash2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchLeads, deleteLead, updateLead } from '../../store/slices/leadSlice';
import { cn } from '../../utils/cn';
import { isDigitalMarketingEmployee } from '../../utils/employee';
import ScheduleNotificationModal from './ScheduleNotificationModal';
import StatusDropdown from './StatusDropdown';
import SourceDropdown from './SourceDropdown';
import DeleteConfirmationModal from './DeleteConfirmationModal';

const formatDate = (raw: string) => {
  if (!raw) return '—';
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

interface LeadListProps {
  hideHeader?: boolean;
}

const LeadList: React.FC<LeadListProps> = ({ hideHeader = false }) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { items: leads, isLoading, error } = useAppSelector((state) => state.leads);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('');
  const [dateRangePreset, setDateRangePreset] = useState<'all' | 'week' | 'month' | 'custom'>('all');
  
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 30;
  
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [selectedLeadData, setSelectedLeadData] = useState({ id: '', name: '', status: '' });
  
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<string | null>(null);

  const isMarketing = isDigitalMarketingEmployee(user);
  const canAccessLeads = user?.role === 'superadmin' || user?.role === 'admin' || isMarketing;

  React.useEffect(() => {
    if (canAccessLeads) {
      dispatch(fetchLeads());
    }
  }, [dispatch, canAccessLeads]);

  const statusColors = {
    'New': 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-100 dark:border-blue-800/50',
    'Contacted': 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-800/50',
    'Qualified': 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 border-indigo-100 dark:border-indigo-800/50',
    'Converted': 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800/50',
    'Proposal': 'bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 border-violet-100 dark:border-violet-800/50',
    'Negotiation': 'bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 border-rose-100 dark:border-rose-800/50',
    'Not Interested': 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-100 dark:border-red-800/50',
    'Follow Up': 'bg-cyan-50 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 border-cyan-100 dark:border-cyan-800/50',
    'Direct Visit': 'bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 border-teal-100 dark:border-teal-800/50',
  };

  const statusOptions = ['New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Converted', 'Not Interested', 'Follow Up', 'Direct Visit'];

  const handleStatusChange = async (newStatus: string, lead: any) => {
    try {
      await dispatch(updateLead({ id: lead._id, data: { status: newStatus } })).unwrap();
      if (newStatus === 'Follow Up' || newStatus === 'Converted') {
        setSelectedLeadData({ id: lead._id, name: lead.name, status: newStatus });
        setIsScheduleModalOpen(true);
      }
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  const handleSourceChange = async (newSource: string, lead: any) => {
    try {
      await dispatch(updateLead({ id: lead._id, data: { source: newSource } })).unwrap();
    } catch (err) {
      console.error('Failed to update source', err);
    }
  };

  const filteredLeads = leads.filter(lead => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = (lead.name || '').toLowerCase().includes(searchLower) || 
                         (lead.email || '').toLowerCase().includes(searchLower) ||
                         (lead.phone || '').includes(searchTerm) ||
                         (lead.company ? lead.company.toLowerCase().includes(searchLower) : false);
    const matchesStatus = statusFilter === 'All' || lead.status === statusFilter;
    
    let matchesDate = true;
    if (dateRangePreset === 'custom') {
      matchesDate = !dateFilter || (lead.createdAt && lead.createdAt.startsWith(dateFilter));
    } else if (dateRangePreset === 'week') {
      if (!lead.createdAt) matchesDate = false;
      else {
        const leadDate = new Date(lead.createdAt).getTime();
        const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        matchesDate = leadDate >= sevenDaysAgo;
      }
    } else if (dateRangePreset === 'month') {
      if (!lead.createdAt) matchesDate = false;
      else {
        const leadDate = new Date(lead.createdAt).getTime();
        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
        matchesDate = leadDate >= thirtyDaysAgo;
      }
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  // Reset to first page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, dateFilter, dateRangePreset]);

  const totalPages = Math.max(1, Math.ceil(filteredLeads.length / ITEMS_PER_PAGE));
  const paginatedLeads = filteredLeads.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleExport = () => {
    if (filteredLeads.length === 0) {
      alert('No leads to export for current filter selection.');
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
    const filterTag = dateRangePreset === 'all' ? 'all' : dateRangePreset;
    link.setAttribute('download', `leads_export_${filterTag}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  const confirmDelete = async () => {
    if (leadToDelete) {
      try {
        await dispatch(deleteLead(leadToDelete)).unwrap();
        setDeleteModalOpen(false);
        setLeadToDelete(null);
      } catch (error) {
        console.error('Failed to delete lead:', error);
      }
    }
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setLeadToDelete(id);
    setDeleteModalOpen(true);
  };

  if (!canAccessLeads) {
    return (
      <div className="glass p-8 rounded-3xl text-center border border-slate-100 dark:border-slate-700">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Access Restricted</h3>
        <p className="text-slate-500 dark:text-slate-400 mt-2">Leads are visible only to Admin and Digital Marketing employees.</p>
      </div>
    );
  }

  if (isLoading && leads.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-red-500 bg-red-50 dark:bg-red-900/30 rounded-xl border border-red-200 dark:border-red-900/50">
        <h3 className="font-bold">Failed to load leads</h3>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <ScheduleNotificationModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        leadId={selectedLeadData.id}
        leadName={selectedLeadData.name}
        status={selectedLeadData.status}
      />
      
      <DeleteConfirmationModal 
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setLeadToDelete(null);
        }}
        onConfirm={confirmDelete}
      />
      {!hideHeader && (
        <>
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full min-w-0">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Leads Management</h1>
              <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm">Track and manage your potential customers lifecycle.</p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
              <button 
                onClick={handleExport}
                className="flex-1 sm:flex-initial min-w-0 flex items-center justify-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm"
              >
                <Download className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Export</span>
              </button>
              <button 
                onClick={() => navigate('/leads/create')}
                className="flex-1 sm:flex-initial min-w-0 flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-600 rounded-xl text-xs font-bold text-white hover:bg-indigo-700 shadow-md shadow-indigo-200 dark:shadow-indigo-900/50 transition-all"
              >
                <Plus className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Add Lead</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Filters & Search */}
      <div className="glass p-3.5 sm:p-4 rounded-2xl flex flex-col gap-3">
        {/* Top Search Bar & Download Filter Button */}
        <div className="flex flex-col sm:flex-row gap-2.5 w-full">
          {/* Search Input */}
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Search leads by name, email, phone..."
              className="w-full min-w-0 pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Download Filtered CSV Button */}
          <button 
            onClick={handleExport}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all shrink-0 cursor-pointer"
            title="Download CSV of current filtered leads"
          >
            <Download className="w-4 h-4 shrink-0" />
            <span>Download</span>
          </button>
        </div>

        {/* Date Filter Bar (1 Week, 1 Month, Custom Date) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-3 pb-3 my-1 border-y border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 sm:pb-0">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300 shrink-0 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-indigo-500" /> Date Range:
            </span>
            {[
              { id: 'all', label: 'All Time' },
              { id: 'week', label: '1 Week (7 Days)' },
              { id: 'month', label: '1 Month (30 Days)' },
              { id: 'custom', label: 'Pick Custom Date' },
            ].map((preset) => (
              <button
                key={preset.id}
                onClick={() => setDateRangePreset(preset.id as any)}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 border cursor-pointer",
                  dateRangePreset === preset.id
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-100 dark:shadow-none"
                    : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                )}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Date Picker Input - Shown when Pick Custom Date is active */}
          {dateRangePreset === 'custom' && (
            <div className="relative min-w-0 w-full sm:w-52 animate-fade-in shrink-0">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500 pointer-events-none z-10" />
              <input
                type="date"
                className="w-full min-w-0 pl-9 pr-2 py-2 bg-white dark:bg-slate-900 border border-indigo-400 dark:border-indigo-600 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </div>
          )}
        </div>

        {/* Status Filter - Mobile Dropdown View */}
        <div className="sm:hidden flex flex-col gap-1">
          <label className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-indigo-500" />
            Filter by status:
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
          >
            <option value="All">All Statuses ({leads.length})</option>
            {statusOptions.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter - Desktop Horizontal Pills View */}
        <div className="hidden sm:flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5">
            <Filter className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Filter by status:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {['All', ...statusOptions].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap",
                  statusFilter === status
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-100 dark:shadow-indigo-900/50"
                    : "text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700"
                )}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile Cards View */}
      <div className="md:hidden space-y-3">
        {paginatedLeads.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center text-slate-400 text-sm">No leads found.</div>
        ) : paginatedLeads.map((lead) => (
          <div
            key={lead._id}
            className="glass rounded-2xl p-4 cursor-pointer hover:shadow-md transition-all space-y-3"
            onClick={() => navigate(`/leads/${lead._id}`)}
          >
            {/* Top Row: Name & Status */}
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-slate-900 dark:text-white text-sm truncate">{lead.name}</h4>
                {lead.company && (
                  <div className="flex items-center gap-1 mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{lead.company}</span>
                  </div>
                )}
              </div>
              <div className="shrink-0" onClick={e => e.stopPropagation()}>
                <StatusDropdown 
                  currentStatus={lead.status}
                  onStatusChange={(status) => handleStatusChange(status, lead)}
                  statusColors={statusColors}
                  statusOptions={statusOptions}
                />
              </div>
            </div>

            {/* Contact Details (Email & Phone) */}
            <div className="grid grid-cols-1 gap-1.5 text-xs text-slate-600 dark:text-slate-300 bg-slate-50/80 dark:bg-slate-900/40 p-2.5 rounded-xl">
              {lead.email ? (
                <div className="flex items-center gap-1.5 min-w-0">
                  <Mail className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span className="truncate">{lead.email}</span>
                </div>
              ) : null}
              {lead.phone ? (
                <div className="flex items-center gap-1.5 min-w-0">
                  <Phone className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <a
                    href={`tel:${lead.phone}`}
                    onClick={e => e.stopPropagation()}
                    className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline truncate"
                  >
                    {lead.phone}
                  </a>
                </div>
              ) : null}
              {!lead.email && !lead.phone && (
                <span className="text-slate-400 italic text-[11px]">No contact details provided</span>
              )}
            </div>

            {/* Bottom Row: Source, Date, Delete Action */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
              <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                <span className="text-[11px] text-slate-400 font-medium">Source:</span>
                <SourceDropdown 
                  currentSource={lead.source}
                  onSourceChange={(source) => handleSourceChange(source, lead)}
                  disabled={lead.status === 'Not Interested'}
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => handleDelete(e, lead._id)}
                  className="flex items-center gap-1 px-2.5 py-1 text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 rounded-xl transition-all border border-rose-100 dark:border-rose-900/50 text-xs font-bold shrink-0"
                  title="Delete Lead"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block glass rounded-2xl overflow-hidden border border-white/40 dark:border-slate-700/50 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700/50">
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Lead Info</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Company</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Source</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Created At</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {paginatedLeads.map((lead) => (
                <tr 
                  key={lead._id} 
                  className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer"
                  onClick={() => navigate(`/leads/${lead._id}`)}
                >
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{lead.name}</span>
                      <div className="flex items-center gap-2 mt-1">
                        <Mail className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                        <span className="text-xs text-slate-500 dark:text-slate-400">{lead.email || '—'}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{lead.company || '—'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <StatusDropdown 
                      currentStatus={lead.status}
                      onStatusChange={(status) => handleStatusChange(status, lead)}
                      statusColors={statusColors}
                      statusOptions={statusOptions}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <SourceDropdown 
                      currentSource={lead.source}
                      onSourceChange={(source) => handleSourceChange(source, lead)}
                      disabled={lead.status === 'Not Interested'}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                      <Calendar className="w-4 h-4" />
                      {formatDate(lead.createdAt)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={(e) => handleDelete(e, lead._id)}
                        className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-all"
                        title="Delete Lead"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Bar - Rendered for both Mobile and Desktop */}
      {filteredLeads.length > 0 && (
        <div className="glass rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-slate-100 dark:border-slate-800">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center sm:text-left">
            Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredLeads.length)} of {filteredLeads.length} leads
          </span>
          <div className="flex items-center justify-center gap-2">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }).map((_, idx) => {
                const pageNum = idx + 1;
                if (
                  pageNum === 1 ||
                  pageNum === totalPages ||
                  (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                ) {
                  return (
                    <button 
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={cn(
                        "w-8 h-8 flex items-center justify-center text-sm font-bold rounded-lg transition-all",
                        currentPage === pageNum 
                          ? "bg-indigo-600 text-white shadow-sm shadow-indigo-100 dark:shadow-none" 
                          : "text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm bg-transparent"
                      )}
                    >
                      {pageNum}
                    </button>
                  );
                }
                
                if (
                  (pageNum === currentPage - 2 && pageNum > 1) ||
                  (pageNum === currentPage + 2 && pageNum < totalPages)
                ) {
                  return <span key={pageNum} className="text-slate-400 px-1">...</span>;
                }
                
                return null;
              })}
            </div>
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadList;
