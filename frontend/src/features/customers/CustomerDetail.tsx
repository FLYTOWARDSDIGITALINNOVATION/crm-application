import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Mail, Phone, Building2,  
  Tag, MessageSquare, History,
  PhoneCall, MailPlus, AlertCircle,
  Star, TrendingUp, IndianRupee, Calendar, Lock, Trash2, FileText, Download,
  ImageIcon, Plus
} from 'lucide-react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store';
import { updateCustomer, addCustomerTimelineEntry, deleteCustomer, fetchCustomerById } from '../../store/slices/customerSlice';
import { cn } from '../../utils/cn';
import EditCustomerModal from './EditCustomerModal';

const CustomerDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { items: customers } = useAppSelector((state) => state.customers);
  const { user } = useAppSelector((state) => state.auth);
  const customer = customers.find((c) => c._id === id);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddingTimeline, setIsAddingTimeline] = useState(false);
  const [newTimelineContent, setNewTimelineContent] = useState('');
  const [timelineType, setTimelineType] = useState<'note' | 'call' | 'email'>('note');
  
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [editableNotes, setEditableNotes] = useState('');

  const [isEditingRequirements, setIsEditingRequirements] = useState(false);
  const [editableRequirements, setEditableRequirements] = useState('');

  useEffect(() => {
    if (customer) {
      setEditableNotes(customer.notes || '');
      setEditableRequirements(customer.requirements || '');
    }
  }, [customer]);

  const handleUpdateRequirements = async () => {
    try {
      await dispatch(updateCustomer({ id: customer._id, data: { requirements: editableRequirements } })).unwrap();
      setIsEditingRequirements(false);
    } catch (err) {
      console.error('Failed to update requirements:', err);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      const newFile = {
        name: file.name,
        url: base64String,
        uploadedAt: new Date().toISOString()
      };
      
      const currentFiles = customer.files || [];
      try {
        await dispatch(updateCustomer({
          id: customer._id,
          data: { files: [...currentFiles, newFile] }
        })).unwrap();
      } catch (err) {
        console.error('File upload failed:', err);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileDelete = async (indexToDelete: number) => {
    if (!window.confirm('Are you sure you want to delete this file?')) return;
    const currentFiles = customer.files || [];
    const updatedFiles = currentFiles.filter((_, idx) => idx !== indexToDelete);
    try {
      await dispatch(updateCustomer({
        id: customer._id,
        data: { files: updatedFiles }
      })).unwrap();
    } catch (err) {
      console.error('File deletion failed:', err);
    }
  };

  useEffect(() => {
    if (id) {
      dispatch(fetchCustomerById(id));
      const intervalId = setInterval(() => {
        dispatch(fetchCustomerById(id));
      }, 5000);
      return () => clearInterval(intervalId);
    }
  }, [dispatch, id]);

  const handleRemoveCustomer = async () => {
    if (window.confirm('Are you sure you want to remove this customer? This action cannot be undone.')) {
      try {
        await dispatch(deleteCustomer(customer!._id)).unwrap();
        navigate('/customers');
      } catch (err) {
        console.error('Failed to remove customer:', err);
        alert('Failed to remove customer.');
      }
    }
  };

  if (!customer) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <AlertCircle className="w-12 h-12 text-slate-300" />
        <h2 className="text-xl font-bold text-slate-800">Customer Not Found</h2>
        <p className="text-slate-500">The customer you are looking for does not exist or has been removed.</p>
        <Link to="/customers" className="text-indigo-600 font-bold hover:underline">Back to Directory</Link>
      </div>
    );
  }

  const handleAddTimeline = async () => {
    if (!newTimelineContent.trim()) return;
    try {
      await dispatch(addCustomerTimelineEntry({ 
        id: customer._id, 
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
      await dispatch(updateCustomer({ id: customer._id, data: { notes: editableNotes } })).unwrap();
      setIsEditingNotes(false);
    } catch (err) {
      console.error('Failed to update notes:', err);
    }
  };

  const statusColors = {
    'Active': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'VIP': 'bg-amber-100 text-amber-700 border-amber-200',
    'New': 'bg-blue-100 text-blue-700 border-blue-200',
    'Inactive': 'bg-rose-100 text-rose-700 border-rose-200',
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header / Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link 
            to="/customers" 
            className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all hover:translate-x-[-2px] shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">{customer.name}</h1>
              <span className={cn(
                "px-2.5 py-1 rounded-full text-xs font-bold border",
                statusColors[customer.status as keyof typeof statusColors]
              )}>
                {customer.status}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mt-0.5 flex-wrap">
              <Building2 className="w-4 h-4 shrink-0" />
              <span>{customer.company || 'No Company'}</span>
              <span className="mx-1 opacity-20">•</span>
              <span>Joined {new Date(customer.joinedAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <button 
            onClick={handleRemoveCustomer}
            className="px-3 sm:px-4 py-2 bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-900/50 rounded-xl text-sm font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 hover:border-rose-300 dark:hover:border-rose-800 transition-all flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">Remove</span>
          </button>
          <button 
            onClick={() => setIsEditModalOpen(true)}
            className="px-3 sm:px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
          >
            <span className="hidden sm:inline">Edit Profile</span>
            <span className="sm:hidden">Edit</span>
          </button>

        </div>
      </div>

      <EditCustomerModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        customer={customer}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Details & Timeline */}
        <div className="lg:col-span-2 space-y-6">
          {/* KPI Mini-Cards */}
          <div className={cn(
            "grid grid-cols-1 sm:grid-cols-2 gap-4",
            user?.role === 'superadmin' ? "md:grid-cols-4" : "md:grid-cols-2"
          )}>
            {user?.role === 'superadmin' && (
              <>
                <div className="glass p-4 rounded-2xl flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider block">Total Spent</span>
                    <span className="text-lg font-bold text-slate-900 dark:text-white">₹{customer.totalSpent?.toLocaleString()}</span>
                  </div>
                </div>
                <div className="glass p-4 rounded-2xl flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                    <IndianRupee className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider block">Advance Paid</span>
                    <span className="text-lg font-bold text-slate-900 dark:text-white">₹{customer.advanceAmount?.toLocaleString() || '0'}</span>
                  </div>
                </div>
              </>
            )}
            <div className="glass p-4 rounded-2xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                <Star className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider block">Tier</span>
                <span className="text-lg font-bold text-slate-900 dark:text-white">{customer.status === 'VIP' ? 'Platinum' : 'Standard'}</span>
              </div>
            </div>
            <div className="glass p-4 rounded-2xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider block">Last Activity</span>
                <span className="text-lg font-bold text-slate-900 dark:text-white">2 days ago</span>
              </div>
            </div>
          </div>

          <div className="glass p-6 rounded-2xl space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest opacity-40">Customer Insights</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-500 dark:text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 dark:text-slate-500 block font-bold">Email</span>
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{customer.email}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-500 dark:text-slate-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 dark:text-slate-500 block font-bold">Phone</span>
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{customer.phone || 'N/A'}</span>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-500 dark:text-slate-400">
                    <Tag className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 dark:text-slate-500 block font-bold">Industry Sector</span>
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{customer.sector || 'General'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-500 dark:text-slate-400">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 dark:text-slate-500 block font-bold">Business Name</span>
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{customer.company || 'Private Individual'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Portal Credentials */}
          <div className="glass p-6 rounded-2xl space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest opacity-40">Portal Credentials</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-500 dark:text-indigo-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs text-indigo-400/80 dark:text-indigo-300/80 block font-bold">User ID / Email</span>
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{customer.email}</span>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-500 dark:text-indigo-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs text-indigo-400/80 dark:text-indigo-300/80 block font-bold">Initial Password</span>
                    <span className="text-sm font-mono font-bold text-slate-700 dark:text-slate-300">{customer.portalPassword || 'Not Available'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Requirements Card */}
          <div className="glass p-6 rounded-3xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest opacity-40">Customer Requirements</h3>
              <button
                onClick={() => {
                  setIsEditingRequirements(!isEditingRequirements);
                  setEditableRequirements(customer.requirements || '');
                }}
                className="text-indigo-600 dark:text-indigo-400 text-xs font-bold hover:underline"
              >
                {isEditingRequirements ? 'Cancel' : 'Edit'}
              </button>
            </div>
            {isEditingRequirements ? (
              <div className="space-y-3">
                <textarea
                  value={editableRequirements}
                  onChange={(e) => setEditableRequirements(e.target.value)}
                  className="w-full p-4 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  rows={4}
                  placeholder="Enter customer specific requirements..."
                />
                <button
                  onClick={handleUpdateRequirements}
                  className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all"
                >
                  Save Requirements
                </button>
              </div>
            ) : (
              <div className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-100 dark:border-slate-800">
                {customer.requirements ? (
                  <p className="text-sm text-slate-700 dark:text-slate-350 leading-relaxed whitespace-pre-wrap">
                    {customer.requirements}
                  </p>
                ) : (
                  <p className="text-sm text-slate-400 dark:text-slate-500 italic">
                    No custom requirements specified for this customer.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Customer Attachments Card */}
          <div className="glass p-6 rounded-3xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest opacity-40">Customer Files</h3>
              <label className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs font-bold border border-indigo-100 dark:border-indigo-800/50 cursor-pointer transition-all">
                <Plus className="w-3.5 h-3.5" />
                Upload File
                <input
                  type="file"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            <div className="space-y-2">
              {customer.files && customer.files.length > 0 ? (
                customer.files.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/30 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
                      <div className="min-w-0">
                        <a 
                          href={file.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm font-bold text-slate-850 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline truncate block"
                        >
                          {file.name}
                        </a>
                        <span className="text-[10px] text-slate-450 dark:text-slate-500 block">
                          Uploaded {new Date(file.uploadedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleFileDelete(idx)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-455 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-sm italic bg-slate-50/50 dark:bg-slate-900/20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                  No files uploaded yet.
                </div>
              )}
            </div>
          </div>

          {/* Activity Logs */}
          <div className="glass p-6 rounded-3xl">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Communication History</h3>
              <button 
                onClick={() => setIsAddingTimeline(!isAddingTimeline)}
                className="text-indigo-600 dark:text-indigo-400 text-sm font-bold hover:underline"
              >
                {isAddingTimeline ? 'Cancel' : '+ Log Interaction'}
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
                  placeholder="Summarize the interaction..."
                  rows={2}
                />
                <button
                  onClick={handleAddTimeline}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all"
                >
                  Save Entry
                </button>
              </div>
            )}

            <div className="relative space-y-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100 dark:before:bg-slate-800">
              {customer.timeline && customer.timeline.length > 0 ? customer.timeline.map((entry) => (
                <div key={entry._id || Math.random().toString()} className="relative pl-10">
                  <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center z-10 shadow-sm">
                    {entry.type === 'note' && <MessageSquare className="w-3 h-3 text-slate-400 dark:text-slate-500" />}
                    {entry.type === 'call' && <PhoneCall className="w-3 h-3 text-slate-400 dark:text-slate-500" />}
                    {entry.type === 'email' && <MailPlus className="w-3 h-3 text-slate-400 dark:text-slate-500" />}
                    {entry.type === 'status' && <History className="w-3 h-3 text-slate-400 dark:text-slate-500" />}
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
                  No interactions recorded yet.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Internal Notes */}
        <div className="space-y-6">
          <div className="glass p-6 rounded-2xl relative overflow-hidden">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest opacity-40 mb-4">Account Notes</h3>
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
                    "{customer.notes || 'No account notes available.'}"
                  </p>
                </div>
                <button 
                  onClick={() => setIsEditingNotes(true)}
                  className="mt-4 w-full py-2.5 text-indigo-600 dark:text-indigo-400 text-sm font-bold hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-xl transition-all"
                >
                  Edit Notes
                </button>
              </>
            )}
          </div>

          {customer.pdfUrl && (
            <div className="glass p-6 rounded-2xl space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest opacity-40">Contract Document</h3>
              <div className="p-4 bg-indigo-50/50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-900/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-indigo-500 shadow-sm">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300 block">Signed Contract</span>
                    <span className="text-xs text-slate-500">PDF Document</span>
                  </div>
                </div>
                <a 
                  href={`http://localhost:5000${customer.pdfUrl}`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  View
                </a>
              </div>
            </div>
          )}

          <div className="glass p-6 rounded-2xl space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest opacity-40">System Record</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">Record Created</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">{new Date(customer.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">Last Synced</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">{new Date(customer.updatedAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">Customer ID</span>
                <span className="font-mono text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">{customer._id}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDetail;
