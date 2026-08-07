import React, { useEffect, useState } from 'react';
import { CalendarDays, FileText, ImageIcon, Link2, Loader2, Sparkles } from 'lucide-react';
import api from '../../utils/api';
import { cn } from '../../utils/cn';

interface EmployeeWorkLog {
  _id: string;
  employeeId: string;
  sharedSessionId?: string;
  userName: string;
  userEmail: string;
  loginAt: string;
  logoutAt?: string | null;
  workSummary?: string;
  gitLink?: string;
  screenshot?: string;
  proofType?: 'text' | 'screenshot' | 'git-link' | 'multiple';
  status: 'active' | 'completed';
  source?: 'shared' | 'private';
}

interface EmployeeWorkHistoryProps {
  employeeId?: string;
  className?: string;
  daysToShow?: number;
}

const istDateKey = (value: string | Date) => {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(value));

  const year = parts.find((part) => part.type === 'year')?.value || '0000';
  const month = parts.find((part) => part.type === 'month')?.value || '00';
  const day = parts.find((part) => part.type === 'day')?.value || '00';

  return `${year}-${month}-${day}`;
};

const istDateLabel = (value: string | Date) =>
  new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
  }).format(new Date(value));

const istTimeLabel = (value?: string | null) => {
  if (!value) return 'Not recorded';

  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    timeStyle: 'short',
  }).format(new Date(value));
};

const buildRecentDays = (count: number) => {
  const days: Date[] = [];

  for (let index = 0; index < count; index += 1) {
    const date = new Date();
    date.setDate(date.getDate() - index);
    days.push(date);
  }

  return days;
};

const EmployeeWorkHistory: React.FC<EmployeeWorkHistoryProps> = ({
  employeeId,
  className,
  daysToShow = 14,
}) => {
  const [logs, setLogs] = useState<EmployeeWorkLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedDates, setExpandedDates] = useState<string[]>([]);

  useEffect(() => {
    if (!employeeId) {
      setLogs([]);
      return;
    }

    let isMounted = true;

    const loadLogs = async () => {
      setIsLoading(true);
      setError('');

      try {
        const response = await api.get(`/users/employees/${employeeId}/work-logs`);

        if (!isMounted) {
          return;
        }

        setLogs(response.data?.logs || []);
      } catch (requestError: any) {
        if (!isMounted) {
          return;
        }

        setError(requestError.response?.data?.message || 'Failed to load employee work logs');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadLogs();

    return () => {
      isMounted = false;
    };
  }, [employeeId]);

  if (!employeeId) {
    return null;
  }

  const logsByDate = new Map<string, EmployeeWorkLog[]>();

  logs.forEach((log) => {
    const key = istDateKey(log.loginAt);
    const dayLogs = logsByDate.get(key) || [];
    dayLogs.push(log);
    logsByDate.set(key, dayLogs);
  });

  const recentDays = buildRecentDays(daysToShow);

  return (
    <section className={cn('rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6', className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.3em] text-indigo-700">
            <Sparkles className="w-3.5 h-3.5" />
            Dedicated collection
          </div>
          <h3 className="mt-3 text-xl font-extrabold tracking-tight text-slate-900">Recent work history</h3>
          <p className="mt-1 text-sm text-slate-500">
            Summary, Git link, and screenshot details are saved per employee. Sundays appear automatically as holidays when there is no entry.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700">
          <CalendarDays className="w-4 h-4 text-indigo-500" />
          Last {daysToShow} days
        </div>
      </div>

      {isLoading && (
        <div className="mt-6 flex items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 py-10">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
        </div>
      )}

      {error && !isLoading && (
        <div className="mt-6 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {error}
        </div>
      )}

      {!isLoading && !error && (
        <div className="mt-6 space-y-4">
          {recentDays.map((day) => {
            const dateKey = istDateKey(day);
            const entries = logsByDate.get(dateKey) || [];
            const latestEntry = entries[0];
            const weekdayLabel = new Intl.DateTimeFormat('en-IN', {
              timeZone: 'Asia/Kolkata',
              weekday: 'long',
            }).format(day);
            const isSunday = weekdayLabel === 'Sunday';
            const isHoliday = isSunday && entries.length === 0;
            const statusLabel = latestEntry
              ? latestEntry.status === 'completed'
                ? 'Saved'
                : 'Active'
              : isHoliday
                ? 'Holiday'
                : 'No record';

            return (
              <article
                key={dateKey}
                className={cn(
                  'rounded-2xl border p-4 transition-all',
                  isHoliday
                    ? 'border-amber-200 bg-amber-50/70'
                    : latestEntry
                      ? 'border-slate-200 bg-slate-50/80'
                      : 'border-slate-200 bg-white'
                )}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-extrabold text-slate-900">{istDateLabel(day)}</p>
                    <p className="mt-0.5 text-xs font-medium text-slate-400">
                      {weekdayLabel}
                    </p>
                  </div>

                  <span
                    className={cn(
                      'inline-flex w-fit items-center rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.28em]',
                      isHoliday
                        ? 'bg-amber-100 text-amber-700'
                        : latestEntry
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-100 text-slate-500'
                    )}
                  >
                    {statusLabel}
                  </span>
                </div>

                {latestEntry ? (
                  <div className="mt-4 space-y-6">
                    {(expandedDates.includes(dateKey) ? entries : [latestEntry]).map((entry, index) => (
                      <div key={entry._id || index} className={index > 0 ? "pt-6 border-t border-slate-200/60" : ""}>
                        <div className="flex flex-wrap gap-2 text-[11px] font-bold">
                          <span className="rounded-full bg-white px-3 py-1 text-slate-600 ring-1 ring-slate-200">
                            Login: {istTimeLabel(entry.loginAt)}
                          </span>
                          <span className="rounded-full bg-white px-3 py-1 text-slate-600 ring-1 ring-slate-200">
                            Logout: {istTimeLabel(entry.logoutAt)}
                          </span>
                          <span className="rounded-full bg-white px-3 py-1 text-slate-600 ring-1 ring-slate-200">
                            Proof: {entry.proofType || 'text'}
                          </span>
                          {index === 0 && entries.length > 1 && (
                            <button
                              onClick={() => {
                                setExpandedDates(prev =>
                                  prev.includes(dateKey)
                                    ? prev.filter(d => d !== dateKey)
                                    : [...prev, dateKey]
                                );
                              }}
                              className="rounded-full bg-indigo-50 px-3 py-1 text-indigo-600 hover:bg-indigo-100 ring-1 ring-indigo-200 transition-colors cursor-pointer"
                            >
                              {expandedDates.includes(dateKey) ? 'Hide sessions' : `+${entries.length - 1} more session${entries.length - 1 > 1 ? 's' : ''}`}
                            </button>
                          )}
                        </div>

                        {entry.workSummary && (
                          <div className="mt-4 rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200">
                            <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.25em] text-slate-400">
                              <FileText className="w-3.5 h-3.5" />
                              Summary
                            </div>
                            <p className="text-sm leading-6 text-slate-700">{entry.workSummary}</p>
                          </div>
                        )}

                        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                          {entry.gitLink && (
                            <a
                              href={entry.gitLink}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-indigo-600 ring-1 ring-indigo-100 transition-all hover:bg-indigo-50"
                            >
                              <Link2 className="w-4 h-4" />
                              Git link saved
                            </a>
                          )}

                          {entry.screenshot && (
                            <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
                              <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-2 text-xs font-black uppercase tracking-[0.25em] text-slate-400">
                                <ImageIcon className="w-3.5 h-3.5 text-indigo-500" />
                                Screenshot
                              </div>
                              <img
                                src={entry.screenshot}
                                alt="Saved work screenshot"
                                className="h-28 w-44 object-cover"
                                loading="lazy"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : isHoliday ? (
                  <div className="mt-4 rounded-2xl border border-amber-100 bg-white/80 px-4 py-3 text-sm text-amber-700">
                    Weekly holiday automatically displayed.
                  </div>
                ) : (
                  <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-white/70 px-4 py-3 text-sm text-slate-500">
                    No login or logout recorded yet for this day.
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default EmployeeWorkHistory;
