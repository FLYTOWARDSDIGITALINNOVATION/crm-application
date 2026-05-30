import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Mail, Phone, Building2,  
  Tag, MessageSquare, History,
  PhoneCall, MailPlus, AlertCircle,
  Star, TrendingUp, DollarSign, Calendar, Lock, Trash2
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
  const customer = customers.find((c) => c._id === id);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddingTimeline, setIsAddingTimeline] = useState(false);
  const [newTimelineContent, setNewTimelineContent] = useState('');
  const [timelineType, setTimelineType] = useState<'note' | 'call' | 'email'>('note');
  
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [editableNotes, setEditableNotes] = useState('');

  useEffect(() => {
    if (customer) {
      setEditableNotes(customer.notes || '');
    }
  }, [customer]);

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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link 
            to="/customers" 
            className="p-2 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-slate-900 transition-all hover:translate-x-[-2px]"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">{customer.name}</h1>
              <span className={cn(
                "px-2.5 py-1 rounded-full text-xs font-bold border",
                statusColors[customer.status as keyof typeof statusColors]
              )}>
                {customer.status}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500 mt-0.5">
              <Building2 className="w-4 h-4" />
              <span>{customer.company || 'No Company'}</span>
              <span className="mx-1 opacity-20">•</span>
              <span>Joined {new Date(customer.joinedAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleRemoveCustomer}
            className="px-4 py-2 bg-white border border-rose-200 rounded-xl text-sm font-semibold text-rose-600 hover:bg-rose-50 hover:border-rose-300 transition-all flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Remove
          </button>
          <button 
            onClick={() => setIsEditModalOpen(true)}
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-all"
          >
            Edit Profile
          </button>
          <button className="px-4 py-2 bg-indigo-600 rounded-xl text-sm font-semibold text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Create Invoice
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="glass p-4 rounded-2xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Total Spent</span>
                <span className="text-lg font-bold text-slate-900">${customer.totalSpent?.toLocaleString()}</span>
              </div>
            </div>
            <div className="glass p-4 rounded-2xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                <Star className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Tier</span>
                <span className="text-lg font-bold text-slate-900">{customer.status === 'VIP' ? 'Platinum' : 'Standard'}</span>
              </div>
            </div>
            <div className="glass p-4 rounded-2xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Last Activity</span>
                <span className="text-lg font-bold text-slate-900">2 days ago</span>
              </div>
            </div>
          </div>

          <div className="glass p-6 rounded-2xl space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest opacity-40">Customer Insights</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block font-bold">Email</span>
                    <span className="text-sm font-bold text-slate-700">{customer.email}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block font-bold">Phone</span>
                    <span className="text-sm font-bold text-slate-700">{customer.phone || 'N/A'}</span>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                    <Tag className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block font-bold">Industry Sector</span>
                    <span className="text-sm font-bold text-slate-700">{customer.sector || 'General'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block font-bold">Business Name</span>
                    <span className="text-sm font-bold text-slate-700">{customer.company || 'Private Individual'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Portal Credentials */}
          <div className="glass p-6 rounded-2xl space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest opacity-40">Portal Credentials</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs text-indigo-400/80 block font-bold">User ID / Email</span>
                    <span className="text-sm font-bold text-slate-700">{customer.email}</span>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs text-indigo-400/80 block font-bold">Initial Password</span>
                    <span className="text-sm font-mono font-bold text-slate-700">{customer.portalPassword || 'Not Available'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Logs */}
          <div className="glass p-6 rounded-3xl">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-bold text-slate-900">Communication History</h3>
              <button 
                onClick={() => setIsAddingTimeline(!isAddingTimeline)}
                className="text-indigo-600 text-sm font-bold hover:underline"
              >
                {isAddingTimeline ? 'Cancel' : '+ Log Interaction'}
              </button>
            </div>

            {isAddingTimeline && (
              <div className="mb-8 p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4 animate-slide-down">
                <div className="flex gap-2">
                  {(['note', 'call', 'email'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setTimelineType(type)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all",
                        timelineType === type ? "bg-indigo-600 text-white shadow-md" : "bg-white text-slate-500 border border-slate-200"
                      )}
                    >
                      {type}
                    </button>
                  ))}
                </div>
                <textarea
                  value={newTimelineContent}
                  onChange={(e) => setNewTimelineContent(e.target.value)}
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
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

            <div className="relative space-y-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100">
              {customer.timeline && customer.timeline.length > 0 ? customer.timeline.map((entry) => (
                <div key={entry._id || Math.random().toString()} className="relative pl-10">
                  <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center z-10 shadow-sm">
                    {entry.type === 'note' && <MessageSquare className="w-3 h-3 text-slate-400" />}
                    {entry.type === 'call' && <PhoneCall className="w-3 h-3 text-slate-400" />}
                    {entry.type === 'email' && <MailPlus className="w-3 h-3 text-slate-400" />}
                    {entry.type === 'status' && <History className="w-3 h-3 text-slate-400" />}
                  </div>
                  <div className="bg-slate-50/50 rounded-2xl p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold text-slate-800">{entry.content}</span>
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
                <div className="pl-10 text-slate-400 text-sm italic">
                  No interactions recorded yet.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Internal Notes */}
        <div className="space-y-6">
          <div className="glass p-6 rounded-2xl relative overflow-hidden">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest opacity-40 mb-4">Account Notes</h3>
            {isEditingNotes ? (
              <div className="space-y-3">
                <textarea
                  value={editableNotes}
                  onChange={(e) => setEditableNotes(e.target.value)}
                  className="w-full p-4 bg-white border border-indigo-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
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
                    className="flex-1 py-2 bg-slate-100 text-slate-500 text-xs font-bold rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100">
                  <p className="text-sm text-slate-700 leading-relaxed italic">
                    "{customer.notes || 'No account notes available.'}"
                  </p>
                </div>
                <button 
                  onClick={() => setIsEditingNotes(true)}
                  className="mt-4 w-full py-2.5 text-indigo-600 text-sm font-bold hover:bg-indigo-50 rounded-xl transition-all"
                >
                  Edit Notes
                </button>
              </>
            )}
          </div>

          <div className="glass p-6 rounded-2xl space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest opacity-40">System Record</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Record Created</span>
                <span className="font-bold text-slate-700">{new Date(customer.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Last Synced</span>
                <span className="font-bold text-slate-700">{new Date(customer.updatedAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Customer ID</span>
                <span className="font-mono text-[10px] font-bold text-slate-400 uppercase">{customer._id}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDetail;
