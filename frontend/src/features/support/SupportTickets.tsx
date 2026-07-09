import React, { useEffect, useState } from 'react';
import { 
  MessageSquare, MoreVertical, Search, 
  Plus, CheckCircle2, AlertCircle, Clock, 
  User, Send, Paperclip, Smile, X, ArrowLeft, Loader2
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchTickets, createTicket, addMessageToTicket, updateTicketStatus } from '../../store/slices/supportSlice';

const SupportTickets: React.FC = () => {
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<'list' | 'conversation'>('list');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTicket, setNewTicket] = useState({ subject: '', description: '', priority: 'Medium' });
  const [searchQuery, setSearchQuery] = useState('');
  const [inputText, setInputText] = useState('');
  
  const dispatch = useAppDispatch();
  const { user } = useAppSelector(state => state.auth);
  const { items: allTickets, isLoading, error } = useAppSelector(state => state.support);

  useEffect(() => {
    dispatch(fetchTickets());
  }, [dispatch]);

  const tickets = allTickets.filter(t => 
    t.subject.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.customer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentTicket = allTickets.find(t => t.id === selectedTicket);

  const handleCreateTicket = async () => {
    if (!newTicket.subject.trim()) return;
    await dispatch(createTicket({
      subject: newTicket.subject,
      description: newTicket.description,
      priority: newTicket.priority,
    }));
    setIsModalOpen(false);
    setNewTicket({ subject: '', description: '', priority: 'Medium' });
  };

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-rose-50 text-rose-600 border-rose-100';
      case 'Medium': return 'bg-amber-50 text-amber-600 border-amber-100';
      default: return 'bg-slate-50 text-slate-500 border-slate-100';
    }
  };

  const handleSend = () => {
    if (!inputText.trim() || !selectedTicket) return;
    dispatch(addMessageToTicket({
      ticketId: selectedTicket,
      text: inputText,
    }));
    setInputText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSelectTicket = (id: string) => {
    setSelectedTicket(id);
    setMobileView('conversation');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] animate-fade-in space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          {/* Back button on mobile when viewing conversation */}
          {mobileView === 'conversation' && selectedTicket && (
            <button
              onClick={() => { setMobileView('list'); setSelectedTicket(null); }}
              className="flex items-center gap-2 text-sm font-bold text-indigo-600 mb-2 md:hidden hover:underline"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Messages
            </button>
          )}
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 font-inter tracking-tight">Support Center</h1>
          <p className="text-slate-500 text-sm hidden sm:block">Resolve customer inquiries and maintain high satisfaction.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-3 sm:px-6 py-2 sm:py-3 bg-indigo-600 rounded-2xl text-sm font-bold text-white hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all self-start sm:self-auto"
        >
          <Plus className="w-5 h-5" />
          <span className="hidden sm:inline">New Message</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl text-sm font-medium">
          {error}
        </div>
      )}

      <div className="flex-1 flex gap-6 min-h-0">
        {/* Ticket List - hidden on mobile when viewing conversation */}
        <div className={cn(
          "flex-col gap-4 min-h-0 overflow-hidden",
          "w-full md:w-1/3",
          mobileView === 'list' ? "flex" : "hidden md:flex"
        )}>
          <div className="glass p-3 rounded-2xl shrink-0 flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-400 ml-2" />
            <input 
              placeholder="Search messages..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-transparent border-none text-sm focus:ring-0 w-full outline-none"
            />
          </div>

          {isLoading && allTickets.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
              {tickets.map((ticket) => (
                <div 
                  key={ticket.id}
                  onClick={() => handleSelectTicket(ticket.id)}
                  className={cn(
                    "p-4 rounded-2xl cursor-pointer transition-all border-2",
                    selectedTicket === ticket.id 
                      ? "glass border-indigo-500 bg-white shadow-lg" 
                      : "glass border-transparent hover:border-slate-100"
                  )}
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className={cn(
                      "px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider border",
                      getPriorityStyle(ticket.priority)
                    )}>
                      {ticket.priority}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      {new Date(ticket.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 leading-snug line-clamp-2">{ticket.subject}</h3>
                  <div className="flex items-center justify-between mt-3 text-xs text-slate-500 font-medium">
                    <div className="flex items-center gap-2">
                      <User className="w-3 h-3 text-slate-400" />
                      {ticket.customer}
                    </div>
                    <span className={cn(
                      "px-2 py-0.5 rounded-md text-[10px] font-bold",
                      ticket.status === 'Resolved' ? "bg-emerald-50 text-emerald-700" :
                      ticket.status === 'In Progress' ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-700"
                    )}>
                      {ticket.status}
                    </span>
                  </div>
                </div>
              ))}
              {tickets.length === 0 && (
                <div className="text-center py-12 text-slate-500 italic text-sm">
                  No messages found.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Conversation View - hidden on mobile when viewing ticket list */}
        <div className={cn(
          "glass rounded-3xl flex flex-col min-h-0 overflow-hidden shadow-2xl",
          "flex-1 w-full",
          mobileView === 'conversation' ? "flex" : "hidden md:flex"
        )}>
          {selectedTicket ? (
            <>
              {/* Conversation Header */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                    {currentTicket?.customer.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 line-clamp-1">Conversation regarding: {currentTicket?.subject}</h3>
                    <p className="text-xs text-slate-500 font-medium">With {currentTicket?.customer}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      if (selectedTicket) {
                        dispatch(updateTicketStatus({ 
                          id: selectedTicket, 
                          status: currentTicket?.status === 'Resolved' ? 'Open' : 'Resolved' 
                        }));
                      }
                    }}
                    title={currentTicket?.status === 'Resolved' ? "Reopen Message" : "Resolve Message"}
                    className={cn(
                      "p-2 rounded-xl transition-all border",
                      currentTicket?.status === 'Resolved' 
                        ? "text-green-600 bg-green-50 border-green-200" 
                        : "text-slate-400 hover:text-slate-600 hover:bg-white border-transparent hover:border-slate-100"
                    )}
                  >
                    <CheckCircle2 className="w-5 h-5" />
                  </button>
                  <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-xl transition-all border border-transparent hover:border-slate-100">
                    <AlertCircle className="w-5 h-5" />
                  </button>
                  <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-xl transition-all border border-transparent hover:border-slate-100">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Chat Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 flex flex-col custom-scrollbar bg-slate-50/50">
                {currentTicket?.messages?.length ? currentTicket.messages.map((msg) => {
                  const isMe = msg.senderId === user?._id;
                  return (
                    <div 
                      key={msg.id} 
                      className={cn(
                        "max-w-[80%] p-4 text-sm leading-relaxed shadow-sm flex flex-col gap-1",
                        isMe
                          ? "self-end bg-indigo-600 text-white rounded-2xl rounded-tr-none shadow-indigo-100" 
                          : "self-start bg-white border border-slate-100 text-slate-700 rounded-2xl rounded-tl-none"
                      )}
                    >
                      {!isMe && (
                        <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wide">
                          {msg.sender} ({msg.senderRole})
                        </span>
                      )}
                      <div>{msg.text}</div>
                      <span className={cn(
                        "text-[9px] mt-1 self-end opacity-70",
                        isMe ? "text-indigo-200" : "text-slate-400"
                      )}>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                }) : (
                  <div className="flex-1 flex items-center justify-center text-slate-400 text-sm italic">
                    No messages in this ticket yet.
                  </div>
                )}
              </div>

              {/* Input Area */}
              <div className="p-6 border-t border-slate-100 shrink-0 bg-white">
                <div className="relative group">
                  <textarea 
                    rows={2}
                    placeholder="Type your response here..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-4 pr-32 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-none text-sm"
                  />
                  <div className="absolute right-3 bottom-4 flex items-center gap-2">
                    <button className="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
                      <Paperclip className="w-5 h-5" />
                    </button>
                    <button className="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
                      <Smile className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={handleSend}
                      className="bg-indigo-600 p-2.5 rounded-xl text-white shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <Clock className="w-3 h-3" />
                    Normal response time: 45 mins
                  </div>
                  <div className="text-[10px] text-slate-400 italic">
                    Press <kbd className="font-mono bg-slate-100 px-1 rounded">Enter</kbd> to send
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12 opacity-50">
              <MessageSquare className="w-16 h-16 text-slate-200 mb-4" />
              <h3 className="text-xl font-bold text-slate-400 italic">Select a message to view conversation</h3>
              <p className="text-slate-300 mt-2 text-sm max-w-xs">Connecting with your customers is just a click away.</p>
            </div>
          )}
        </div>
      </div>

      {/* New Ticket Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl relative border border-slate-100">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute right-6 top-6 text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 p-2 rounded-xl transition-all"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-bold mb-6 text-slate-900 font-inter">Create New Message</h2>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Subject</label>
                <input 
                  type="text" 
                  placeholder="E.g., Cannot access dashboard"
                  value={newTicket.subject}
                  onChange={e => setNewTicket({...newTicket, subject: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder:text-slate-400"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Description</label>
                <textarea 
                  rows={4}
                  placeholder="Describe the issue in detail..."
                  value={newTicket.description}
                  onChange={e => setNewTicket({...newTicket, description: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none transition-all placeholder:text-slate-400"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Priority</label>
                <div className="relative">
                  <select 
                    value={newTicket.priority}
                    onChange={e => setNewTicket({...newTicket, priority: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none appearance-none transition-all"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                    <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                    </svg>
                  </div>
                </div>
              </div>
              <button 
                onClick={handleCreateTicket}
                className="w-full bg-indigo-600 text-white rounded-xl py-3.5 text-sm font-bold mt-2 hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all"
              >
                Send Message
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupportTickets;
