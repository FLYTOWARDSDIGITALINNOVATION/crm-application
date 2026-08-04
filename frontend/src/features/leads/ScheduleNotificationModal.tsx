import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar, Clock, CheckCircle2 } from 'lucide-react';
import { useAppDispatch } from '../../store';
import { createTask } from '../../store/slices/taskSlice';

interface ScheduleNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadId: string;
  leadName: string;
  status: string;
}

const ScheduleNotificationModal: React.FC<ScheduleNotificationModalProps> = ({
  isOpen,
  onClose,
  leadId,
  leadName,
  status
}) => {
  const dispatch = useAppDispatch();
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !time) return;

    try {
      const dueDate = new Date(`${date}T${time}`).toISOString();
      await dispatch(createTask({
        title: `${status} action required for ${leadName}`,
        description: notes || `Scheduled notification for ${status}`,
        dueDate,
        priority: 'High',
        status: 'Pending',
        assignedTo: 'Admin', // In real app, current user
        relatedTo: leadId,
      })).unwrap();

      onClose();
    } catch (err) {
      console.error('Failed to schedule notification:', err);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in" 
        onClick={onClose}
      ></div>

      <div className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-slide-up">
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-700/50">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white font-inter">Schedule {status}</h2>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">Set a date and time for notification</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2">Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white transition-all focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2">Time</label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                <input
                  type="time"
                  required
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white transition-all focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2">Notes (Optional)</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white transition-all focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="Any specific details for this follow up..."
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button 
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white transition-all"
            >
              Skip
            </button>
            <button 
              type="submit"
              className="px-6 py-2.5 bg-indigo-600 dark:bg-indigo-600 rounded-xl text-sm font-bold text-white hover:bg-indigo-700 dark:hover:bg-indigo-700 shadow-lg shadow-indigo-100 dark:shadow-indigo-900/30 transition-all flex items-center gap-2"
            >
              Schedule Notification
              <CheckCircle2 className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default ScheduleNotificationModal;
