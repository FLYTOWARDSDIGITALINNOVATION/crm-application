import React, { useState, useEffect } from 'react';
import {
  Calendar, Plus, Clock, CheckCircle2, XCircle, X,
  FileText, Loader2, ThumbsUp, ThumbsDown
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchLeaves, createLeave, updateLeaveStatus } from '../../store/slices/leaveSlice';
import type { LeaveRequest } from '../../store/slices/leaveSlice';

const LEAVE_TYPES = ['Sick', 'Casual', 'Paid', 'Unpaid'] as const;

const statusStyle = (status: string) => {
  switch (status) {
    case 'Approved': return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    case 'Rejected': return 'text-rose-700 bg-rose-50 border-rose-200';
    default: return 'text-amber-700 bg-amber-50 border-amber-200';
  }
};

const statusIcon = (status: string) => {
  switch (status) {
    case 'Approved': return <CheckCircle2 className="w-3.5 h-3.5" />;
    case 'Rejected': return <XCircle className="w-3.5 h-3.5" />;
    default: return <Clock className="w-3.5 h-3.5" />;
  }
};

const defaultForm = {
  startDate: '',
  endDate: '',
  type: 'Casual' as typeof LEAVE_TYPES[number],
  reason: '',
};

const LeaveManagement: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { items: leaves, isLoading } = useAppSelector((state) => state.leaves);

  const isAdmin = user?.role === 'admin';

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [errors, setErrors] = useState<Partial<typeof defaultForm>>({});
  const [filter, setFilter] = useState<'All' | 'Pending' | 'Approved' | 'Rejected'>('All');

  useEffect(() => {
    dispatch(fetchLeaves());
  }, [dispatch]);

  const validate = () => {
    const newErrors: Partial<typeof defaultForm> = {};
    if (!form.startDate) newErrors.startDate = 'Start date is required';
    if (!form.endDate) newErrors.endDate = 'End date is required';
    if (!form.reason.trim()) newErrors.reason = 'Reason is required';
    if (form.startDate && form.endDate && form.startDate > form.endDate) {
      newErrors.endDate = 'End date must be after start date';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    dispatch(createLeave({
      startDate: form.startDate,
      endDate: form.endDate,
      type: form.type,
      reason: form.reason.trim(),
    }));

    setForm(defaultForm);
    setErrors({});
    setShowModal(false);
  };

  const handleStatusChange = (id: string, status: 'Approved' | 'Rejected') => {
    dispatch(updateLeaveStatus({ id, status }));
  };

  const filteredLeaves = leaves.filter(l => {
    if (filter === 'All') return true;
    return l.status === filter;
  });

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Leave Management</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {isAdmin
              ? 'Approve or reject leave requests across the team.'
              : 'Submit and track your leave applications.'}
          </p>
        </div>
        {!isAdmin && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-5 py-3 bg-indigo-600 rounded-2xl text-sm font-bold text-white hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all self-start sm:self-auto"
          >
            <Plus className="w-5 h-5" />
            Request Leave
          </button>
        )}
      </div>

      {/* Quick Filters */}
      <div className="glass p-4 rounded-2xl flex items-center gap-2 overflow-x-auto shrink-0 scrollbar-none">
        {(['All', 'Pending', 'Approved', 'Rejected'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 border border-transparent",
              filter === f
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-100"
                : "bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-100"
            )}
          >
            {f} {f === 'All' ? `(${leaves.length})` : `(${leaves.filter(l => l.status === f).length})`}
          </button>
        ))}
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          <span className="ml-3 text-slate-500 font-medium">Loading leaves...</span>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && filteredLeaves.length === 0 && (
        <div className="glass p-16 rounded-3xl text-center border border-slate-100">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
            <Calendar className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">No leave requests found</h3>
          <p className="text-slate-500 text-sm mt-1">
            {isAdmin ? 'No pending applications to review.' : 'You haven\'t requested any leaves yet.'}
          </p>
        </div>
      )}

      {/* Leave request list */}
      {!isLoading && filteredLeaves.length > 0 && (
        <div className="space-y-4">
          {filteredLeaves.map((leave) => (
            <div
              key={leave._id}
              className="glass p-5 rounded-3xl border border-slate-100 hover:shadow-lg transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              {/* Employee name / Info */}
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={cn('flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border', statusStyle(leave.status))}>
                    {statusIcon(leave.status)}
                    {leave.status}
                  </span>
                  <span className="px-2 py-0.5 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-bold uppercase tracking-wider">
                    {leave.type} Leave
                  </span>
                  {leave.approvedOrRejectedBy && (
                    <span className="text-[10px] text-slate-400 font-medium">
                      Reviewed by {leave.approvedOrRejectedBy}
                    </span>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-x-4 gap-y-1">
                  {isAdmin && (
                    <h3 className="text-sm font-bold text-slate-800">
                      {leave.employeeName}
                    </h3>
                  )}
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{leave.startDate}</span>
                    <span className="text-slate-400 font-normal">to</span>
                    <span>{leave.endDate}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-2xl mt-1.5">
                  &ldquo;{leave.reason}&rdquo;
                </p>
              </div>

              {/* Admin Actions */}
              {isAdmin && leave.status === 'Pending' && (
                <div className="flex items-center gap-2 shrink-0 self-end md:self-auto border-t md:border-none pt-3 md:pt-0">
                  <button
                    onClick={() => handleStatusChange(leave._id, 'Approved')}
                    className="flex items-center gap-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-xl text-white text-xs font-bold transition-all shadow-md shadow-emerald-100"
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    Approve
                  </button>
                  <button
                    onClick={() => handleStatusChange(leave._id, 'Rejected')}
                    className="flex items-center gap-1 px-4 py-2 bg-rose-600 hover:bg-rose-700 rounded-xl text-white text-xs font-bold transition-all shadow-md shadow-rose-100"
                  >
                    <ThumbsDown className="w-3.5 h-3.5" />
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Submission Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900 font-inter">Request Leave</h2>
                <p className="text-slate-400 text-sm mt-0.5">Submit your leave request details.</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Type */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Leave Type</label>
                <select
                  value={form.type}
                  onChange={e => setForm({ ...form, type: e.target.value as typeof LEAVE_TYPES[number] })}
                  className="input-field"
                >
                  {LEAVE_TYPES.map(t => <option key={t} value={t}>{t} Leave</option>)}
                </select>
              </div>

              {/* Start & End Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Start Date <span className="text-rose-500">*</span></label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={e => setForm({ ...form, startDate: e.target.value })}
                    className={cn('input-field', errors.startDate ? 'border-rose-400 bg-rose-50' : '')}
                  />
                  {errors.startDate && <p className="text-rose-500 text-xs mt-1">{errors.startDate}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">End Date <span className="text-rose-500">*</span></label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={e => setForm({ ...form, endDate: e.target.value })}
                    className={cn('input-field', errors.endDate ? 'border-rose-400 bg-rose-50' : '')}
                  />
                  {errors.endDate && <p className="text-rose-500 text-xs mt-1">{errors.endDate}</p>}
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Reason <span className="text-rose-500">*</span></label>
                <textarea
                  rows={4}
                  placeholder="State the reason for leave..."
                  value={form.reason}
                  onChange={e => setForm({ ...form, reason: e.target.value })}
                  className={cn('input-field resize-none', errors.reason ? 'border-rose-400 bg-rose-50' : '')}
                />
                {errors.reason && <p className="text-rose-500 text-xs mt-1">{errors.reason}</p>}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all"
                >
                  <FileText className="w-4 h-4" />
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveManagement;
