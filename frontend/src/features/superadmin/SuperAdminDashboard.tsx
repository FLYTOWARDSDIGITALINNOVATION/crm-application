import React, { useState, useEffect } from 'react';
import {
  Users, FolderKanban, MessageSquare, Calendar,
  Clock, CheckCircle2, XCircle, ShieldCheck, Activity,
  ArrowRightLeft, AlertCircle, Loader2, ZoomIn, X, LogOut
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  fetchEmployeeOverview,
  fetchAllWorkLogsForSuperAdmin,
  fetchAllLeavesForSuperAdmin,
  fetchAllProjectsOverview,
} from '../../store/slices/superAdminSlice';
import api from '../../utils/api';
import LogoutReports from './LogoutReports';

type Tab = 'activity' | 'projects' | 'logs' | 'leaves' | 'logouts';

const API_BASE = 'http://localhost:5000';

const SuperAdminDashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const { employees, workLogs, leaves, projects, isLoading } = useAppSelector((state) => state.superAdmin);

  const [activeTab, setActiveTab] = useState<Tab>('activity');
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [employeeToLogout, setEmployeeToLogout] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    dispatch(fetchEmployeeOverview());
    dispatch(fetchAllProjectsOverview());
    dispatch(fetchAllWorkLogsForSuperAdmin());
    dispatch(fetchAllLeavesForSuperAdmin());
  }, [dispatch]);

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return 'Never';
    return new Date(dateStr).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const handleForceLogout = async (employeeId: string) => {
    try {
      await api.post(`/super-admin/force-logout/${employeeId}`);

      // Broadcast signal across tabs for instant logout
      try {
        const bc = new BroadcastChannel('crm_session_channel');
        bc.postMessage({ type: 'FORCE_LOGOUT', userId: employeeId });
        bc.close();
      } catch (e) {}

      localStorage.setItem('force_logout_signal', JSON.stringify({ userId: employeeId, time: Date.now() }));

      dispatch(fetchEmployeeOverview());
    } catch (err) {
      console.error('Failed to force logout:', err);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 mb-1">
            <ShieldCheck className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">Super Admin Console</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">System Monitoring & Logs</h1>
          <p className="text-slate-500 text-sm mt-0.5">Real-time tracking of employee sessions, leave request status, and project updates.</p>
        </div>
      </div>

      {/* Tabs - Mobile 2x2 Grid View */}
      <div className="grid grid-cols-2 gap-2 sm:hidden p-1.5 glass rounded-2xl">
        {[
          { id: 'activity', label: 'Employee Activity', icon: <Activity className="w-4 h-4" /> },
          { id: 'projects', label: 'Project Allocations', icon: <FolderKanban className="w-4 h-4" /> },
          { id: 'logs', label: 'Work Log Reviews', icon: <MessageSquare className="w-4 h-4" /> },
          { id: 'logouts', label: 'Logout Reports', icon: <ArrowRightLeft className="w-4 h-4" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as Tab)}
            className={cn(
              "flex items-center justify-center gap-1.5 px-2.5 py-2.5 rounded-xl text-[11px] font-bold transition-all text-center border border-transparent",
              activeTab === tab.id
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-100"
                : "bg-slate-50/70 text-slate-600 hover:bg-slate-100 border-slate-100"
            )}
          >
            {tab.icon}
            <span className="truncate">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tabs - Desktop Horizontal View */}
      <div className="hidden sm:flex glass p-2 rounded-2xl items-center gap-2 overflow-x-auto shrink-0 scrollbar-none">
        {[
          { id: 'activity', label: 'Employee Activity', icon: <Activity className="w-4 h-4" /> },
          { id: 'projects', label: 'Project Allocations', icon: <FolderKanban className="w-4 h-4" /> },
          { id: 'logs', label: 'Work Log Reviews', icon: <MessageSquare className="w-4 h-4" /> },
          { id: 'logouts', label: 'Logout Reports', icon: <ArrowRightLeft className="w-4 h-4" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as Tab)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 border border-transparent whitespace-nowrap",
              activeTab === tab.id
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-100"
                : "bg-slate-50/50 text-slate-500 hover:bg-slate-100/50 border-slate-100/50"
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          <span className="ml-3 text-slate-500 font-medium">Fetching details...</span>
        </div>
      )}

      {/* Tab Panels */}
      {!isLoading && (
        <div className="space-y-6">
          {/* TAB 1: Employee Activity */}
          {activeTab === 'activity' && (
            <div className="glass rounded-3xl overflow-hidden border border-slate-100 shadow-xl p-3 sm:p-0">
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50">
                      <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Employee</th>
                      <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                      <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Session Details</th>
                      <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Work Progress</th>
                      <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Assigned Projects</th>
                      <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {employees.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-12 text-center text-slate-400 italic">No employees found.</td>
                      </tr>
                    ) : (
                      employees.map((emp) => (
                        <tr key={emp._id} className="hover:bg-slate-50/20 transition-colors">
                          {/* Name & Role */}
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 text-sm font-bold flex items-center justify-center">
                                {emp.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <h4 className="font-bold text-slate-800">{emp.name}</h4>
                                <p className="text-xs text-slate-400 font-medium">{emp.designation || 'Staff'} • {emp.department || 'General'}</p>
                              </div>
                            </div>
                          </td>
                          {/* Online Status */}
                          <td className="p-4">
                            <span className={cn(
                              "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border",
                              emp.isOnline
                                ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                                : "text-slate-400 bg-slate-50 border-slate-200"
                            )}>
                              <span className={cn("w-1.5 h-1.5 rounded-full", emp.isOnline ? "bg-emerald-500" : "bg-slate-300")} />
                              {emp.isOnline ? 'Online' : 'Offline'}
                            </span>
                          </td>
                          {/* Session details */}
                          <td className="p-4 space-y-1">
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              <span className="font-medium text-slate-700">In:</span>
                              <span className="font-bold text-slate-600">{formatDateTime(emp.lastLoginAt)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <ArrowRightLeft className="w-3.5 h-3.5 text-slate-400" />
                              <span className="font-medium text-slate-700">Out:</span>
                              <span className="font-bold text-slate-600">{formatDateTime(emp.lastLogoutAt)}</span>
                            </div>
                          </td>
                          {/* Work Progress */}
                          <td className="p-4">
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                                <span>{emp.completedTaskCount}/{emp.taskCount} Tasks</span>
                                <span>{emp.workLogCount} Logs</span>
                              </div>
                              <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-indigo-600"
                                  style={{ width: `${emp.taskCount > 0 ? (emp.completedTaskCount / emp.taskCount) * 100 : 0}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          {/* Projects List */}
                          <td className="p-4">
                            {emp.projects.length === 0 ? (
                              <span className="text-xs text-slate-400 font-medium">None</span>
                            ) : (
                              <div className="flex flex-wrap gap-1.5">
                                {emp.projects.map((proj) => (
                                  <span key={proj._id} className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-lg">
                                    {proj.name}
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>
                          {/* Actions */}
                          <td className="p-4 text-right">
                            {emp.isOnline ? (
                              <button
                                onClick={() => setEmployeeToLogout({ id: emp._id, name: emp.name })}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-600 rounded-xl font-bold hover:bg-rose-100 transition-all text-xs"
                              >
                                <LogOut className="w-3.5 h-3.5" />
                                Logout
                              </button>
                            ) : (
                              <span className="inline-block px-2.5 py-1 bg-slate-100 text-slate-400 rounded-lg text-xs font-semibold">
                                Logged Out
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards View */}
              <div className="grid grid-cols-1 gap-3.5 md:hidden">
                {employees.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 italic">No employees found.</div>
                ) : (
                  employees.map((emp) => (
                    <div key={emp._id} className="p-4 bg-white/90 rounded-2xl border border-slate-100 shadow-sm space-y-3">
                      {/* Top Row: Info & Status */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 text-sm font-bold flex items-center justify-center shrink-0">
                            {emp.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-slate-800 text-sm truncate">{emp.name}</h4>
                            <p className="text-xs text-slate-400 font-medium truncate">{emp.designation || 'Staff'} • {emp.department || 'General'}</p>
                          </div>
                        </div>
                        <span className={cn(
                          "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border shrink-0",
                          emp.isOnline
                            ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                            : "text-slate-400 bg-slate-50 border-slate-200"
                        )}>
                          <span className={cn("w-1.5 h-1.5 rounded-full", emp.isOnline ? "bg-emerald-500" : "bg-slate-300")} />
                          {emp.isOnline ? 'Online' : 'Offline'}
                        </span>
                      </div>

                      {/* Middle Grid: Session & Work Progress */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs bg-slate-50/80 p-3 rounded-xl">
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Session Details</span>
                          <div className="flex items-center gap-1.5 text-slate-600 text-[11px]">
                            <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="font-medium">In:</span>
                            <span className="font-bold text-slate-700">{formatDateTime(emp.lastLoginAt)}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-600 text-[11px]">
                            <ArrowRightLeft className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="font-medium">Out:</span>
                            <span className="font-bold text-slate-700">{formatDateTime(emp.lastLogoutAt)}</span>
                          </div>
                        </div>

                        <div className="space-y-1 pt-2 sm:pt-0 border-t sm:border-t-0 sm:border-l border-slate-200 sm:pl-3">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Work Progress</span>
                          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
                            <span>{emp.completedTaskCount}/{emp.taskCount} Tasks</span>
                            <span>{emp.workLogCount} Logs</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-indigo-600"
                              style={{ width: `${emp.taskCount > 0 ? (emp.completedTaskCount / emp.taskCount) * 100 : 0}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Bottom Row: Projects & Actions */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100">
                        <div className="flex-1 min-w-[120px]">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Assigned Projects</span>
                          {emp.projects.length === 0 ? (
                            <span className="text-xs text-slate-400 font-medium">None</span>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {emp.projects.map((proj) => (
                                <span key={proj._id} className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-lg">
                                  {proj.name}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="shrink-0">
                          {emp.isOnline ? (
                            <button
                              onClick={() => setEmployeeToLogout({ id: emp._id, name: emp.name })}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-600 rounded-xl font-bold hover:bg-rose-100 transition-all text-xs"
                            >
                              <LogOut className="w-3.5 h-3.5" />
                              Logout
                            </button>
                          ) : (
                            <span className="inline-block px-2.5 py-1 bg-slate-100 text-slate-400 rounded-lg text-xs font-semibold">
                              Logged Out
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 2: Project Allocations */}
          {activeTab === 'projects' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {projects.length === 0 ? (
                <div className="col-span-full glass p-8 sm:p-12 text-center text-slate-400 italic">No projects found.</div>
              ) : (
                projects.map((project) => (
                  <div key={project._id} className="glass p-4 sm:p-6 rounded-3xl border border-slate-100 flex flex-col gap-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-bold text-slate-800 text-base">{project.name}</h3>
                        <p className="text-xs text-slate-400 line-clamp-2 sm:line-clamp-1 mt-0.5">{project.description || 'No description'}</p>
                      </div>
                      <span className={cn(
                        "text-[10px] font-bold px-2 py-0.5 border rounded-lg shrink-0",
                        project.status === 'Active' ? 'text-emerald-700 bg-emerald-50 border-emerald-200' :
                        project.status === 'Completed' ? 'text-indigo-700 bg-indigo-50 border-indigo-200' :
                        'text-amber-700 bg-amber-50 border-amber-200'
                      )}>
                        {project.status}
                      </span>
                    </div>

                    <div className="border-t border-slate-100 pt-4">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Assigned Team ({project.assignedEmployees.length})</h4>
                      {project.assignedEmployees.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">No team members assigned.</p>
                      ) : (
                        <div className="space-y-2">
                          {project.assignedEmployees.map((emp) => (
                            <div key={emp._id} className="flex items-center justify-between text-xs bg-slate-50 px-3 py-2 rounded-xl">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className={cn("w-2 h-2 rounded-full shrink-0", emp.isOnline ? "bg-emerald-500" : "bg-slate-300")} />
                                <div className="min-w-0">
                                  <p className="font-bold text-slate-700 truncate">{emp.name}</p>
                                  <p className="text-[10px] text-slate-400 truncate">{emp.designation || 'Staff'}</p>
                                </div>
                              </div>
                              <span className="text-[10px] text-slate-400 font-medium shrink-0 ml-2">{emp.department}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 3: Work Log Reviews */}
          {activeTab === 'logs' && (
            <div className="space-y-4">
              {workLogs.length === 0 ? (
                <div className="glass p-8 sm:p-12 text-center text-slate-400 italic">No work logs submitted yet.</div>
              ) : (
                workLogs.map((log) => (
                  <div key={log._id} className="glass p-4 sm:p-6 rounded-3xl border border-slate-100 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-sm shrink-0">
                          {log.employeeName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800">{log.employeeName}</h4>
                          <div className="flex flex-wrap items-center gap-x-2 text-xs text-slate-400 font-medium">
                            <span>Project: <strong className="text-slate-600">{(log.project as any)?.name || 'Unknown'}</strong></span>
                            <span className="hidden sm:inline">•</span>
                            <span>Task: <strong className="text-slate-600">{(log.task as any)?.title || 'Unknown'}</strong></span>
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400 font-bold self-start sm:self-auto">
                        {new Date(log.createdAt).toLocaleString('en-IN', {
                          day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                    </div>

                    <p className="text-sm text-slate-600 bg-slate-50/50 p-3 rounded-2xl border border-slate-100/50 leading-relaxed font-medium">
                      {log.description}
                    </p>

                    {log.images && log.images.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {log.images.map((img, i) => {
                          const src = `${API_BASE}${img}`;
                          return (
                            <button
                              key={i}
                              onClick={() => setLightboxSrc(src)}
                              className="relative group w-16 h-16 rounded-xl overflow-hidden border border-slate-200 hover:border-indigo-400 transition-all aspect-square"
                            >
                              <img src={src} alt="thumbnail" className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <ZoomIn className="w-4 h-4 text-white" />
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 5: Logout Reports & Session Calendar */}
          {activeTab === 'logouts' && <LogoutReports />}
        </div>
      )}

      {/* Lightbox */}
      {lightboxSrc && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setLightboxSrc(null)}
        >
          <button
            className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-all animate-fade-in"
            onClick={() => setLightboxSrc(null)}
          >
            <X className="w-5 h-5" />
          </button>
          <img
            src={lightboxSrc}
            alt="full preview"
            className="max-w-full max-h-[90vh] rounded-2xl shadow-2xl object-contain animate-fade-in"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}

      {/* Centered Force Logout Confirmation Modal */}
      {employeeToLogout && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200 text-center">
            <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Force Logout Employee</h3>
            <p className="text-sm text-slate-500 mb-6">
              Are you sure you want to force logout <span className="font-bold text-slate-800">{employeeToLogout.name}</span>? They will receive a warning message and be immediately logged out.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setEmployeeToLogout(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  const empId = employeeToLogout.id;
                  setEmployeeToLogout(null);
                  await handleForceLogout(empId);
                }}
                className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 text-white font-bold text-xs shadow-lg shadow-rose-200 hover:bg-rose-700 transition-all"
              >
                Confirm Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminDashboard;
