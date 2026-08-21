import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchTasks } from '../../store/slices/taskSlice';
import { fetchEmployees } from '../../store/slices/userSlice';
import { Bell, X } from 'lucide-react';
import { cn } from '../../utils/cn';

interface ToastData {
  id: string;
  title: string;
  message: string;
  relatedTo?: string;
}

const NotificationManager: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { items: tasks } = useAppSelector((state) => state.tasks);
  const { employees } = useAppSelector((state) => state.users);
  const { user } = useAppSelector((state) => state.auth);
  const notifiedTasks = useRef(new Set<string>(JSON.parse(localStorage.getItem('notifiedTasks') || '[]')));
  
  const [toasts, setToasts] = useState<ToastData[]>([]);

  useEffect(() => {
    const setupWebPush = async () => {
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        try {
          const permission = await Notification.requestPermission();
          if (permission === 'granted') {
            const registration = await navigator.serviceWorker.register('/sw.js');
            let subscription = await registration.pushManager.getSubscription();
            if (subscription) {
              await subscription.unsubscribe();
            }
            const publicVapidKey = 'BIsvvBOzmdrCGYiYpw8bdZlrib4rUaFyFl4YMx5uK8rbaBAbtDTaUqEGT0Pf7LqS0FaeDyeOUtIZ51tF12F7MO8';
            const urlBase64ToUint8Array = (base64String: string) => {
                const padding = '='.repeat((4 - base64String.length % 4) % 4);
                const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
                const rawData = window.atob(base64);
                const outputArray = new Uint8Array(rawData.length);
                for (let i = 0; i < rawData.length; ++i) {
                  outputArray[i] = rawData.charCodeAt(i);
                }
                return outputArray;
              };
              subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
              });

            
            // Send to backend
            const token = localStorage.getItem('token');
            if (token) {
              fetch('http://localhost:5000/api/notifications/subscribe', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ subscription })
              }).catch(console.error);
            }
          }
        } catch (error) {
          console.error('Service Worker Error', error);
        }
      }
    };
    setupWebPush();
    
    // Fetch initial tasks
    dispatch(fetchTasks());
    
    // Fetch tasks every minute to stay synced
    const fetchInterval = setInterval(() => {
      dispatch(fetchTasks());
      if (user?.role === 'superadmin') {
        dispatch(fetchEmployees());
      }
    }, 60000);

    return () => clearInterval(fetchInterval);
  }, [dispatch]);

  useEffect(() => {
    const checkInterval = setInterval(() => {
      const now = new Date().getTime();
      
      tasks.forEach(task => {
        const notifyKey = `${task.id}_${task.dueDate}`;
        if (task.status === 'Pending' && task.dueDate && !notifiedTasks.current.has(notifyKey)) {
          const dueTime = new Date(task.dueDate).getTime();
          
          // Trigger if the time has come, and it's not older than 1 hour (to avoid spam on login)
          if (now >= dueTime && (now - dueTime) < 60 * 60 * 1000) {
            // Mark as notified
            notifiedTasks.current.add(notifyKey);
            localStorage.setItem('notifiedTasks', JSON.stringify(Array.from(notifiedTasks.current)));

            // OS Notification is now handled by the backend Push API + Service Worker

            // 2. In-App Toast Notification (Stays until manually dismissed)
            const newToast = { 
              id: task.id, 
              title: task.description || task.title, 
              message: '',
              relatedTo: task.relatedTo
            };
            setToasts(prev => {
              // Avoid duplicate toasts if interval fires multiple times
              if (prev.some(t => t.id === task.id)) return prev;
              return [...prev, newToast];
            });
          }
        }
      });

      // Employee Approvals for Super Admin
      if (user?.role === 'superadmin') {
        employees.forEach(emp => {
          // Accessing the approvalStatus which might be on the profile or user object itself
          // The backend returns it as approvalStatus on the employee object.
          const anyEmp = emp as any;
          if (anyEmp.approvalStatus === 'Pending') {
            const notifyKey = `approval_${emp._id}`;
            if (!notifiedTasks.current.has(notifyKey)) {
              notifiedTasks.current.add(notifyKey);
              localStorage.setItem('notifiedTasks', JSON.stringify(Array.from(notifiedTasks.current)));

              // OS Notification is handled by the backend Push API + Service Worker

              const newToast = {
                id: notifyKey,
                title: 'Pending Employee Approval',
                message: `${emp.name} is waiting for approval.`,
                relatedTo: 'employee-approvals'
              };
              setToasts(prev => {
                if (prev.some(t => t.id === notifyKey)) return prev;
                return [...prev, newToast];
              });
            }
          }
        });
      }
    }, 1000);

    return () => clearInterval(checkInterval);
  }, [tasks]);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none">
      {toasts.map(toast => (
        <div 
          key={toast.id}
          onClick={() => {
            if (toast.relatedTo === 'employee-approvals') navigate('/employee-approvals');
            else if (toast.relatedTo) navigate(`/leads/${toast.relatedTo}`);
            else navigate('/tasks');
            removeToast(toast.id);
          }}
          className="bg-white dark:bg-slate-800 border border-indigo-100 dark:border-slate-700 shadow-2xl rounded-2xl p-4 w-80 pointer-events-auto animate-in slide-in-from-right-8 fade-in flex gap-3 relative cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-500/50 hover:shadow-indigo-100 dark:hover:shadow-none transition-all"
        >
          <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center shrink-0">
            <Bell className="w-5 h-5 text-indigo-600 dark:text-indigo-400 animate-bounce" />
          </div>
          <div className="flex-1 min-w-0 pr-6">
            <h4 className="text-base font-bold text-slate-900 dark:text-white line-clamp-2 mt-0.5">
              {toast.title}
            </h4>
            {toast.message && (
              <p className="text-sm text-slate-500 dark:text-slate-400 truncate mt-1">
                {toast.message}
              </p>
            )}
          </div>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              removeToast(toast.id);
            }}
            className="absolute top-2 right-2 p-1 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};

export default NotificationManager;
