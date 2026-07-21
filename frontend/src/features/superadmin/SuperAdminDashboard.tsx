import React, { useState, useEffect } from 'react';
import {
  Users, FolderKanban, MessageSquare, Calendar,
  Clock, CheckCircle2, XCircle, ShieldCheck, Activity,
  ArrowRightLeft, AlertCircle, Loader2, ZoomIn, X
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  fetchEmployeeOverview,
  fetchAllWorkLogsForSuperAdmin,
  fetchAllLeavesForSuperAdmin,
  fetchAllProjectsOverview,
} from '../../store/slices/superAdminSlice';

type Tab = 'activity' | 'projects' | 'logs' | 'leaves';

const API_BASE = 'http://localhost:5000';

const SuperAdminDashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const { employees, workLogs, leaves, projects, isLoading } = useAppSelector((state) => state.superAdmin);

  const [activeTab, setActiveTab] = useState<Tab>('activity');
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab === 'activity') dispatch(fetchEmployeeOverview());
    if (activeTab === 'projects') dispatch(fetchAllProjectsOverview());
    if (activeTab === 'logs') dispatch(fetchAllWorkLogsForSuperAdmin());
    if (activeTab === 'leaves') dispatch(fetchAllLeavesForSuperAdmin());
  }, [dispatch, activeTab]);

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return 'Never';
    return new Date(dateStr).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
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

      {/* Tabs */}
      <div className="glass p-2 rounded-2xl flex items-center gap-2 overflow-x-auto shrink-0 scrollbar-none">
        {[
          { id: 'activity', label: 'Employee Activity', icon: <Activity className="w-4 h-4" /> },
          { id: 'projects', label: 'Project Allocations', icon: <FolderKanban className="w-4 h-4" /> },
          { id: 'logs', label: 'Work Log Reviews', icon: <MessageSquare className="w-4 h-4" /> },
          { id: 'leaves', label: 'Leave Requests', icon: <Calendar className="w-4 h-4" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as Tab)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 border border-transparent",
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
            <div className="glass rounded-3xl overflow-hidden border border-slate-100 shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/70 border-b border-slate-100">
                      <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Employee</th>
                      <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                      <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Session Details</th>
                      <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Work Progress</th>
                      <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Assigned Projects</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {employees.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-12 text-center text-slate-400 italic">No employees found.</td>
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
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: Project Allocations */}
          {activeTab === 'projects' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {projects.length === 0 ? (
                <div className="col-span-full glass p-12 text-center text-slate-400 italic">No projects found.</div>
              ) : (
                projects.map((project) => (
                  <div key={project._id} className="glass p-6 rounded-3xl border border-slate-100 flex flex-col gap-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-slate-800 text-base">{project.name}</h3>
                        <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{project.description || 'No description'}</p>
                      </div>
                      <span className={cn(
                        "text-[10px] font-bold px-2 py-0.5 border rounded-lg",
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
                              <div className="flex items-center gap-2">
                                <span className={cn("w-2 h-2 rounded-full", emp.isOnline ? "bg-emerald-500" : "bg-slate-300")} />
                                <div>
                                  <p className="font-bold text-slate-700">{emp.name}</p>
                                  <p className="text-[10px] text-slate-400">{emp.designation || 'Staff'}</p>
                                </div>
                              </div>
                              <span className="text-[10px] text-slate-400 font-medium">{emp.department}</span>
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
                <div className="glass p-12 text-center text-slate-400 italic">No work logs submitted yet.</div>
              ) : (
                workLogs.map((log) => (
                  <div key={log._id} className="glass p-6 rounded-3xl border border-slate-100 space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-sm">
                          {log.employeeName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800">{log.employeeName}</h4>
                          <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                            <span>Project: <strong className="text-slate-600">{(log.project as any)?.name || 'Unknown'}</strong></span>
                            <span>•</span>
                            <span>Task: <strong className="text-slate-600">{(log.task as any)?.title || 'Unknown'}</strong></span>
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400 font-bold">
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

          {/* TAB 4: Leave Requests */}
          {activeTab === 'leaves' && (
            <div className="space-y-4">
              {leaves.length === 0 ? (
                <div className="glass p-12 text-center text-slate-400 italic">No leave requests found.</div>
              ) : (
                leaves.map((leave) => (
                  <div key={leave._id} className="glass p-5 rounded-3xl border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border",
                          leave.status === 'Approved' ? 'text-emerald-700 bg-emerald-50 border-emerald-200' :
                          leave.status === 'Rejected' ? 'text-rose-700 bg-rose-50 border-rose-200' :
                          'text-amber-700 bg-amber-50 border-amber-200'
                        )}>
                          {leave.status}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{leave.type} Leave</span>
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        <h4 className="font-bold text-slate-800 text-sm">{leave.employeeName}</h4>
                        <span className="text-xs text-slate-400 font-medium">({leave.startDate} to {leave.endDate})</span>
                      </div>
                      <p className="text-xs text-slate-500 font-medium mt-1">&ldquo;{leave.reason}&rdquo;</p>
                    </div>

                    {leave.approvedOrRejectedBy && (
                      <div className="text-right shrink-0 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                        <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Reviewed By</span>
                        <span className="text-xs font-bold text-slate-700">{leave.approvedOrRejectedBy}</span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
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
    </div>
  );
};

export default SuperAdminDashboard;
