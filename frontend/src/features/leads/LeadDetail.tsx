import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Mail, Phone, Building2,  
  Tag, MessageSquare, History, User,
  CheckCircle2, PhoneCall, MailPlus, AlertCircle
} from 'lucide-react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store';
import { updateLead, addTimelineEntry, deleteLead } from '../../store/slices/leadSlice';
import { cn } from '../../utils/cn';
import ConvertLeadModal from './ConvertLeadModal';
import ScheduleNotificationModal from './ScheduleNotificationModal';
import EditNotificationModal from './EditNotificationModal';
import EditLeadModal from './EditLeadModal';
import StatusDropdown from './StatusDropdown';
import { fetchTasks, toggleTaskStatus, deleteTask } from '../../store/slices/taskSlice';
import type { Task } from '../../store/slices/taskSlice';
import { Clock, Calendar, Edit2, CheckCircle2 as CheckIcon, Trash2 } from 'lucide-react';

const LeadDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { items: leads } = useAppSelector((state) => state.leads);
  const { items: tasks } = useAppSelector((state) => state.tasks);
  const lead = leads.find((l) => l._id === id);

  const relatedTasks = tasks.filter(t => t.relatedTo === id && t.status === 'Pending');

  useEffect(() => {
    dispatch(fetchTasks());
  }, [dispatch]);

  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [isEditLeadModalOpen, setIsEditLeadModalOpen] = useState(false);
  const [isAddingTimeline, setIsAddingTimeline] = useState(false);
  const [newTimelineContent, setNewTimelineContent] = useState('');
  const [timelineType, setTimelineType] = useState<'note' | 'call' | 'email'>('note');
  
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [editableNotes, setEditableNotes] = useState('');

  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [selectedLeadData, setSelectedLeadData] = useState({ id: '', name: '', status: '' });
  
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  useEffect(() => {
    if (lead) {
      setEditableNotes(lead.notes || '');
    }
  }, [lead]);

  if (!lead) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <AlertCircle className="w-12 h-12 text-slate-300" />
        <h2 className="text-xl font-bold text-slate-800">Lead Not Found</h2>
        <p className="text-slate-500">The lead you are looking for does not exist or has been removed.</p>
        <Link to="/leads" className="text-indigo-600 font-bold hover:underline">Back to Leads</Link>
      </div>
    );
  }

  const handleAddTimeline = async () => {
    if (!newTimelineContent.trim()) return;
    try {
      await dispatch(addTimelineEntry({ 
        id: lead._id, 
        entry: { 
          type: timelineType, 
          content: newTimelineContent,
          user: 'Admin' // Should come from auth
        } 
      })).unwrap();
      setNewTimelineContent('');
      setIsAddingTimeline(false);
    } catch (err) {
      console.error('Failed to add timeline entry:', err);
    }
  };

  const handleUpdateNotes = async () => {
    try {
      await dispatch(updateLead({ id: lead._id, data: { notes: editableNotes } })).unwrap();
      setIsEditingNotes(false);
    } catch (err) {
      console.error('Failed to update notes:', err);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this lead record? This action cannot be undone.')) {
      try {
        await dispatch(deleteLead(lead._id)).unwrap();
        navigate('/leads');
      } catch (err) {
        console.error('Failed to delete lead:', err);
      }
    }
  };

  const statusColors = {
    'New': 'bg-blue-100 text-blue-700 border-blue-200',
    'Contacted': 'bg-amber-100 text-amber-700 border-amber-200',
    'Qualified': 'bg-indigo-100 text-indigo-700 border-indigo-200',
    'Converted': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'Proposal': 'bg-violet-100 text-violet-700 border-violet-200',
    'Negotiation': 'bg-rose-100 text-rose-700 border-rose-200',
    'Not Interested': 'bg-red-100 text-red-700 border-red-200',
    'Follow Up': 'bg-cyan-100 text-cyan-700 border-cyan-200',
    'Direct Visit': 'bg-teal-100 text-teal-700 border-teal-200',
  };

  const statusOptions = ['New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Converted', 'Not Interested', 'Follow Up', 'Direct Visit'];

  const handleStatusChange = async (newStatus: string) => {
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

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header / Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link 
            to="/leads" 
            className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all hover:translate-x-[-2px] shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">{lead.name}</h1>
              <StatusDropdown 
                currentStatus={lead.status}
                onStatusChange={handleStatusChange}
                statusColors={statusColors}
                statusOptions={statusOptions}
              />
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mt-0.5 flex-wrap">
              <Building2 className="w-4 h-4 shrink-0" />
              <span>{lead.company || 'No Company'}</span>
              {lead.source && (
                <>
                  <span className="mx-1 opacity-20">•</span>
                  <span>Source: {lead.source}</span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <button 
            onClick={() => setIsEditLeadModalOpen(true)}
            className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
          >
            Edit
          </button>
          <button 
            onClick={() => setIsConvertModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 rounded-xl text-sm font-semibold text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span className="hidden sm:inline">Mark as Converted</span>
            <span className="sm:hidden">Convert</span>
          </button>
        </div>
      </div>

      <ConvertLeadModal 
        isOpen={isConvertModalOpen} 
        onClose={() => setIsConvertModalOpen(false)} 
        leadId={lead._id}
        leadName={lead.name}
      />
      <EditLeadModal 
        isOpen={isEditLeadModalOpen} 
        onClose={() => setIsEditLeadModalOpen(false)} 
        lead={lead} 
      />
      <ScheduleNotificationModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        leadId={selectedLeadData.id}
        leadName={selectedLeadData.name}
        status={selectedLeadData.status}
      />
      <EditNotificationModal
        isOpen={!!editingTask}
        onClose={() => setEditingTask(null)}
        task={editingTask}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass p-6 rounded-2xl space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest opacity-40">Contact Information</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-500 dark:text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 dark:text-slate-500 block font-bold">Email</span>
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{lead.email}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-500 dark:text-slate-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 dark:text-slate-500 block font-bold">Phone</span>
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{lead.phone}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="glass p-6 rounded-2xl space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest opacity-40">Lead Insights</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-500 dark:text-slate-400">
                    <Tag className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 dark:text-slate-500 block font-bold">Source</span>
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{lead.source}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-500 dark:text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 dark:text-slate-500 block font-bold">Assigned To</span>
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{lead.assignedTo}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Scheduled Notifications Section */}
          {relatedTasks.length > 0 && (
            <div className="glass p-6 rounded-3xl space-y-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-500" />
                Scheduled Follow-Ups
              </h3>
              <div className="space-y-3">
                {relatedTasks.map(task => (
                  <div key={task.id} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 flex items-start justify-between group hover:border-indigo-200 dark:hover:border-indigo-500/30 hover:shadow-lg hover:shadow-indigo-50 dark:hover:shadow-indigo-900/20 transition-all">
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">{task.description || task.title}</h4>
                      <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 mt-2 bg-indigo-50 dark:bg-indigo-900/30 w-max px-2 py-1 rounded-md">
                        <Calendar className="w-3 h-3" />
                        {task.dueDate && !isNaN(new Date(task.dueDate).getTime())
                          ? new Date(task.dueDate).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
                          : 'No valid date'}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => dispatch(toggleTaskStatus(task.id))}
                        className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-emerald-500 dark:hover:text-emerald-400 bg-slate-50 dark:bg-slate-900/50 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors"
                        title="Mark as completed"
                      >
                        <CheckIcon className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setEditingTask(task)}
                        className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 bg-slate-50 dark:bg-slate-900/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                        title="Edit notification"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => dispatch(deleteTask(task.id))}
                        className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-rose-500 dark:hover:text-rose-400 bg-slate-50 dark:bg-slate-900/50 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors"
                        title="Delete notification"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Activity Logs */}
          <div className="glass p-6 rounded-3xl">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Activity Timeline</h3>
            <button 
              onClick={() => setIsAddingTimeline(!isAddingTimeline)}
              className="text-indigo-600 dark:text-indigo-400 text-sm font-bold hover:underline"
            >
              {isAddingTimeline ? 'Cancel' : '+ Add Entry'}
            </button>
          </div>

          {isAddingTimeline && (
            <div className="mb-8 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 space-y-4 animate-slide-down">
              <div className="flex gap-2">
                {(['note', 'call', 'email'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setTimelineType(type)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all",
                      timelineType === type ? "bg-indigo-600 text-white shadow-md" : "bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                    )}
                  >
                    {type}
                  </button>
                ))}
              </div>
              <textarea
                value={newTimelineContent}
                onChange={(e) => setNewTimelineContent(e.target.value)}
                className="w-full p-3 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="Describe the activity..."
                rows={2}
              />
              <button
                onClick={handleAddTimeline}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700"
              >
                Save Activity
              </button>
            </div>
          )}
            <div className="relative space-y-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100 dark:before:bg-slate-800">
              {lead.timeline && lead.timeline.length > 0 ? lead.timeline.map((entry) => (
                <div key={entry._id || Math.random().toString()} className="relative pl-10">
                  <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center z-10 shadow-sm group-hover:border-indigo-200">
                    {entry.type === 'note' && <MessageSquare className="w-3 h-3 text-slate-400" />}
                    {entry.type === 'call' && <PhoneCall className="w-3 h-3 text-slate-400" />}
                    {entry.type === 'email' && <MailPlus className="w-3 h-3 text-slate-400" />}
                    {entry.type === 'status' && <History className="w-3 h-3 text-slate-400" />}
                  </div>
                  <div className="bg-slate-50/50 dark:bg-slate-800/50 rounded-2xl p-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{entry.content}</span>
                      <span className="text-xs text-slate-400 font-medium">
                        {new Date(entry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-[8px] font-bold">
                        {entry.user.charAt(0)}
                      </div>
                      <span className="text-xs text-slate-500 font-medium">Logged by {entry.user}</span>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="pl-10 text-slate-400 dark:text-slate-500 text-sm italic">
                  No activity recorded yet.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Actions/Notes */}
        <div className="space-y-6">
          <div className="glass p-6 rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4">
              <AlertCircle className="w-5 h-5 text-indigo-100" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest opacity-40 mb-4">Internal Notes</h3>
            {isEditingNotes ? (
              <div className="space-y-3">
                <textarea
                  value={editableNotes}
                  onChange={(e) => setEditableNotes(e.target.value)}
                  className="w-full p-4 bg-white dark:bg-slate-900/50 border border-indigo-200 dark:border-indigo-900/50 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  rows={4}
                />
                <div className="flex gap-2">
                  <button 
                    onClick={handleUpdateNotes}
                    className="flex-1 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg"
                  >
                    Save Notes
                  </button>
                  <button 
                    onClick={() => setIsEditingNotes(false)}
                    className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-bold rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="p-4 bg-indigo-50/50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-900/30">
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed italic">
                    "{lead.notes || 'No notes available for this lead.'}"
                  </p>
                </div>
                <button 
                  onClick={() => setIsEditingNotes(true)}
                  className="mt-4 w-full py-2.5 text-indigo-600 dark:text-indigo-400 text-sm font-bold hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-xl transition-all"
                >
                  Update Notes
                </button>
              </>
            )}
          </div>

          <div className="glass p-6 rounded-2xl space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest opacity-40">System Info</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">Record Created</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">{new Date(lead.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">Last Updated</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">{new Date(lead.updatedAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">Lead ID</span>
                <span className="font-mono text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">{lead._id}</span>
              </div>
            </div>
          </div>
          
          <button 
            onClick={handleDelete}
            className="w-full py-4 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-2xl text-sm font-bold hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-all"
          >
            Delete Lead Record
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeadDetail;
