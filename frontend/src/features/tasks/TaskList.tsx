import React, { useState, useRef, useEffect } from 'react';
import {
  CheckSquare, Clock, AlertCircle, Plus,
  Search, Filter, MoreVertical, Calendar,
  User, CheckCircle2, Circle, X, Trash2, Loader2
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchTasks, createTask, toggleTaskStatus, deleteTask, updateTask } from '../../store/slices/taskSlice';
import type { Task } from '../../store/slices/taskSlice';
import { fetchEmployees } from '../../store/slices/userSlice';

const defaultForm = {
  title: '',
  dueDate: '',
  priority: 'Medium' as Task['priority'],
  assignedTo: '',
  relatedTo: '',
};

const TaskList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'All' | 'Pending' | 'Completed'>('All');
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
  const [allocationTask, setAllocationTask] = useState<Task | null>(null);

  // Fetch tasks from MongoDB on mount
  useEffect(() => {
    dispatch(fetchTasks());
    dispatch(fetchEmployees());
  }, [dispatch]);

  // Derived stats
  const pendingCount = tasks.filter(t => t.status === 'Pending').length;
  const completedCount = tasks.filter(t => t.status === 'Completed').length;
  const todayStr = new Date().toISOString().split('T')[0];
  const dueTodayCount = tasks.filter(t => t.dueDate === todayStr).length;

  const filteredTasks = tasks.filter(task =>
    (task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.assignedTo.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (filterStatus === 'All' || task.status === filterStatus)
  );

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'High': return 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/30 border-rose-100 dark:border-rose-800/50';
      case 'Medium': return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 border-amber-100 dark:border-amber-800/50';
      default: return 'text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/30 border-slate-100 dark:border-slate-700';
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
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Task Management</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Stay on top of your deals and follow-ups.</p>
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
          <div className="w-12 h-12 rounded-xl bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider">Pending</span>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{pendingCount}</h3>
          </div>
        </div>
        <div className="glass p-6 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider">Due Today</span>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{dueTodayCount}</h3>
          </div>
        </div>
        <div className="glass p-6 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider">Completed</span>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{completedCount}</h3>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="glass p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Search tasks..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setFilterStatus(prev => prev === 'All' ? 'Pending' : prev === 'Pending' ? 'Completed' : 'All')}
            className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all w-36 justify-center"
          >
            <Filter className="w-4 h-4 shrink-0" />
            <span className="truncate">
              {filterStatus === 'All' ? 'All Tasks' : filterStatus === 'Pending' ? 'Active Tasks' : 'Completed'}
            </span>
          </button>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-4">
        {filteredTasks.map((task) => (
          <div key={task.id} className="glass p-4 sm:p-6 rounded-3xl group hover:shadow-lg transition-all border-l-4 border-transparent hover:border-indigo-500">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <button
                  onClick={() => dispatch(toggleTaskStatus(task.id))}
                  className="mt-1 text-slate-300 hover:text-indigo-600 transition-colors"
                >
                  {task.status === 'Completed' ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                  ) : (
                    <Circle className="w-6 h-6" />
                  )}
                </button>
                <div className="space-y-1">
                  <h3 className={cn(
                    "text-lg font-bold transition-all",
                    task.status === 'Completed' ? "text-slate-400 dark:text-slate-500 line-through" : "text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400"
                  )}>
                    {task.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-400 dark:text-slate-500 font-medium">
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
                    className="p-2 text-slate-300 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>

                  {openMenuId === task.id && (
                    <div className="absolute right-0 top-10 z-20 w-48 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-xl py-1.5 animate-fade-in">
                      <button
                        onClick={() => {
                          setAllocationTask(task);
                          setOpenMenuId(null);
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
                      >
                        <User className="w-4 h-4" />
                        Allocate Task
                      </button>
                      <button
                        onClick={() => {
                          dispatch(deleteTask(task.id));
                          setOpenMenuId(null);
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors"
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
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-8 animate-fade-in">
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Create New Task</h2>
                <p className="text-slate-400 dark:text-slate-500 text-sm mt-0.5">Fill in the details below to add a task.</p>
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
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Task Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Follow up with client"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className={cn(
                    "w-full px-4 py-2.5 border rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-indigo-500 outline-none transition-all",
                    errors.title ? "border-rose-400 bg-rose-50 dark:bg-rose-900/30 dark:border-rose-800" : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50"
                  )}
                />
                {errors.title && <p className="text-rose-500 text-xs mt-1">{errors.title}</p>}
              </div>

              {/* Due Date & Priority */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Due Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={form.dueDate}
                    onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                    className={cn(
                      "w-full px-4 py-2.5 border rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-indigo-500 outline-none transition-all",
                      errors.dueDate ? "border-rose-400 bg-rose-50 dark:bg-rose-900/30 dark:border-rose-800" : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50"
                    )}
                  />
                  {errors.dueDate && <p className="text-rose-500 text-xs mt-1">{errors.dueDate}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Priority</label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value as Task['priority'] })}
                    className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  >
                    <option value="High" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">High</option>
                    <option value="Medium" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Medium</option>
                    <option value="Low" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Low</option>
                  </select>
                </div>
              </div>

              {/* Assigned To */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Assigned To <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  value={form.assignedTo}
                  onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
                  className={cn(
                    "w-full px-4 py-2.5 border rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-indigo-500 outline-none transition-all",
                    errors.assignedTo ? "border-rose-400 bg-rose-50 dark:bg-rose-900/30 dark:border-rose-800" : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50"
                  )}
                />
                {errors.assignedTo && <p className="text-rose-500 text-xs mt-1">{errors.assignedTo}</p>}
              </div>

              {/* Related To */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Related To <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. TechCorp, Lead #123"
                  value={form.relatedTo}
                  onChange={(e) => setForm({ ...form, relatedTo: e.target.value })}
                  className={cn(
                    "w-full px-4 py-2.5 border rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-indigo-500 outline-none transition-all",
                    errors.relatedTo ? "border-rose-400 bg-rose-50 dark:bg-rose-900/30 dark:border-rose-800" : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50"
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
      {/* Allocate Task Modal */}
      {allocationTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setAllocationTask(null)} />
          <div className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 animate-fade-in max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between mb-6 shrink-0">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Allocate Task</h2>
                <p className="text-slate-400 dark:text-slate-500 text-sm mt-0.5 line-clamp-1">{allocationTask.title}</p>
              </div>
              <button
                onClick={() => setAllocationTask(null)}
                className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-2">
              {employees.length === 0 ? (
                <div className="text-center text-slate-500 dark:text-slate-400 py-8 text-sm italic">No employees found.</div>
              ) : (
                employees.map(emp => (
                  <button
                    key={emp._id}
                    onClick={() => {
                      dispatch(updateTask({ id: allocationTask.id, assignedTo: emp.name }));
                      setAllocationTask(null);
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-500/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700/50 flex items-center justify-center text-slate-500 dark:text-slate-400 font-bold group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/50 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {emp.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="text-left">
                        <div className="text-sm font-bold text-slate-800 dark:text-slate-200">{emp.name}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 capitalize">{emp.role}</div>
                      </div>
                    </div>
                    <div className="text-xs font-bold text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">
                      Select
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskList;
