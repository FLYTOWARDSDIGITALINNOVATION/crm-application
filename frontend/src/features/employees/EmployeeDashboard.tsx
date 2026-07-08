import React, { useEffect, useState } from 'react';
import { 
  CheckSquare, Clock, AlertCircle, Calendar, 
  CheckCircle2, Circle, MoreVertical, LayoutDashboard
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchTasks, updateTask } from '../../store/slices/taskSlice';

const EmployeeDashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { items: tasks, isLoading } = useAppSelector((state) => state.tasks);

  // Filter tasks specifically for this employee
  // Note: assignedTo matches the user's name or email based on how Admin assigned it
  const myTasks = tasks.filter(task => 
    task.assignedTo === user?.name || task.assignedTo === user?.email
  );

  useEffect(() => {
    if (tasks.length === 0) {
      dispatch(fetchTasks());
    }
  }, [dispatch, tasks.length]);

  const pendingCount = myTasks.filter(t => t.status === 'Pending').length;
  const inProgressCount = myTasks.filter(t => t.status === 'In Progress').length;
  const completedCount = myTasks.filter(t => t.status === 'Completed').length;

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'High': return 'text-rose-600 bg-rose-50 border-rose-100';
      case 'Medium': return 'text-amber-600 bg-amber-50 border-amber-100';
      default: return 'text-slate-500 bg-slate-50 border-slate-100';
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Welcome Banner */}
      <div className="bg-hero-gradient p-8 rounded-3xl text-white shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-[20%] -translate-y-[20%] w-64 h-64 bg-white/5 rounded-full pointer-events-none blur-2xl"></div>
        <div>
          <span className="text-[10px] uppercase font-bold text-indigo-200 tracking-widest bg-white/10 px-3 py-1 rounded-full flex items-center gap-2 w-fit">
            <LayoutDashboard className="w-3 h-3" />
            Employee Workspace
          </span>
          <h1 className="text-3xl font-extrabold font-inter tracking-tight mt-3">Hello, {user?.name}!</h1>
          <p className="text-indigo-100/80 text-sm mt-1">Here is the latest update on your assigned tasks and responsibilities.</p>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass p-6 rounded-2xl flex items-center gap-4 hover:shadow-lg transition-all border border-transparent hover:border-orange-200">
          <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Pending</span>
            <h3 className="text-2xl font-bold text-slate-900">{pendingCount}</h3>
          </div>
        </div>
        <div className="glass p-6 rounded-2xl flex items-center gap-4 hover:shadow-lg transition-all border border-transparent hover:border-blue-200">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">In Progress</span>
            <h3 className="text-2xl font-bold text-slate-900">{inProgressCount}</h3>
          </div>
        </div>
        <div className="glass p-6 rounded-2xl flex items-center gap-4 hover:shadow-lg transition-all border border-transparent hover:border-emerald-200">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Completed</span>
            <h3 className="text-2xl font-bold text-slate-900">{completedCount}</h3>
          </div>
        </div>
      </div>

      {/* Task List */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-6">Your Assigned Tasks</h2>
        
        {isLoading && myTasks.length === 0 ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          </div>
        ) : myTasks.length === 0 ? (
          <div className="glass p-12 rounded-3xl text-center border border-slate-100">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
              <CheckSquare className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">You're all caught up!</h3>
            <p className="text-slate-500 text-sm mt-1">You have no tasks assigned to you at the moment.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {myTasks.map((task) => (
              <div key={task.id} className="glass p-4 sm:p-6 rounded-3xl group hover:shadow-lg transition-all border-l-4 border-transparent hover:border-indigo-500">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="mt-1">
                      {task.status === 'Completed' ? (
                        <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                      ) : task.status === 'In Progress' ? (
                        <AlertCircle className="w-6 h-6 text-blue-500" />
                      ) : (
                        <Circle className="w-6 h-6 text-slate-300" />
                      )}
                    </div>
                    <div className="space-y-1">
                      <h3 className={cn(
                        "text-lg font-bold transition-all",
                        task.status === 'Completed' ? "text-slate-400 line-through" : "text-slate-900"
                      )}>
                        {task.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-400 font-medium">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          Due: {task.dueDate}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <CheckSquare className="w-3.5 h-3.5" />
                          {task.relatedTo}
                        </div>
                        <span className={cn(
                          "px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider border",
                          getPriorityStyle(task.priority)
                        )}>
                          {task.priority}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Status Dropdown */}
                  <div className="flex items-center self-start sm:self-center ml-10 sm:ml-0">
                    <div className="relative bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 group-hover:border-indigo-200 transition-colors">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-0.5">Status</span>
                      <select
                        value={task.status}
                        onChange={(e) => dispatch(updateTask({ id: task.id, status: e.target.value }))}
                        className={cn(
                          "text-sm font-bold bg-transparent border-none cursor-pointer focus:ring-0 outline-none transition-colors pr-4 appearance-none",
                          task.status === 'Completed' ? "text-emerald-600" :
                          task.status === 'In Progress' ? "text-blue-600" : "text-slate-600"
                        )}
                      >
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeDashboard;
