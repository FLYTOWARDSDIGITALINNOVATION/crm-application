import React, { useState, useEffect } from 'react';
import { 
  Mail, Phone, Building2, Tag, MessageSquare, History, 
  PhoneCall, MailPlus, AlertCircle, TrendingUp, Calendar,
  Send, Award, CheckCircle2, LayoutDashboard, CheckSquare, LifeBuoy, Plus
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../store';
import { fetchTasks, createTask } from '../../store/slices/taskSlice';
import SupportTickets from '../support/SupportTickets';
import api from '../../utils/api';
import { cn } from '../../utils/cn';

interface CustomerTimelineEntry {
  _id?: string;
  type: 'note' | 'call' | 'email' | 'status';
  content: string;
  user: string;
  createdAt: string;
}

interface CustomerProfile {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  sector?: string;
  totalSpent: number;
  status: 'Active' | 'VIP' | 'New' | 'Inactive';
  notes?: string;
  timeline?: CustomerTimelineEntry[];
  joinedAt: string;
  createdAt: string;
}

const CustomerDashboard: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const { items: allTasks, isLoading: isTasksLoading } = useAppSelector((state) => state.tasks);

  const [customer, setCustomer] = useState<CustomerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'support'>('overview');

  // Interaction Form
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'note' | 'call' | 'email'>('note');
  const [isSending, setIsSending] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Task Form
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('Medium');

  const fetchCustomerProfile = async (silent = false) => {
    if (!user?.email) return;
    try {
      if (!silent) setIsLoading(true);
      const response = await api.get(`/customers/email/${user.email}`);
      setCustomer(response.data);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching customer profile:', err);
      setError(err.response?.data?.message || 'Could not find your customer profile. Please contact support.');
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomerProfile(false);
    dispatch(fetchTasks());

    const intervalId = setInterval(() => {
      fetchCustomerProfile(true); // silent fetch to prevent reload flickering
    }, 5000);
    return () => clearInterval(intervalId);
  }, [user?.email, dispatch]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !customer) return;

    try {
      setIsSending(true);
      const content = `${messageType === 'note' ? 'Message' : messageType === 'call' ? 'Requested Callback' : 'Emailed Support'}: ${message}`;
      
      const response = await api.post(`/customers/${customer._id}/timeline`, {
        type: messageType,
        content: content,
        user: 'Customer (Self)'
      });

      setCustomer(response.data);
      setMessage('');
      setSuccessMsg('Your message was successfully logged into the CRM timeline!');
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      console.error('Failed to log message:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !newTaskDueDate) return;
    
    await dispatch(createTask({
      title: newTaskTitle,
      dueDate: newTaskDueDate,
      priority: newTaskPriority,
      status: 'Pending',
      assignedTo: 'Pending Allocation',
      relatedTo: customer?.name || user?.name || 'Customer'
    }));
    
    setNewTaskTitle('');
    setNewTaskDueDate('');
    setNewTaskPriority('Medium');
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
        <p className="text-slate-500 font-medium">Connecting to CRM Secure Gateway...</p>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="max-w-md mx-auto my-12 text-center p-8 glass rounded-3xl border border-rose-100 dark:border-rose-900/30">
        <AlertCircle className="w-16 h-16 text-rose-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">CRM Link Unsuccessful</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">{error || 'Your customer profile could not be loaded.'}</p>
        <button 
          onClick={() => fetchCustomerProfile(false)}
          className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-md hover:bg-indigo-700 transition-all"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const myTasks = allTasks.filter(t => t.relatedTo === (customer?.name || user?.name));

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Tab Navigation */}
      <div className="flex flex-wrap items-center gap-2 mb-2 bg-slate-200/50 dark:bg-slate-800/50 p-1.5 rounded-2xl w-max">
        <button onClick={() => setActiveTab('overview')} className={cn("px-4 sm:px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all", activeTab === 'overview' ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700")}>
          <LayoutDashboard className="w-4 h-4" /> Overview
        </button>
        <button onClick={() => setActiveTab('tasks')} className={cn("px-4 sm:px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all", activeTab === 'tasks' ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700")}>
          <CheckSquare className="w-4 h-4" /> Tasks
        </button>
        <button onClick={() => setActiveTab('support')} className={cn("px-4 sm:px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all", activeTab === 'support' ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700")}>
          <LifeBuoy className="w-4 h-4" /> Support
        </button>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-8 animate-fade-in">
          {/* Welcome Banner */}
          <div className="bg-hero-gradient p-8 rounded-3xl text-white shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-6 relative overflow-hidden">
            <div className="absolute right-0 top-0 translate-x-[20%] -translate-y-[20%] w-64 h-64 bg-white/5 rounded-full pointer-events-none blur-2xl"></div>
            <div>
              <span className="text-[10px] uppercase font-bold text-indigo-200 tracking-widest bg-white/10 px-3 py-1 rounded-full">Secure Customer Portal</span>
              <h1 className="text-3xl font-extrabold font-inter tracking-tight mt-3">Welcome Back, {customer.name}!</h1>
              <p className="text-indigo-100/80 text-sm mt-1">Manage your account services and view real-time sync with FlyTowards CRM.</p>
            </div>
            <div className="flex items-center gap-3">
              <div className={cn(
                "px-4 py-2 rounded-2xl text-xs font-bold border backdrop-blur-sm shadow-sm",
                customer.status === 'VIP' ? "bg-amber-500/10 text-amber-200 border-amber-500/30" : "bg-white/10 text-white border-white/20"
              )}>
                {customer.status === 'VIP' ? '🏆 VIP Platinum Customer' : '🛡️ Standard Member'}
              </div>
            </div>
          </div>

          {/* KPI Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass p-6 rounded-2xl border border-white/40 dark:border-slate-700/50 flex items-center gap-4 relative overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Account Balance Spent</span>
                <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">₹{customer.totalSpent?.toLocaleString()}</span>
              </div>
            </div>

            <div className="glass p-6 rounded-2xl border border-white/40 dark:border-slate-700/50 flex items-center gap-4 relative overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Tier Status</span>
                <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">
                  {customer.status === 'VIP' ? 'Platinum VIP' : 'Active Client'}
                </span>
              </div>
            </div>

            <div className="glass p-6 rounded-2xl border border-white/40 dark:border-slate-700/50 flex items-center gap-4 relative overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Client Since</span>
                <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">
                  {new Date(customer.joinedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                </span>
              </div>
            </div>
          </div>

          {/* Main Grid content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="glass p-6 rounded-3xl border border-white/40 dark:border-slate-700/50 shadow-sm relative">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">CRM Live Communication Feed</h3>
                    <p className="text-slate-400 dark:text-slate-500 text-xs mt-0.5">Real-time trace of interaction updates and account statuses.</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-800/50 px-3 py-1 rounded-full">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                    Connected
                  </div>
                </div>

                <div className="relative space-y-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100 dark:before:bg-slate-700">
                  {customer.timeline && customer.timeline.length > 0 ? (
                    customer.timeline.map((entry, index) => (
                      <div key={entry._id || index} className="relative pl-10">
                        <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center z-10 shadow-sm">
                          {entry.type === 'note' && <MessageSquare className="w-3 h-3 text-slate-400 dark:text-slate-500" />}
                          {entry.type === 'call' && <PhoneCall className="w-3 h-3 text-slate-400 dark:text-slate-500" />}
                          {entry.type === 'email' && <MailPlus className="w-3 h-3 text-slate-400 dark:text-slate-500" />}
                          {entry.type === 'status' && <History className="w-3 h-3 text-slate-400 dark:text-slate-500" />}
                        </div>
                        <div className="bg-slate-50/50 dark:bg-slate-800/50 rounded-2xl p-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border border-slate-100/50 dark:border-slate-700/50">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{entry.content}</span>
                            <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                              {new Date(entry.createdAt).toLocaleDateString()} {new Date(entry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-700 dark:text-indigo-400 text-[8px] font-bold">
                              {entry.user.charAt(0)}
                            </div>
                            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Updated by {entry.user}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="pl-10 text-slate-400 dark:text-slate-500 text-sm italic py-4">
                      No interactions logged yet on your record.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="glass p-6 rounded-2xl border border-white/40 dark:border-slate-700/50 shadow-sm relative">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest opacity-40 mb-3">Service Gateway</h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs mb-4">Send messages or requests directly to your account representative.</p>

                {successMsg && (
                  <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-800/50 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-semibold flex items-center gap-2 animate-fade-in">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    {successMsg}
                  </div>
                )}

                <form onSubmit={handleSendMessage} className="space-y-4">
                  <div className="flex gap-2">
                    {(['note', 'call', 'email'] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setMessageType(type)}
                        className={cn(
                          "flex-1 py-2 rounded-xl text-xs font-bold capitalize transition-all border",
                          messageType === type
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-100 dark:shadow-indigo-900/50"
                            : "bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
                        )}
                      >
                        {type === 'note' ? '📝 Note' : type === 'call' ? '📞 Call' : '✉️ Support'}
                      </button>
                    ))}
                  </div>

                  <div>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder={
                        messageType === 'note' 
                          ? "Write a note/question for your manager..." 
                          : messageType === 'call' 
                          ? "Describe your preferred callback time & reason..." 
                          : "Write your email message for support..."
                      }
                      required
                      rows={4}
                      className="w-full p-4 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder-slate-400 dark:placeholder-slate-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSending}
                    className="w-full py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSending ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        Log Service Message
                        <Send className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              </div>

              <div className="glass p-6 rounded-2xl border border-white/40 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest opacity-40">CRM Details Overview</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold">Registered Email</span>
                      <span className="text-xs font-bold text-slate-700">{customer.email}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold">Contact Phone</span>
                      <span className="text-xs font-bold text-slate-700">{customer.phone || 'N/A'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold">Company</span>
                      <span className="text-xs font-bold text-slate-700">{customer.company || 'Private Individual'}</span>
                    </div>
                  </div>

                  {customer.sector && (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                        <Tag className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold">Industry Sector</span>
                        <span className="text-xs font-bold text-slate-700">{customer.sector}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'tasks' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
          <div className="lg:col-span-2 space-y-6">
            <div className="glass p-6 rounded-3xl border border-white/40 dark:border-slate-700/50 shadow-sm min-h-[400px]">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">My Tasks & Requests</h3>
              {isTasksLoading ? (
                 <div className="text-center py-10 text-slate-500 dark:text-slate-400 flex flex-col items-center">
                    <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
                    Loading tasks...
                 </div>
              ) : myTasks.length > 0 ? (
                 <div className="space-y-4">
                   {myTasks.map(task => (
                      <div key={task.id} className="p-4 rounded-2xl bg-white/60 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-md transition-shadow">
                         <div>
                            <h4 className="font-bold text-slate-800 dark:text-slate-200">{task.title}</h4>
                            <div className="flex flex-wrap gap-4 mt-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                               <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" /> Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                               <span className="flex items-center gap-1.5"><Tag className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" /> Priority: {task.priority}</span>
                               <span className="flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" /> Status: {task.status}</span>
                            </div>
                         </div>
                         <div className="sm:text-right shrink-0 bg-slate-50 dark:bg-slate-900 p-2 rounded-xl">
                            <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block mb-1">Assigned To</span>
                            <span className={cn(
                              "text-xs font-bold px-2 py-1 rounded-md inline-block",
                              task.assignedTo === 'Pending Allocation' ? "text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30" : "text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/30"
                            )}>
                              {task.assignedTo}
                            </span>
                         </div>
                      </div>
                   ))}
                 </div>
              ) : (
                 <div className="text-center py-16 text-slate-400 dark:text-slate-500 italic">
                    <CheckSquare className="w-12 h-12 text-slate-200 dark:text-slate-700 mx-auto mb-3" />
                    No tasks assigned yet. Create a request to get started!
                 </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="glass p-6 rounded-3xl border border-white/40 dark:border-slate-700/50 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest opacity-40 mb-6">Create New Request</h3>
              <form onSubmit={handleCreateTask} className="space-y-4">
                 <div>
                   <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Task Description</label>
                   <input 
                     type="text" 
                     required 
                     value={newTaskTitle} 
                     onChange={e => setNewTaskTitle(e.target.value)} 
                     className="w-full bg-white/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder-slate-400 dark:placeholder-slate-500" 
                     placeholder="What needs to be done?" 
                   />
                 </div>
                 <div>
                   <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Expected Due Date</label>
                   <input 
                     type="date" 
                     required 
                     value={newTaskDueDate} 
                     onChange={e => setNewTaskDueDate(e.target.value)} 
                     className="w-full bg-white/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" 
                   />
                 </div>
                 <div>
                   <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Priority Level</label>
                   <select 
                     value={newTaskPriority} 
                     onChange={e => setNewTaskPriority(e.target.value)} 
                     className="w-full bg-white/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                   >
                     <option value="Low">Low Priority</option>
                     <option value="Medium">Medium Priority</option>
                     <option value="High">High Priority</option>
                   </select>
                 </div>
                 <button 
                   type="submit" 
                   className="w-full mt-4 bg-indigo-600 text-white rounded-xl py-3.5 text-sm font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 shadow-xl shadow-indigo-100 dark:shadow-indigo-900/50 transition-all"
                 >
                    <Plus className="w-5 h-5" /> Submit Request
                 </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'support' && (
        <div className="animate-fade-in bg-white/60 p-4 rounded-3xl border border-white/40 shadow-sm relative z-0">
          <SupportTickets />
        </div>
      )}
    </div>
  );
};

export default CustomerDashboard;
