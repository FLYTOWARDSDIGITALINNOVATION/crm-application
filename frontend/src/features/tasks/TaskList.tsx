import React, { useState, useEffect, useRef } from 'react';
import {
  Plus, Search, Filter, MoreVertical, Calendar,
  User, CheckCircle2, Circle, X, Trash2, Loader2,
  Eye, Edit2, Info, FolderKanban, CheckSquare, ArrowLeft
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchTasks, createTask, updateTask, deleteTask, toggleTaskStatus } from '../../store/slices/taskSlice';
import type { Task } from '../../store/slices/taskSlice';
import { fetchEmployees } from '../../store/slices/userSlice';
import { fetchProjects } from '../../store/slices/projectSlice';

const formatDate = (dateStr?: string) => {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const priorityStyle = (priority: string) => {
  switch (priority) {
    case 'High': return 'bg-rose-50 text-rose-600 border-rose-200';
    case 'Medium': return 'bg-amber-50 text-amber-600 border-amber-200';
    case 'Low': return 'bg-emerald-50 text-emerald-600 border-emerald-200';
    default: return 'bg-slate-50 text-slate-600 border-slate-200';
  }
};

const statusStyle = (status: string) => {
  switch (status) {
    case 'In Progress': return 'bg-blue-50 text-blue-600 border-blue-200';
    case 'To Do': case 'Pending': return 'bg-slate-100 text-slate-700 border-slate-200';
    case 'Review': return 'bg-purple-50 text-purple-600 border-purple-200';
    case 'Completed': return 'bg-emerald-50 text-emerald-600 border-emerald-200';
    default: return 'bg-slate-100 text-slate-700 border-slate-200';
  }
};

const projectColor = (name: string, index: number) => {
  const lower = name.toLowerCase();
  if (lower.includes('marketing') || lower.includes('web')) return 'text-emerald-600 font-bold';
  if (lower.includes('mobile') || lower.includes('app')) return 'text-blue-600 font-bold';
  if (lower.includes('hr') || lower.includes('portal')) return 'text-rose-600 font-bold';
  const colors = ['text-purple-600', 'text-indigo-600', 'text-cyan-600', 'text-amber-600'];
  return `${colors[index % colors.length]} font-bold`;
};

const TaskList: React.FC = () => {
  const dispatch = useAppDispatch();
  const { items: tasks, isLoading } = useAppSelector((state) => state.tasks);
  const { employees } = useAppSelector((state) => state.users);
  const { items: projects } = useAppSelector((state) => state.projects);
  const { user } = useAppSelector((state) => state.auth);
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  // Filters
  const [selectedProject, setSelectedProject] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedPriority, setSelectedPriority] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Action States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewTask, setViewTask] = useState<Task | null>(null);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Task | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Form State
  const [form, setForm] = useState({
    title: '',
    projectId: '',
    relatedTo: '',
    assignedTo: [] as string[],
    priority: 'Medium' as 'High' | 'Medium' | 'Low',
    status: 'To Do' as 'To Do' | 'In Progress' | 'Review' | 'Completed' | 'Pending',
    startDate: '',
    dueDate: '',
    progress: 0,
    description: '',
  });
  const [formError, setFormError] = useState('');

  useEffect(() => {
    dispatch(fetchTasks());
    dispatch(fetchProjects());
    if (isAdmin) {
      dispatch(fetchEmployees());
    }
  }, [dispatch, isAdmin]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const availableEmployees = employees.filter(e => e.role !== 'superadmin');

  // Filter Tasks Logic
  const filteredTasks = tasks.filter(task => {
    // Role check: employees see only their tasks or assigned projects
    if (user?.role === 'employee') {
      const isAssigned = task.assignedTo && (
        task.assignedTo.includes(user.name) ||
        (user.email && task.assignedTo.includes(user.email)) ||
        (user._id && task.assignedTo.includes(user._id))
      );
      if (!isAssigned) return false;
    }

    // Project Filter
    if (selectedProject !== 'All') {
      const projMatch = task.projectId === selectedProject || (task.relatedTo && task.relatedTo.toLowerCase() === selectedProject.toLowerCase());
      if (!projMatch) return false;
    }

    // Status Filter
    if (selectedStatus !== 'All') {
      if (selectedStatus === 'To Do' && task.status !== 'To Do' && task.status !== 'Pending') return false;
      if (selectedStatus !== 'To Do' && task.status !== selectedStatus) return false;
    }

    // Priority Filter
    if (selectedPriority !== 'All' && task.priority !== selectedPriority) return false;

    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const titleMatch = task.title.toLowerCase().includes(q);
      const projMatch = (task.relatedTo || '').toLowerCase().includes(q);
      const assignMatch = (task.assignedTo || '').toLowerCase().includes(q);
      if (!titleMatch && !projMatch && !assignMatch) return false;
    }

    return true;
  });

  const openCreate = () => {
    setForm({
      title: '',
      projectId: '',
      relatedTo: '',
      assignedTo: [],
      priority: 'Medium',
      status: 'To Do',
      startDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      progress: 0,
      description: '',
    });
    setFormError('');
    setShowCreateModal(true);
  };

  const openEdit = (t: Task) => {
    const existingAssignees = Array.isArray(t.assignedTo)
      ? t.assignedTo
      : (t.assignedTo ? t.assignedTo.split(',').map(s => s.trim()).filter(Boolean) : []);

    setEditTask(t);
    setForm({
      title: t.title,
      projectId: t.projectId || '',
      relatedTo: t.relatedTo || '',
      assignedTo: existingAssignees,
      priority: (t.priority as any) || 'Medium',
      status: (t.status as any) || 'To Do',
      startDate: t.startDate || new Date().toISOString().split('T')[0],
      dueDate: t.dueDate || '',
      progress: typeof t.progress === 'number' ? t.progress : (t.status === 'Completed' ? 100 : t.status === 'In Progress' ? 50 : 0),
      description: t.description || '',
    });
    setFormError('');
    setOpenMenuId(null);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { setFormError('Task title is required'); return; }
    if (!form.dueDate) { setFormError('Due date is required'); return; }

    const selectedProj = projects.find(p => p._id === form.projectId || p.name === form.relatedTo);

    await dispatch(createTask({
      title: form.title.trim(),
      projectId: selectedProj?._id || form.projectId || undefined,
      relatedTo: selectedProj?.name || form.relatedTo || 'General',
      assignedTo: form.assignedTo.length ? (form.assignedTo as any) : ['Unassigned'],
      priority: form.priority,
      status: form.status,
      startDate: form.startDate,
      dueDate: form.dueDate,
      progress: form.progress,
      description: form.description,
    }));

    setShowCreateModal(false);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTask) return;
    if (!form.title.trim()) { setFormError('Task title is required'); return; }

    const selectedProj = projects.find(p => p._id === form.projectId || p.name === form.relatedTo);

    await dispatch(updateTask({
      id: editTask.id,
      title: form.title.trim(),
      projectId: selectedProj?._id || form.projectId || undefined,
      relatedTo: selectedProj?.name || form.relatedTo || editTask.relatedTo,
      assignedTo: form.assignedTo as any,
      priority: form.priority,
      status: form.status,
      startDate: form.startDate,
      dueDate: form.dueDate,
      progress: form.progress,
      description: form.description,
    }));

    setEditTask(null);
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    await dispatch(deleteTask(deleteConfirm.id));
    setDeleteConfirm(null);
    setOpenMenuId(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Tasks</h1>
          <p className="text-slate-500 text-sm mt-0.5">Manage and track tasks under projects</p>
        </div>
      </div>

      {/* Toolbar: Filters, Search & Action Button */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white/60 backdrop-blur-md p-4 rounded-2xl border border-slate-100 shadow-sm">
        {/* Left Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Projects Filter */}
          <select
            value={selectedProject}
            onChange={e => setSelectedProject(e.target.value)}
            className="px-3.5 py-2 bg-white rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all cursor-pointer"
          >
            <option value="All">All Projects</option>
            {projects.map(p => (
              <option key={p._id} value={p._id}>{p.name}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            className="px-3.5 py-2 bg-white rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all cursor-pointer"
          >
            <option value="All">All Status</option>
            <option value="To Do">To Do</option>
            <option value="In Progress">In Progress</option>
            <option value="Review">Review</option>
            <option value="Completed">Completed</option>
          </select>

          {/* Priority Filter */}
          <select
            value={selectedPriority}
            onChange={e => setSelectedPriority(e.target.value)}
            className="px-3.5 py-2 bg-white rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all cursor-pointer"
          >
            <option value="All">All Priority</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>

        {/* Right Search Input & Green Create Button */}
        <div className="flex items-center gap-3 self-stretch lg:self-auto">
          <div className="relative flex-1 lg:w-64">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white rounded-xl border border-slate-200 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
            />
          </div>

          {isAdmin && (
            <button
              onClick={openCreate}
              className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-200 transition-all shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              New Task
            </button>
          )}
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
          <span className="ml-3 text-slate-500 font-medium">Loading tasks...</span>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredTasks.length === 0 && (
        <div className="bg-white p-12 rounded-3xl text-center border border-slate-100 shadow-sm">
          <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-3 text-emerald-600">
            <CheckSquare className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No tasks found</h3>
          <p className="text-slate-500 text-xs mt-1">
            {isAdmin ? 'Create your first task or change search filters.' : 'No tasks assigned to you.'}
          </p>
        </div>
      )}

      {/* Tasks Table View - Matching Reference Image 1 */}
      {!isLoading && filteredTasks.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-100/90 shadow-sm overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-4 px-6">Task Title</th>
                  <th className="py-4 px-4">Project</th>
                  <th className="py-4 px-4">Assigned To</th>
                  <th className="py-4 px-4">Priority</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-4">Start Date</th>
                  <th className="py-4 px-4">Due Date</th>
                  <th className="py-4 px-4">Progress</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredTasks.map((task, idx) => {
                  const pName = task.relatedTo || (projects.find(p => p._id === task.projectId)?.name) || 'Project';
                  const assignees = task.assignedTo ? task.assignedTo.split(',').map(s => s.trim()).filter(Boolean) : [];
                  const mainAssignee = (user?.role === 'employee' && user?.name)
                    ? (assignees.find(a => a.toLowerCase().includes(user.name.toLowerCase()) || (user.email && a.toLowerCase().includes(user.email.toLowerCase()))) || assignees[0] || 'Unassigned')
                    : (assignees[0] || 'Unassigned');
                  const progressVal = typeof task.progress === 'number' ? task.progress : (task.status === 'Completed' ? 100 : task.status === 'In Progress' ? 50 : 0);

                  return (
                    <tr key={task.id} className="hover:bg-slate-50/60 transition-colors group">
                      {/* Task Title */}
                      <td className="py-4 px-6 font-bold text-slate-900">
                        {task.title}
                      </td>

                      {/* Project */}
                      <td className="py-4 px-4">
                        <span className={projectColor(pName, idx)}>
                          {pName}
                        </span>
                      </td>

                      {/* Assigned To */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 font-bold text-[10px] flex items-center justify-center shrink-0 border border-slate-300">
                            {mainAssignee.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-semibold text-slate-800 truncate max-w-[120px]">
                            {mainAssignee}
                          </span>
                        </div>
                      </td>

                      {/* Priority */}
                      <td className="py-4 px-4">
                        <span className={cn('px-3 py-1 rounded-full text-[11px] font-bold border inline-block text-center min-w-[60px]', priorityStyle(task.priority))}>
                          {task.priority}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">
                        <span className={cn('px-3 py-1 rounded-xl text-[11px] font-bold border inline-block text-center whitespace-nowrap', statusStyle(task.status))}>
                          {task.status}
                        </span>
                      </td>

                      {/* Start Date */}
                      <td className="py-4 px-4 font-medium text-slate-600">
                        {formatDate(task.startDate)}
                      </td>

                      {/* Due Date */}
                      <td className="py-4 px-4 font-medium text-slate-600">
                        {formatDate(task.dueDate)}
                      </td>

                      {/* Progress Bar */}
                      <td className="py-4 px-4 min-w-[120px]">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                              style={{ width: `${progressVal}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-bold text-slate-400 w-7 text-right">
                            {progressVal}%
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setViewTask(task)}
                            title="View details"
                            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {isAdmin && (
                            <>
                              <button
                                onClick={() => openEdit(task)}
                                title="Edit task"
                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all cursor-pointer"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => setDeleteConfirm(task)}
                                title="Delete task"
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}



      {/* View Task Details Modal */}
      {viewTask && (
        <Modal title="Task Details" onClose={() => setViewTask(null)}>
          <div className="space-y-4 text-xs text-slate-700">
            <div>
              <span className="text-slate-400 font-bold uppercase text-[10px]">Title</span>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">{viewTask.title}</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-slate-400 font-bold uppercase text-[10px]">Project</span>
                <p className="font-bold text-indigo-600 mt-0.5">{viewTask.relatedTo || 'N/A'}</p>
              </div>
              <div>
                <span className="text-slate-400 font-bold uppercase text-[10px]">Assigned To</span>
                <p className="font-bold text-slate-800 mt-0.5">{viewTask.assignedTo || 'Unassigned'}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-slate-400 font-bold uppercase text-[10px]">Priority</span>
                <p className="mt-0.5"><span className={cn('px-2.5 py-0.5 rounded-full font-bold border text-[10px]', priorityStyle(viewTask.priority))}>{viewTask.priority}</span></p>
              </div>
              <div>
                <span className="text-slate-400 font-bold uppercase text-[10px]">Status</span>
                <p className="mt-0.5"><span className={cn('px-2.5 py-0.5 rounded-xl font-bold border text-[10px]', statusStyle(viewTask.status))}>{viewTask.status}</span></p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-slate-400 font-bold uppercase text-[10px]">Start Date</span>
                <p className="font-semibold text-slate-700 mt-0.5">{formatDate(viewTask.startDate)}</p>
              </div>
              <div>
                <span className="text-slate-400 font-bold uppercase text-[10px]">Due Date</span>
                <p className="font-semibold text-slate-700 mt-0.5">{formatDate(viewTask.dueDate)}</p>
              </div>
            </div>
            {viewTask.description && (
              <div>
                <span className="text-slate-400 font-bold uppercase text-[10px]">Description</span>
                <p className="p-3 bg-slate-50 rounded-xl text-slate-600 mt-1">{viewTask.description}</p>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Create / Edit Task Modal */}
      {(showCreateModal || editTask) && (
        <Modal
          title={showCreateModal ? 'Create New Task' : 'Edit Task'}
          maxWidth="max-w-3xl"
          onClose={() => { setShowCreateModal(false); setEditTask(null); }}
        >
          <form onSubmit={showCreateModal ? handleCreate : handleUpdate} className="space-y-4">
            {formError && <p className="text-rose-500 text-xs font-semibold">{formError}</p>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Task Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Design Login Page"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Project Name</label>
                <input
                  type="text"
                  placeholder="Enter project name..."
                  value={form.relatedTo}
                  onChange={e => setForm({ ...form, relatedTo: e.target.value, projectId: '' })}
                  className="input-field"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Assign Employee</label>
              <div className="max-h-40 overflow-y-auto p-2 border border-slate-200 rounded-xl space-y-1 bg-slate-50/50 custom-scrollbar">
                {availableEmployees.map(emp => {
                  const sel = form.assignedTo.includes(emp.name);
                  return (
                    <button
                      key={emp._id}
                      type="button"
                      onClick={() => {
                        setForm(prev => ({
                          ...prev,
                          assignedTo: sel
                            ? prev.assignedTo.filter(n => n !== emp.name)
                            : [...prev.assignedTo, emp.name]
                        }));
                      }}
                      className={cn(
                        'w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold text-left transition-all',
                        sel ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' : 'hover:bg-slate-100 text-slate-700'
                      )}
                    >
                      <span>{emp.name} ({emp.designation || emp.role})</span>
                      {sel && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Priority</label>
                <select
                  value={form.priority}
                  onChange={e => setForm({ ...form, priority: e.target.value as any })}
                  className="input-field cursor-pointer"
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
                <select
                  value={form.status}
                  onChange={e => setForm({ ...form, status: e.target.value as any })}
                  className="input-field cursor-pointer"
                >
                  <option value="To Do">To Do</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Review">Review</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={e => setForm({ ...form, startDate: e.target.value })}
                  className="input-field cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Due Date *</label>
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={e => setForm({ ...form, dueDate: e.target.value })}
                  className="input-field cursor-pointer"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Progress ({form.progress}%)</label>
              <input
                type="range"
                min="0"
                max="100"
                value={form.progress}
                onChange={e => setForm({ ...form, progress: Number(e.target.value) })}
                className="w-full accent-emerald-600 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
              <textarea
                rows={2}
                placeholder="Task notes or specific instructions..."
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                className="input-field resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => { setShowCreateModal(false); setEditTask(null); }}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md"
              >
                {showCreateModal ? 'Save Task' : 'Update Task'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <Modal title="Delete Task?" onClose={() => setDeleteConfirm(null)}>
          <p className="text-slate-600 text-xs mb-6">
            Are you sure you want to delete <span className="font-bold text-slate-900">{deleteConfirm.title}</span>?
          </p>
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={() => setDeleteConfirm(null)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-rose-600 text-white text-xs font-bold rounded-xl hover:bg-rose-700"
            >
              Delete
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

// Reusable Modal Shell
const Modal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode; maxWidth?: string }> = ({
  title, onClose, children, maxWidth = 'max-w-2xl'
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
    <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
    <div className={cn("relative w-full bg-white rounded-3xl shadow-2xl p-6 sm:p-8 animate-fade-in max-h-[92vh] overflow-y-auto custom-scrollbar", maxWidth)}>
      <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
        <h2 className="text-xl font-bold text-slate-900">{title}</h2>
        <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all">
          <X className="w-5 h-5" />
        </button>
      </div>
      {children}
    </div>
  </div>
);

export default TaskList;
