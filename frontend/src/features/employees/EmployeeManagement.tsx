import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchEmployees, createEmployee } from '../../store/slices/userSlice';
import { UserPlus, Mail, Shield, Loader2, X, Phone, Building2, Calendar, Briefcase, ChevronRight, Clock } from 'lucide-react';

const formatDateTime = (value?: string | null) => {
  if (!value) return 'Not recorded';

  return new Date(value).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
};

const EmployeeManagement = () => {
  const dispatch = useAppDispatch();
  const { employees, isLoading, error } = useAppSelector((state) => state.users);
  
  const [showModal, setShowModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [form, setForm] = useState({ 
    name: '', email: '', password: '', 
    phone: '', designation: '', department: '', joiningDate: '' 
  });
  const [formError, setFormError] = useState('');

  useEffect(() => {
    dispatch(fetchEmployees());
  }, [dispatch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!form.name || !form.email || !form.password) {
      setFormError('Name, Email, and Password are required');
      return;
    }

    try {
      await dispatch(createEmployee(form)).unwrap();
      setShowModal(false);
      setForm({ name: '', email: '', password: '', phone: '', designation: '', department: '', joiningDate: '' });
    } catch (err: any) {
      setFormError(err || 'Failed to create employee');
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Employee Management</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Manage your staff and assign them tasks.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-5 py-3 bg-indigo-600 rounded-2xl text-sm font-bold text-white hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all self-start sm:self-auto"
        >
          <UserPlus className="w-5 h-5" />
          Add Employee
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl text-sm font-medium">
          {error}
        </div>
      )}

      {isLoading && employees.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {employees.map((emp) => (
            <div 
              key={emp._id} 
              onClick={() => setSelectedEmployee(emp)}
              className="glass p-6 rounded-3xl flex flex-col items-center text-center gap-4 hover:shadow-lg dark:hover:shadow-indigo-900/20 transition-all border border-transparent hover:border-indigo-200 dark:hover:border-indigo-800 cursor-pointer group"
            >
              <div className="w-16 h-16 rounded-full bg-indigo-50 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-xl font-bold group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/80 transition-colors">
                {emp.name.charAt(0).toUpperCase()}
              </div>
              <div className="w-full">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{emp.name}</h3>
                <div className="flex flex-col items-center gap-1.5 mt-2">
                  <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <Briefcase className="w-3.5 h-3.5" />
                    {emp.designation || 'Staff'}
                  </div>
                  <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/30 px-2.5 py-1 rounded-full border border-indigo-100/50 dark:border-indigo-800/50">
                    <Shield className="w-3 h-3" />
                    Employee
                  </div>
                </div>
              </div>
              <div className="w-full pt-4 mt-auto border-t border-slate-100 dark:border-slate-700/50 flex items-center justify-between text-indigo-600 dark:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-xs font-bold">View Profile</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          ))}
          {employees.length === 0 && !isLoading && (
            <div className="col-span-full py-12 text-center text-slate-500 dark:text-slate-400">
              No employees found. Add one to get started.
            </div>
          )}
        </div>
      )}

      {/* Add Employee Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-8 animate-fade-in custom-scrollbar">
            <div className="flex items-center justify-between mb-6 sticky top-0 bg-white dark:bg-slate-800 z-10 pb-2">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Add New Employee</h2>
                <p className="text-slate-400 dark:text-slate-500 text-sm mt-0.5">Create a new account for your staff.</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 mb-4 bg-rose-50 text-rose-600 rounded-xl text-sm font-medium">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Account Credentials */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest opacity-50 border-b border-slate-100 dark:border-slate-700 pb-2">Account Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Full Name *</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      placeholder="e.g. Jane Doe"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Email (User ID) *</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      placeholder="e.g. jane@company.com"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Password *</label>
                    <input
                      type="password"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      placeholder="Min. 6 characters"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Employee Profile */}
              <div className="space-y-4 pt-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest opacity-50 border-b border-slate-100 dark:border-slate-700 pb-2">Profile Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Phone Number</label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      placeholder="e.g. +91 9876543210"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Date of Joining</label>
                    <input
                      type="date"
                      value={form.joiningDate}
                      onChange={(e) => setForm({ ...form, joiningDate: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Designation</label>
                    <input
                      type="text"
                      value={form.designation}
                      onChange={(e) => setForm({ ...form, designation: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      placeholder="e.g. Support Specialist"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Department</label>
                    <input
                      type="text"
                      value={form.department}
                      onChange={(e) => setForm({ ...form, department: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      placeholder="e.g. Customer Service"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Employee Profile Modal */}
      {selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSelectedEmployee(null)} />
          <div className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-fade-in">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 h-24 relative">
              <button 
                onClick={() => setSelectedEmployee(null)} 
                className="absolute top-4 right-4 p-2 text-white/80 hover:text-white bg-black/10 hover:bg-black/20 rounded-xl backdrop-blur-sm transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="px-8 pb-8">
              {/* Profile Avatar */}
              <div className="w-20 h-20 rounded-2xl bg-white dark:bg-slate-800 border-4 border-white dark:border-slate-800 shadow-lg flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-3xl font-bold -mt-10 mx-auto relative z-10 mb-4">
                {selectedEmployee.name.charAt(0).toUpperCase()}
              </div>

              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{selectedEmployee.name}</h2>
                <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">{selectedEmployee.designation || 'Staff Member'}</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700">
                  <Mail className="w-5 h-5 text-indigo-500 mt-0.5" />
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 dark:text-slate-500 block mb-0.5">User ID / Email</span>
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200 break-all">{selectedEmployee.email}</span>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700">
                  <Phone className="w-5 h-5 text-indigo-500 mt-0.5" />
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 dark:text-slate-500 block mb-0.5">Phone Number</span>
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{selectedEmployee.phone || 'Not provided'}</span>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700">
                  <Building2 className="w-5 h-5 text-indigo-500 mt-0.5" />
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 dark:text-slate-500 block mb-0.5">Department</span>
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{selectedEmployee.department || 'Not assigned'}</span>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700">
                  <Calendar className="w-5 h-5 text-indigo-500 mt-0.5" />
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 dark:text-slate-500 block mb-0.5">Date of Joining</span>
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{selectedEmployee.joiningDate ? new Date(selectedEmployee.joiningDate).toLocaleDateString() : 'Unknown'}</span>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <Clock className="w-5 h-5 text-emerald-500 mt-0.5" />
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block mb-0.5">Last Login</span>
                    <span className="text-sm font-bold text-slate-800">{formatDateTime(selectedEmployee.lastLoginAt)}</span>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <Clock className="w-5 h-5 text-rose-500 mt-0.5" />
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block mb-0.5">Last Logout</span>
                    <span className="text-sm font-bold text-slate-800">{formatDateTime(selectedEmployee.lastLogoutAt)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-700 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full text-xs font-bold border border-indigo-100 dark:border-indigo-800/50">
                  <Shield className="w-3.5 h-3.5" />
                  Verified Employee Account
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeManagement;
