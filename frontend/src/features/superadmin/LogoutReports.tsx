import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Loader2, ArrowRightLeft, MessageSquare, FileText, Link2, ImageIcon } from 'lucide-react';
import { cn } from '../../utils/cn';
import api from '../../utils/api';

const getDaysInMonth = (date: Date) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDay = firstDay.getDay();

  const days = [];
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = startingDay - 1; i >= 0; i--) {
    days.push({ date: new Date(year, month - 1, prevMonthLastDay - i), isCurrentMonth: false });
  }

  for (let i = 1; i <= daysInMonth; i++) {
    days.push({ date: new Date(year, month, i), isCurrentMonth: true });
  }

  const remainingCells = 42 - days.length;
  for (let i = 1; i <= remainingCells; i++) {
    days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
  }

  return days;
};

const isSameDay = (d1Str?: string, d2?: Date) => {
  if (!d1Str || !d2) return false;
  const d1 = new Date(d1Str);
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
};

const hasSessionOnDate = (date: Date, sessions: any[]) => {
  return sessions.some(s => isSameDay(s.logoutAt, date) || isSameDay(s.loginAt, date) || isSameDay(s.createdAt, date));
};

const LogoutReports = () => {
  const [allSessions, setAllSessions] = useState<any[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionsError, setSessionsError] = useState('');
  const [calendarViewDate, setCalendarViewDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  useEffect(() => {
    const fetchAllSessions = async () => {
      setSessionsLoading(true);
      setSessionsError('');
      try {
        const response = await api.get('/users/work-sessions');
        setAllSessions(response.data || []);
      } catch (err: any) {
        setSessionsError(err?.response?.data?.message || 'Failed to load logout reports');
      } finally {
        setSessionsLoading(false);
      }
    };

    fetchAllSessions();
  }, []);

  if (sessionsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (sessionsError) {
    return (
      <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl text-sm font-medium">
        {sessionsError}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 animate-fade-in items-start">
      {/* Calendar Sidebar */}
      <div className="lg:col-span-5 space-y-4">
        <div className="glass p-4 sm:p-6 rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800 shadow-sm">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <button
              type="button"
              onClick={() => setCalendarViewDate(new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth() - 1, 1))}
              className="p-1.5 sm:p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h3 className="font-bold text-slate-800 dark:text-white text-xs sm:text-sm">
              {calendarViewDate.toLocaleString('en-IN', { month: 'long', year: 'numeric' })}
            </h3>
            <button
              type="button"
              onClick={() => setCalendarViewDate(new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth() + 1, 1))}
              className="p-1.5 sm:p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-all"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Weekdays Grid */}
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 uppercase mb-2">
            <div>Su</div><div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div>
          </div>

          {/* Month Days Grid */}
          <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
            {getDaysInMonth(calendarViewDate).map((dayObj, idx) => {
              const isSelected = dayObj.date.toDateString() === selectedDate.toDateString();
              const isToday = dayObj.date.toDateString() === new Date().toDateString();
              const hasSession = hasSessionOnDate(dayObj.date, allSessions);
              
              return (
                <button
                  type="button"
                  key={idx}
                  onClick={() => setSelectedDate(dayObj.date)}
                  className={cn(
                    "h-8 sm:h-10 relative flex flex-col items-center justify-center rounded-xl text-xs font-semibold transition-all hover:scale-105",
                    !dayObj.isCurrentMonth && "text-slate-300 dark:text-slate-600 opacity-60",
                    dayObj.isCurrentMonth && !isSelected && "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700",
                    isSelected && "bg-indigo-600 text-white shadow-md shadow-indigo-200/50 dark:shadow-none hover:bg-indigo-700",
                    isToday && !isSelected && "border border-indigo-200 text-indigo-600 dark:text-indigo-400 dark:border-indigo-800"
                  )}
                >
                  <span>{dayObj.date.getDate()}</span>
                  {hasSession && (
                    <span className={cn(
                      "w-1.5 h-1.5 rounded-full absolute bottom-1 sm:bottom-1.5",
                      isSelected ? "bg-white" : "bg-indigo-500"
                    )} />
                  )}
                </button>
              );
            })}
          </div>
        </div>
        
        <div className="p-3.5 sm:p-4 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100/50 dark:border-indigo-800/30 flex items-start gap-3">
          <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg text-indigo-600 dark:text-indigo-400 mt-0.5 shrink-0">
            <ArrowRightLeft className="w-4 h-4" />
          </div>
          <p className="text-xs text-indigo-900/70 dark:text-indigo-300/70 leading-relaxed font-medium">
            Select a date to view logout session reports submitted for that day.
          </p>
        </div>
      </div>

      {/* Daily Reports View */}
      <div className="lg:col-span-7">
        {(() => {
          const filteredSessions = allSessions.filter(s =>
            isSameDay(s.logoutAt, selectedDate) ||
            isSameDay(s.loginAt, selectedDate) ||
            isSameDay(s.createdAt, selectedDate)
          );
          return (
            <>
              <div className="mb-4 sm:mb-6">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Reports for {selectedDate.toLocaleString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  {filteredSessions.length} session(s) recorded
                </p>
              </div>

              {filteredSessions.length === 0 ? (
                <div className="py-8 sm:py-12 text-center text-xs sm:text-sm text-slate-500 dark:text-slate-400 bg-slate-50/30 dark:bg-slate-900/20 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 p-4">
                  No logout reports submitted on this date.
                </div>
              ) : (
                <div className="space-y-4 sm:space-y-6 max-h-[70vh] overflow-y-auto pr-1 sm:pr-2 custom-scrollbar">
                  {filteredSessions
                    .sort((a, b) => new Date(b.logoutAt || b.loginAt).getTime() - new Date(a.logoutAt || a.loginAt).getTime())
                    .map((session) => {
                        const duration = session.loginAt && session.logoutAt
                          ? (() => {
                              const start = new Date(session.loginAt).getTime();
                              const end = new Date(session.logoutAt).getTime();
                              const diff = Math.max(0, end - start);
                              const minutes = Math.floor(diff / 60000);
                              const hours = Math.floor(minutes / 60);
                              const remaining = minutes % 60;
                              return `${hours}h ${remaining}m`;
                            })()
                          : '—';

                        const formatDateTime = (dateStr?: string) => {
                          if (!dateStr) return 'Never';
                          return new Date(dateStr).toLocaleString('en-IN', {
                            day: '2-digit', month: 'short', year: 'numeric',
                            hour: '2-digit', minute: '2-digit'
                          });
                        };

                        return (
                          <article key={session._id} className="glass p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-100 dark:border-slate-700/60 bg-white dark:bg-slate-800 shadow-sm flex flex-col gap-3.5 transition-all hover:shadow-md">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-700 pb-3">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold shrink-0">
                                  {session.userName?.charAt(0).toUpperCase() || '?'}
                                </div>
                                <div className="min-w-0">
                                  <h4 className="font-bold text-slate-900 dark:text-white leading-tight text-sm truncate">{session.userName || 'Unknown'}</h4>
                                  <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate block">{session.userEmail || 'No email'}</span>
                                </div>
                              </div>
                              
                              <div className="flex flex-wrap gap-2">
                                <span className="text-[9px] font-black uppercase tracking-[0.1em] bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded">
                                  Session: {duration}
                                </span>
                                <span className="text-[9px] font-black uppercase tracking-[0.1em] bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded">
                                  Logout: {formatDateTime(session.logoutAt)}
                                </span>
                              </div>
                            </div>

                            {session.workSummary && (
                              <div className="rounded-2xl bg-slate-50/50 dark:bg-slate-900/40 p-3.5 sm:p-4 border border-slate-100 dark:border-slate-750">
                                <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">
                                  <FileText className="w-3.5 h-3.5" />
                                  Work Summary
                                </div>
                                <p className="text-xs text-slate-700 dark:text-slate-350 leading-relaxed whitespace-pre-wrap">{session.workSummary}</p>
                              </div>
                            )}

                            <div className="flex flex-col sm:flex-row gap-3 sm:items-end justify-between pt-1">
                              {session.gitLink ? (
                                <a
                                  href={session.gitLink}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 px-3.5 py-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/50 transition-all self-start"
                                >
                                  <Link2 className="w-3.5 h-3.5" />
                                  Git Link
                                </a>
                              ) : <div />}

                              {session.screenshot && (
                                <div className="overflow-hidden rounded-xl border border-slate-100 dark:border-slate-700/80 bg-white dark:bg-slate-900 shadow-sm flex flex-col w-full sm:w-40 shrink-0">
                                  <div className="flex items-center gap-1 border-b border-slate-100 dark:border-slate-800 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.25em] text-slate-400">
                                    <ImageIcon className="w-3 h-3 text-indigo-500" />
                                    Screenshot Proof
                                  </div>
                                  <img
                                    src={session.screenshot}
                                    alt="Screenshot proof"
                                    className="h-24 sm:h-16 w-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                    onClick={() => window.open(session.screenshot, '_blank')}
                                  />
                                </div>
                              )}
                            </div>
                          </article>
                        );
                      })}
                </div>
              )}
            </>
          );
        })()}
      </div>
    </div>
  );
};

export default LogoutReports;
