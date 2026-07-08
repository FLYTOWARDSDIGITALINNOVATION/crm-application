import React, { useState, useRef, useEffect } from 'react';
import { 
  CheckSquare, Clock, AlertCircle, Plus, 
  Search, Filter, MoreVertical, Calendar,
  User, CheckCircle2, Circle, X, Trash2, Loader2
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchTasks, createTask, updateTask, deleteTask } from '../../store/slices/taskSlice';
import { fetchEmployees } from '../../store/slices/userSlice';
import type { Task } from '../../store/slices/taskSlice';

const defaultForm = {
  title: '',
  dueDate: '',
  priority: 'Medium' as Task['priority'],
  assignedTo: '',
  relatedTo: '',
};

const TaskList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [errors, setErrors] = useState<Partial<typeof defaultForm>>({});
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const dispatch = useAppDispatch();
  const { items: tasks, isLoading } = useAppSelector((state) => state.tasks);
  const { employees } = useAppSelector((state) => state.users);
  const { user } = useAppSelector((state) => state.auth);

  // Fetch tasks and employees on mount
  useEffect(() => {
    dispatch(fetchTasks());
    dispatch(fetchEmployees());
  }, [dispatch]);

  // Derived stats
  const pendingCount = tasks.filter(t => t.status === 'Pending').length;
  const completedCount = tasks.filter(t => t.status === 'Completed').length;
  const todayStr = new Date().toISOString().split('T')[0];
  const dueTodayCount = tasks.filter(t => t.dueDate === todayStr).length;

  const filteredTasks = tasks.filter(task => {
    const searchMatch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        task.assignedTo.toLowerCase().includes(searchTerm.toLowerCase());
    
    const roleMatch = user?.role !== 'employee' || task.assignedTo === user?.name || task.assignedTo === user?.email;
    
    return searchMatch && roleMatch;
  });

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'High': return 'text-rose-600 bg-rose-50 border-rose-100';
      case 'Medium': return 'text-amber-600 bg-amber-50 border-amber-100';
      default: return 'text-slate-500 bg-slate-50 border-slate-100';
    }
  };

  const validate = () => {
    const newErrors: Partial<typeof defaultForm> = {};
    if (!form.title.trim()) newErrors.title = 'Title is required';
    if (!form.dueDate) newErrors.dueDate = 'Due date is required';
    if (!form.assignedTo.trim()) newErrors.assignedTo = 'Assignee is required';
    if (!form.relatedTo.trim()) newErrors.relatedTo = 'Related to is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    dispatch(createTask({
      title: form.title.trim(),
      dueDate: form.dueDate,
      priority: form.priority,
      status: 'Pending',
      assignedTo: form.assignedTo.trim(),
      relatedTo: form.relatedTo.trim(),
    }));

    setForm(defaultForm);
    setErrors({});
    setShowModal(false);
  };

  const handleClose = () => {
    setShowModal(false);
    setForm(defaultForm);
    setErrors({});
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Task Management</h1>
          <p className="text-slate-500 text-sm">Stay on top of your deals and follow-ups.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-5 py-3 bg-indigo-600 rounded-2xl text-sm font-bold text-white hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all self-start sm:self-auto"
        >
          <Plus className="w-5 h-5" />
          Create New Task
        </button>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          <span className="ml-3 text-slate-500 font-medium">Loading tasks...</span>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass p-6 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Pending</span>
            <h3 className="text-2xl font-bold text-slate-900">{pendingCount}</h3>
          </div>
        </div>
        <div className="glass p-6 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Due Today</span>
            <h3 className="text-2xl font-bold text-slate-900">{dueTodayCount}</h3>
          </div>
        </div>
        <div className="glass p-6 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Completed</span>
            <h3 className="text-2xl font-bold text-slate-900">{completedCount}</h3>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="glass p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search tasks..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all">
            <Filter className="w-4 h-4" />
            Active Tasks
          </button>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-4">
        {filteredTasks.map((task) => (
          <div key={task.id} className="glass p-4 sm:p-6 rounded-3xl group hover:shadow-lg transition-all border-l-4 border-transparent hover:border-indigo-500">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <select
                  value={task.status}
                  onChange={(e) => dispatch(updateTask({ id: task.id, status: e.target.value }))}
                  className={cn(
                    "mt-1 text-sm font-bold bg-transparent border-none cursor-pointer focus:ring-0 outline-none transition-colors",
                    task.status === 'Completed' ? "text-emerald-500" :
                    task.status === 'In Progress' ? "text-blue-500" : "text-slate-400 hover:text-indigo-600"
                  )}
                >
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
                <div className="space-y-1">
                  <h3 className={cn(
                    "text-lg font-bold transition-all",
                    task.status === 'Completed' ? "text-slate-400 line-through" : "text-slate-900 group-hover:text-indigo-600"
                  )}>
                    {task.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-400 font-medium">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {task.dueDate}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckSquare className="w-3.5 h-3.5" />
                      {task.relatedTo}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" />
                      {task.assignedTo}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={cn(
                  "px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border",
                  getPriorityStyle(task.priority)
                )}>
                  {task.priority}
                </span>
                {/* Action Menu */}
                <div className="relative" ref={openMenuId === task.id ? menuRef : null}>
                  <button
                    onClick={() => setOpenMenuId(openMenuId === task.id ? null : task.id)}
                    className="p-2 text-slate-300 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>

                  {openMenuId === task.id && (
                    <div className="absolute right-0 top-10 z-20 w-40 bg-white border border-slate-100 rounded-2xl shadow-xl py-1.5 animate-fade-in">
                      <button
                        onClick={() => {
                          dispatch(deleteTask(task.id));
                          setOpenMenuId(null);
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete Task
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Task Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Modal */}
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl p-8 animate-fade-in">
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Create New Task</h2>
                <p className="text-slate-400 text-sm mt-0.5">Fill in the details below to add a task.</p>
              </div>
              <button
                onClick={handleClose}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Task Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Follow up with client"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className={cn(
                    "w-full px-4 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all",
                    errors.title ? "border-rose-400 bg-rose-50" : "border-slate-200 bg-slate-50"
                  )}
                />
                {errors.title && <p className="text-rose-500 text-xs mt-1">{errors.title}</p>}
              </div>

              {/* Due Date & Priority */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Due Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={form.dueDate}
                    onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                    className={cn(
                      "w-full px-4 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all",
                      errors.dueDate ? "border-rose-400 bg-rose-50" : "border-slate-200 bg-slate-50"
                    )}
                  />
                  {errors.dueDate && <p className="text-rose-500 text-xs mt-1">{errors.dueDate}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Priority</label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value as Task['priority'] })}
                    className="w-full px-4 py-2.5 border border-slate-200 bg-slate-50 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              {/* Assigned To */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Assigned To <span className="text-rose-500">*</span>
                </label>
                <select
                  value={form.assignedTo}
                  onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
                  className={cn(
                    "w-full px-4 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all",
                    errors.assignedTo ? "border-rose-400 bg-rose-50" : "border-slate-200 bg-slate-50"
                  )}
                >
                  <option value="" disabled>Select an employee</option>
                  {employees.map(emp => (
                    <option key={emp._id} value={emp.name}>{emp.name}</option>
                  ))}
                </select>
                {errors.assignedTo && <p className="text-rose-500 text-xs mt-1">{errors.assignedTo}</p>}
              </div>

              {/* Related To */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Related To <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. TechCorp, Lead #123"
                  value={form.relatedTo}
                  onChange={(e) => setForm({ ...form, relatedTo: e.target.value })}
                  className={cn(
                    "w-full px-4 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all",
                    errors.relatedTo ? "border-rose-400 bg-rose-50" : "border-slate-200 bg-slate-50"
                  )}
                />
                {errors.relatedTo && <p className="text-rose-500 text-xs mt-1">{errors.relatedTo}</p>}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-5 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Add Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskList;
