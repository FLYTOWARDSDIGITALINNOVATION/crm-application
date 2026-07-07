import React, { useState, useEffect } from 'react';
import { 
  Mail, Phone, Building2, Tag, MessageSquare, History, 
  PhoneCall, MailPlus, AlertCircle, TrendingUp, Calendar,
  Send, Award, CheckCircle2
} from 'lucide-react';
import { useAppSelector } from '../../store';
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
  const [customer, setCustomer] = useState<CustomerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Interaction Form
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'note' | 'call' | 'email'>('note');
  const [isSending, setIsSending] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const fetchCustomerProfile = async () => {
    if (!user?.email) return;
    try {
      setIsLoading(true);
      const response = await api.get(`/customers/email/${user.email}`);
      setCustomer(response.data);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching customer profile:', err);
      setError(err.response?.data?.message || 'Could not find your customer profile. Please contact support.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomerProfile();
    const intervalId = setInterval(() => {
      fetchCustomerProfile();
    }, 5000);
    return () => clearInterval(intervalId);
  }, [user?.email]);

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

      // Update local state with updated customer record
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
      <div className="max-w-md mx-auto my-12 text-center p-8 glass rounded-3xl border border-rose-100">
        <AlertCircle className="w-16 h-16 text-rose-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-800 mb-2">CRM Link Unsuccessful</h2>
        <p className="text-slate-500 text-sm mb-6">{error || 'Your customer profile could not be loaded.'}</p>
        <button 
          onClick={fetchCustomerProfile}
          className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-md hover:bg-indigo-700 transition-all"
        >
          Retry Connection
        </button>
      </div>
    );
  }


  return (
    <div className="space-y-8 animate-fade-in pb-16">
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
        {/* Total Spent */}
        <div className="glass p-6 rounded-2xl border border-white/40 flex items-center gap-4 relative overflow-hidden shadow-sm hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Account Balance Spent</span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">₹{customer.totalSpent?.toLocaleString()}</span>
          </div>
        </div>

        {/* Account Tier */}
        <div className="glass p-6 rounded-2xl border border-white/40 flex items-center gap-4 relative overflow-hidden shadow-sm hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Tier Status</span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">
              {customer.status === 'VIP' ? 'Platinum VIP' : 'Active Client'}
            </span>
          </div>
        </div>

        {/* Member Since */}
        <div className="glass p-6 rounded-2xl border border-white/40 flex items-center gap-4 relative overflow-hidden shadow-sm hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Client Since</span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">
              {new Date(customer.joinedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Real-Time Communication History */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass p-6 rounded-3xl border border-white/40 shadow-sm relative">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-lg font-bold text-slate-900">CRM Live Communication Feed</h3>
                <p className="text-slate-400 text-xs mt-0.5">Real-time trace of interaction updates and account statuses.</p>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                Connected
              </div>
            </div>

            <div className="relative space-y-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100">
              {customer.timeline && customer.timeline.length > 0 ? (
                customer.timeline.map((entry, index) => (
                  <div key={entry._id || index} className="relative pl-10">
                    <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center z-10 shadow-sm">
                      {entry.type === 'note' && <MessageSquare className="w-3 h-3 text-slate-400" />}
                      {entry.type === 'call' && <PhoneCall className="w-3 h-3 text-slate-400" />}
                      {entry.type === 'email' && <MailPlus className="w-3 h-3 text-slate-400" />}
                      {entry.type === 'status' && <History className="w-3 h-3 text-slate-400" />}
                    </div>
                    <div className="bg-slate-50/50 rounded-2xl p-4 hover:bg-slate-50 transition-colors border border-slate-100/50">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-bold text-slate-800">{entry.content}</span>
                        <span className="text-xs text-slate-400 font-medium">
                          {new Date(entry.createdAt).toLocaleDateString()} {new Date(entry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-[8px] font-bold">
                          {entry.user.charAt(0)}
                        </div>
                        <span className="text-xs text-slate-500 font-medium">Updated by {entry.user}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="pl-10 text-slate-400 text-sm italic py-4">
                  No interactions logged yet on your record.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Interaction services and profile summary */}
        <div className="space-y-6">
          {/* Quick Support / Message Box */}
          <div className="glass p-6 rounded-2xl border border-white/40 shadow-sm relative">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest opacity-40 mb-3">Service Gateway</h3>
            <p className="text-slate-500 text-xs mb-4">Send messages or requests directly to your account representative.</p>

            {successMsg && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-xl text-xs font-semibold flex items-center gap-2 animate-fade-in">
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
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-100"
                        : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
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
                  className="w-full p-4 bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder-slate-400"
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

          {/* Profile overview card */}
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
  );
};

export default CustomerDashboard;
