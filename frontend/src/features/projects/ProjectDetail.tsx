import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Plus, Trash2, X, Calendar, User,
  CheckCircle2, Circle, AlertCircle, Loader2, Lock,
  FolderKanban, Users, ChevronDown, ChevronUp,
  MessageSquare, ImagePlus, Upload, ZoomIn, FileText
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchTasks, createTask, updateTask, deleteTask, clearProjectTasks } from '../../store/slices/taskSlice';
import { fetchProjects } from '../../store/slices/projectSlice';
import { fetchEmployees } from '../../store/slices/userSlice';
import {
  fetchWorkLogsForTask,
  createWorkLog,
  deleteWorkLog,
  type WorkLog,
} from '../../store/slices/workLogSlice';
import type { Task } from '../../store/slices/taskSlice';

const PRIORITIES = ['High', 'Medium', 'Low'] as const;

const priorityStyle = (priority: string) => {
  switch (priority) {
    case 'High': return 'text-rose-600 bg-rose-50 border-rose-100';
    case 'Medium': return 'text-amber-600 bg-amber-50 border-amber-100';
    default: return 'text-slate-500 bg-slate-50 border-slate-100';
  }
};

const statusColor = (status: string) => {
  switch (status) {
    case 'Completed': return 'text-emerald-600';
    case 'In Progress': return 'text-blue-600';
    default: return 'text-slate-600';
  }
};

const defaultForm = {
  title: '',
  dueDate: '',
  priority: 'Medium' as typeof PRIORITIES[number],
  assignedTo: '',
};

const API_BASE = 'http://localhost:5000';

const normalizeAssignedTo = (assignedTo: string | string[]) => {
  if (!assignedTo) return [];
  if (Array.isArray(assignedTo)) return assignedTo.map(s => s.trim().toLowerCase()).filter(Boolean);
  return assignedTo.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
};

// ─── Work Log Panel per task ──────────────────────────────────────────────────
const WorkLogPanel: React.FC<{
  task: Task;
  projectId: string;
  isAdmin: boolean;
  currentUserName: string;
}> = ({ task, projectId, isAdmin, currentUserName }) => {
  const dispatch = useAppDispatch();
  const { logsByTaskId, isUploading } = useAppSelector((s) => s.workLogs);
  const logs: WorkLog[] = logsByTaskId[task.id] || [];

  const [expanded, setExpanded] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [description, setDescription] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [descError, setDescError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load logs when expanded for the first time
  useEffect(() => {
    if (expanded && !logsByTaskId[task.id]) {
      dispatch(fetchWorkLogsForTask(task.id));
    }
  }, [expanded]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(prev => [...prev, ...files]);
    const newPreviews = files.map(f => URL.createObjectURL(f));
    setPreviews(prev => [...prev, ...newPreviews]);
  };

  const removeFile = (idx: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== idx));
    setPreviews(prev => {
      URL.revokeObjectURL(prev[idx]);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const handleSubmitLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) { setDescError('Description is required'); return; }

    const fd = new FormData();
    fd.append('taskId', task.id);
    fd.append('projectId', projectId);
    fd.append('description', description.trim());
    selectedFiles.forEach(f => fd.append('images', f));

    await dispatch(createWorkLog(fd));
    setDescription('');
    setSelectedFiles([]);
    setPreviews([]);
    setDescError('');
    setShowLogModal(false);
    // Refresh logs so the new one appears
    dispatch(fetchWorkLogsForTask(task.id));
    setExpanded(true);
  };

  const handleDeleteLog = async (logId: string) => {
    await dispatch(deleteWorkLog({ logId, taskId: task.id }));
  };

  const isAssignedToUser = (assignedTo: string | string[], name?: string, email?: string) => {
    if (!assignedTo || (!name && !email)) return false;
    const parts = normalizeAssignedTo(assignedTo);
    return (name && parts.includes(name.toLowerCase())) || (email && parts.includes(email.toLowerCase()));
  };

  const isMyTask = isAssignedToUser(task.assignedTo, currentUserName);

  return (
    <div className="mt-3 border-t border-slate-100 pt-3">
      {/* Toggle logs bar */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
      >
        {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        <MessageSquare className="w-3.5 h-3.5" />
        {logs.length > 0 ? `${logs.length} Work Log${logs.length > 1 ? 's' : ''}` : 'Work Logs'}
        {!expanded && logs.length === 0 && <span className="text-slate-400 font-normal">(no updates yet)</span>}
      </button>

      {expanded && (
        <div className="mt-3 space-y-3">
          {/* Add log button — for the assigned employee */}
          {(isMyTask || isAdmin) && task.status !== 'Completed' && (
            <button
              onClick={() => setShowLogModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-xl hover:bg-indigo-100 transition-all border border-indigo-100"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Daily Log
            </button>
          )}

          {/* Log entries */}
          {logs.length === 0 ? (
            <p className="text-xs text-slate-400 italic pl-1">No work logs submitted yet.</p>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div key={log._id} className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center">
                        {log.employeeName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">{log.employeeName}</p>
                        <p className="text-[10px] text-slate-400">
                          {new Date(log.createdAt).toLocaleString('en-IN', {
                            day: '2-digit', month: 'short', year: 'numeric',
                            hour: '2-digit', minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                    {isAdmin && (
                      <button
                        onClick={() => handleDeleteLog(log._id)}
                        className="p-1 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed mb-3">
                    {log.description}
                  </p>

                  {/* Image grid */}
                  {log.images.length > 0 && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                      {log.images.map((imgPath, i) => {
                        const src = `${API_BASE}${imgPath}`;
                        return (
                          <button
                            key={i}
                            onClick={() => setLightboxSrc(src)}
                            className="relative group aspect-square rounded-xl overflow-hidden border border-slate-200 hover:border-indigo-400 transition-all"
                          >
                            <img src={src} alt={`log-img-${i}`} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <ZoomIn className="w-5 h-5 text-white" />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Add Daily Log Modal ── */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowLogModal(false)} />
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl p-6 sm:p-8 animate-fade-in max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-5 shrink-0">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Add Daily Work Log</h2>
                <p className="text-slate-400 text-sm mt-0.5 line-clamp-1">{task.title}</p>
              </div>
              <button onClick={() => setShowLogModal(false)} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable form body */}
            <form onSubmit={handleSubmitLog} className="flex flex-col flex-1 overflow-hidden gap-4">
              {/* Description */}
              <div className="shrink-0">
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Today's Work Description <span className="text-rose-500">*</span>
                </label>
                <textarea
                  autoFocus
                  rows={4}
                  placeholder="Describe what you worked on today..."
                  value={description}
                  onChange={e => { setDescription(e.target.value); setDescError(''); }}
                  className={cn('input-field resize-none', descError ? 'border-rose-400 bg-rose-50' : '')}
                />
                {descError && <p className="text-rose-500 text-xs mt-1">{descError}</p>}
              </div>

              {/* Image upload area */}
              <div className="shrink-0">
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Upload Images <span className="text-slate-400 font-normal">(any number, optional)</span>
                </label>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex flex-col items-center justify-center gap-2 py-5 border-2 border-dashed border-slate-300 rounded-2xl hover:border-indigo-400 hover:bg-indigo-50 transition-all text-slate-500 hover:text-indigo-600"
                >
                  <ImagePlus className="w-7 h-7" />
                  <span className="text-sm font-semibold">Click to select images</span>
                  <span className="text-xs text-slate-400">JPG, PNG, WEBP, GIF — 10MB each</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>

              {/* Image previews — scrollable */}
              {previews.length > 0 && (
                <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pb-1">
                    {previews.map((src, i) => (
                      <div key={i} className="relative group aspect-square rounded-xl overflow-hidden border border-slate-200">
                        <img src={src} alt="" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeFile(i)}
                          className="absolute top-1 right-1 w-5 h-5 bg-rose-600 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    {/* Add more button */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-square rounded-xl border-2 border-dashed border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 flex items-center justify-center transition-all text-slate-400 hover:text-indigo-500"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{previews.length} image{previews.length > 1 ? 's' : ''} selected</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100 shrink-0 mt-auto">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="px-4 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all disabled:opacity-60"
                >
                  {isUploading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</>
                  ) : (
                    <><Upload className="w-4 h-4" /> Submit Log</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxSrc && (
        <div
          className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setLightboxSrc(null)}
        >
          <button
            className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-all"
            onClick={() => setLightboxSrc(null)}
          >
            <X className="w-5 h-5" />
          </button>
          <img
            src={lightboxSrc}
            alt="full preview"
            className="max-w-full max-h-[90vh] rounded-2xl shadow-2xl object-contain"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const ProjectDetail: React.FC = () => {
  const { id: projectId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { user } = useAppSelector((s) => s.auth);
  const { items: tasks, isLoading } = useAppSelector((s) => s.tasks);
  const { items: projects } = useAppSelector((s) => s.projects);
  const { employees } = useAppSelector((s) => s.users);

  const isAdmin = user?.role === 'admin';
  const project = projects.find(p => p._id === projectId);

  const assigneesList = employees.length > 0 ? employees : (project?.assignedEmployees || []);

  const projectTasks = tasks.filter(t => t.projectId === projectId);
  const isAssignedToUserGlobal = (assignedTo: string | string[], u?: any) => {
    if (!assignedTo || !u) return false;
    const parts = normalizeAssignedTo(assignedTo);
    return (u.name && parts.includes(u.name.toLowerCase())) || (u.email && parts.includes(u.email.toLowerCase()));
  };

  const visibleTasks = isAdmin
    ? projectTasks
    : projectTasks.filter(t => isAssignedToUserGlobal(t.assignedTo, user));

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [errors, setErrors] = useState<Partial<typeof defaultForm>>({});
  const [deleteConfirm, setDeleteConfirm] = useState<Task | null>(null);

  useEffect(() => {
    if (projects.length === 0) dispatch(fetchProjects());
    dispatch(fetchTasks(projectId));
    if (isAdmin) dispatch(fetchEmployees());
    return () => { dispatch(clearProjectTasks()); };
  }, [dispatch, projectId, projects.length, isAdmin]);

  const validate = () => {
    const e: Partial<typeof defaultForm> = {};
    if (!form.title.trim()) e.title = 'Title is required';
    if (!form.dueDate) e.dueDate = 'Due date is required';
    if (!form.assignedTo) e.assignedTo = 'Assignee is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await dispatch(createTask({
      title: form.title.trim(),
      dueDate: form.dueDate,
      priority: form.priority,
      status: 'Pending',
      assignedTo: form.assignedTo,
      relatedTo: project?.name || '',
      projectId,
    }));
    setForm(defaultForm);
    setErrors({});
    setShowCreate(false);
  };

  const handleStatusChange = async (task: Task, newStatus: string) => {
    if (!isAdmin && newStatus === 'Completed') return;
    await dispatch(updateTask({ id: task.id, status: newStatus }));
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    await dispatch(deleteTask(deleteConfirm.id));
    setDeleteConfirm(null);
  };

  const completedCount = visibleTasks.filter(t => t.status === 'Completed').length;
  const pendingCount = visibleTasks.filter(t => t.status === 'Pending').length;
  const inProgressCount = visibleTasks.filter(t => t.status === 'In Progress').length;

  if (showCreate) {
    return (
      <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
        <button
          type="button"
          onClick={() => setShowCreate(false)}
          className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 text-sm font-semibold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Project Details
        </button>

        <div className="flex flex-col gap-1">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Add Task</h1>
          <p className="text-slate-500 text-sm">Add a new task to project: <span className="font-bold text-indigo-600">{project?.name}</span></p>
        </div>

        <div className="glass p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/50">
          <form onSubmit={handleCreate} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-705 mb-1.5">Task Title <span className="text-rose-500">*</span></label>
              <input
                autoFocus
                type="text"
                placeholder="e.g. Design landing page"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                className={cn('input-field', errors.title ? 'border-rose-400 bg-rose-50' : '')}
              />
              {errors.title && <p className="text-rose-500 text-xs mt-1">{errors.title}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-705 mb-1.5">Due Date <span className="text-rose-500">*</span></label>
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={e => setForm({ ...form, dueDate: e.target.value })}
                  className={cn('input-field', errors.dueDate ? 'border-rose-400 bg-rose-50' : '')}
                />
                {errors.dueDate && <p className="text-rose-500 text-xs mt-1">{errors.dueDate}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-705 mb-1.5">Priority</label>
                <select
                  value={form.priority}
                  onChange={e => setForm({ ...form, priority: e.target.value as typeof PRIORITIES[number] })}
                  className="input-field"
                >
                  {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-705 mb-1.5">Assign To <span className="text-rose-500">*</span></label>
              {assigneesList.length > 0 ? (
                <select
                  value={form.assignedTo}
                  onChange={e => setForm({ ...form, assignedTo: e.target.value })}
                  className={cn('input-field', errors.assignedTo ? 'border-rose-400 bg-rose-50' : '')}
                >
                  <option value="">Select a member...</option>
                  {assigneesList.map(emp => (
                    <option key={emp._id} value={emp.name}>{emp.name}</option>
                  ))}
                </select>
              ) : (
                <div className="input-field bg-amber-50 border-amber-200 text-amber-700 text-sm">
                  ⚠ No employees found.
                </div>
              )}
              {errors.assignedTo && <p className="text-rose-500 text-xs mt-1">{errors.assignedTo}</p>}
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="px-5 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={assigneesList.length === 0}
                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                Add Task
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Back + Header */}
      <div className="flex flex-col gap-4">
        <button
          onClick={() => navigate('/projects')}
          className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 text-sm font-semibold transition-colors w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Projects
        </button>

        {project ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-700">
                  <FolderKanban className="w-5 h-5" />
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{project.name}</h1>
              </div>
              {project.description && (
                <p className="text-slate-500 text-sm mt-1">{project.description}</p>
              )}
              <div className="flex items-center gap-3 mt-2">
                <span className={cn(
                  'flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border',
                  project.status === 'Active' ? 'text-emerald-700 bg-emerald-50 border-emerald-200' :
                  project.status === 'Completed' ? 'text-indigo-700 bg-indigo-50 border-indigo-200' :
                  'text-amber-700 bg-amber-50 border-amber-200'
                )}>
                  {project.status}
                </span>
                <span className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                  <Users className="w-3.5 h-3.5" />
                  {project.assignedEmployees.length} member{project.assignedEmployees.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
            {isAdmin && (
              <button
                onClick={() => { setShowCreate(true); setForm(defaultForm); setErrors({}); }}
                className="flex items-center gap-2 px-5 py-3 bg-indigo-600 rounded-2xl text-sm font-bold text-white hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all self-start sm:self-auto"
              >
                <Plus className="w-5 h-5" />
                Add Task
              </button>
            )}
          </div>
        ) : (
          <div className="h-12 bg-slate-100 animate-pulse rounded-2xl" />
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Pending', count: pendingCount, icon: <Circle className="w-5 h-5" />, color: 'text-slate-600 bg-slate-50' },
          { label: 'In Progress', count: inProgressCount, icon: <AlertCircle className="w-5 h-5" />, color: 'text-blue-600 bg-blue-50' },
          { label: 'Completed', count: completedCount, icon: <CheckCircle2 className="w-5 h-5" />, color: 'text-emerald-600 bg-emerald-50' },
        ].map(({ label, count, icon, color }) => (
          <div key={label} className="glass p-4 rounded-2xl flex items-center gap-3">
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', color)}>{icon}</div>
            <div>
              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">{label}</span>
              <h3 className="text-xl font-bold text-slate-900">{count}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Tasks Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Tasks */}
        <div className="lg:col-span-2 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
              <span className="ml-3 text-slate-500 font-medium">Loading tasks...</span>
            </div>
          ) : visibleTasks.length === 0 ? (
            <div className="glass p-16 rounded-3xl text-center border border-slate-100">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">No tasks yet</h3>
              <p className="text-slate-500 text-sm mt-1">
                {isAdmin ? 'Add tasks to get this project going.' : 'No tasks assigned to you in this project.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {visibleTasks.map((task) => (
                <div
                  key={task.id}
                  className={cn(
                    'glass p-4 sm:p-5 rounded-2xl transition-all border-l-4',
                    task.status === 'Completed' ? 'border-emerald-400 opacity-90' :
                    task.status === 'In Progress' ? 'border-blue-400' : 'border-transparent hover:border-indigo-400'
                  )}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="mt-0.5 shrink-0">
                        {task.status === 'Completed' ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        ) : task.status === 'In Progress' ? (
                          <AlertCircle className="w-5 h-5 text-blue-500" />
                        ) : (
                          <Circle className="w-5 h-5 text-slate-300" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className={cn(
                          'text-sm font-bold transition-all truncate',
                          task.status === 'Completed' ? 'text-slate-400 line-through' : 'text-slate-900'
                        )}>
                          {task.title}
                        </h3>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-slate-400 font-medium">
                          <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{task.dueDate}</span>
                          <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" />{task.assignedTo}</span>
                          {task.status === 'Completed' && task.completedBy && (
                            <span className="flex items-center gap-1 text-emerald-600">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Completed by {task.completedBy}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-8 sm:ml-0">
                      <span className={cn(
                        'px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider border',
                        priorityStyle(task.priority)
                      )}>
                        {task.priority}
                      </span>

                      {/* Status */}
                      <div className="relative">
                        <select
                          value={task.status}
                          onChange={e => handleStatusChange(task, e.target.value)}
                          className={cn(
                            'text-xs font-bold bg-white border rounded-xl px-3 py-1.5 cursor-pointer focus:ring-2 focus:ring-indigo-500 outline-none transition-colors appearance-none pr-6',
                            statusColor(task.status),
                            task.status === 'Completed' ? 'border-emerald-200' :
                            task.status === 'In Progress' ? 'border-blue-200' : 'border-slate-200'
                          )}
                        >
                          <option value="Pending">Pending</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Completed">Completed</option>
                        </select>
                      </div>

                      {isAdmin && (
                        <button
                          onClick={() => setDeleteConfirm(task)}
                          className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Work Log Panel (expandable under each task) */}
                  {projectId && (
                    <WorkLogPanel
                      task={task}
                      projectId={projectId}
                      isAdmin={isAdmin}
                      currentUserName={user?.name || ''}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Project Sidebar */}
        <div className="space-y-6">
          {/* Project URL */}
          {project?.projectUrl && (
            <div className="glass p-6 rounded-3xl space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest opacity-40">Project URL</h3>
              <a 
                href={project.projectUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-4 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 rounded-2xl border border-indigo-100 dark:border-indigo-800/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-white dark:bg-indigo-900/50 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </div>
                <span className="text-sm font-bold truncate">{project.projectUrl}</span>
              </a>
            </div>
          )}
          {/* Project Requirements */}
          <div className="glass p-6 rounded-3xl space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest opacity-40">Project Requirements</h3>
            <div className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-100 dark:border-slate-800">
              {project?.requirements ? (
                <p className="text-sm text-slate-700 dark:text-slate-350 leading-relaxed whitespace-pre-wrap">
                  {project.requirements}
                </p>
              ) : (
                <p className="text-sm text-slate-400 dark:text-slate-500 italic">
                  No custom requirements defined for this project.
                </p>
              )}
            </div>
          </div>

          {/* Project Files */}
          <div className="glass p-6 rounded-3xl space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest opacity-40">Project Files</h3>
            <div className="space-y-2">
              {project?.files && project.files.length > 0 ? (
                project.files.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/30 rounded-xl border border-slate-100 dark:border-slate-800/50">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
                      <div className="min-w-0">
                        <a 
                          href={file.url}
                          download={file.name}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm font-bold text-slate-850 dark:text-slate-200 hover:text-indigo-650 hover:underline truncate block"
                        >
                          {file.name}
                        </a>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-slate-400 dark:text-slate-500 text-sm italic bg-slate-50/50 dark:bg-slate-900/20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                  No files uploaded yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>



      {/* ── Delete Task Confirm ── */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
          <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6 animate-fade-in">
            <h2 className="text-lg font-bold text-slate-900 mb-2">Delete Task?</h2>
            <p className="text-slate-500 text-sm mb-6">
              Delete <span className="font-bold text-slate-800">{deleteConfirm.title}</span>? This cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-all">Cancel</button>
              <button onClick={handleDelete} className="px-4 py-2 bg-rose-600 text-white text-sm font-bold rounded-xl hover:bg-rose-700 transition-all">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetail;
