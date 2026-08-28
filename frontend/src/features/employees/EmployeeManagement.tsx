import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchEmployees, createEmployee, updateEmployeeDetails } from '../../store/slices/userSlice';
import { fetchLeaves } from '../../store/slices/leaveSlice';
import api from '../../utils/api';
import { cn } from '../../utils/cn';
import { UserPlus, Mail, Shield, Loader2, X, Phone, Building2, Calendar, Briefcase, ChevronRight, FileText, Link2, ImageIcon, ChevronLeft, ArrowLeft, MapPin, CreditCard, User, Users, Eye, EyeOff, Camera, Key } from 'lucide-react';

const formatDateTime = (value?: string | null) => {
  if (!value) return 'Not recorded';

  return new Date(value).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
};

const getDaysInMonth = (date: Date) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  
  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const prevMonthTotalDays = new Date(year, month, 0).getDate();
  
  const days: { date: Date; isCurrentMonth: boolean }[] = [];
  
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    days.push({
      date: new Date(year, month - 1, prevMonthTotalDays - i),
      isCurrentMonth: false
    });
  }
  
  for (let i = 1; i <= totalDays; i++) {
    days.push({
      date: new Date(year, month, i),
      isCurrentMonth: true
    });
  }
  
  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    days.push({
      date: new Date(year, month + 1, i),
      isCurrentMonth: false
    });
  }
  
  return days;
};

const hasSessionOnDate = (date: Date, sessions: any[]) => {
  const dString = date.toDateString();
  return sessions.some(s => s.logoutAt && new Date(s.logoutAt).toDateString() === dString);
};

const ProfileFormField = ({ label, value, icon: Icon }: { label: string; value: string; icon?: any }) => {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{label}</label>
      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute left-4 text-slate-400">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <div className={cn(
          "w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-200 transition-all",
          Icon ? "pl-11" : ""
        )}>
          {value || '—'}
        </div>
      </div>
    </div>
  );
};

const downloadPayslip = (month: string, employee: any) => {
  const basic = employee.designation?.toLowerCase().includes('marketing') ? 35000 : 45000;
  const hra = basic * 0.4;
  const allowance = basic * 0.15;
  const pf = 1800;
  const tax = basic * 0.05;
  const net = basic + hra + allowance - pf - tax;

  const printWindow = window.open('', '_blank');
  if (!printWindow) return;
  printWindow.document.write(`
    <html>
      <head>
        <title>Payslip - \${employee.name} - \${month}</title>
        <style>
          body { font-family: 'Inter', sans-serif; color: #1e293b; padding: 40px; line-height: 1.5; }
          .header { border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; }
          .logo { font-size: 24px; font-weight: bold; color: #4f46e5; }
          .title { font-size: 20px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px; }
          .section-title { font-size: 14px; font-weight: bold; text-transform: uppercase; color: #64748b; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 15px; }
          .row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; }
          .row.total { font-weight: bold; border-top: 1px solid #e2e8f0; padding-top: 8px; margin-top: 15px; font-size: 14px; }
          .footer { border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 60px; text-align: center; font-size: 11px; color: #94a3b8; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">FlyTowards Digital Innovation</div>
          <div class="title">Payslip - \${month}</div>
        </div>
        
        <div class="grid">
          <div>
            <div class="section-title">Employee Details</div>
            <div class="row"><span>Name:</span><strong>\${employee.name}</strong></div>
            <div class="row"><span>Employee ID:</span><strong>\${employee.employeeId || 'FTDI001'}</strong></div>
            <div class="row"><span>Designation:</span><strong>\${employee.designation || 'Staff Member'}</strong></div>
            <div class="row"><span>Department:</span><strong>\${employee.department || 'Not assigned'}</strong></div>
          </div>
          <div>
            <div class="section-title">Payment Overview</div>
            <div class="row"><span>Payment Method:</span><strong>Bank Transfer</strong></div>
            <div class="row"><span>UAN Number:</span><strong>100988776655</strong></div>
            <div class="row"><span>Date:</span><strong>Last Day of \${month}</strong></div>
          </div>
        </div>

        <div class="grid">
          <div>
            <div class="section-title">Earnings</div>
            <div class="row"><span>Basic Salary:</span><span>₹\${basic.toLocaleString('en-IN')}</span></div>
            <div class="row"><span>House Rent Allowance (HRA):</span><span>₹\${hra.toLocaleString('en-IN')}</span></div>
            <div class="row"><span>Special Allowance:</span><span>₹\${allowance.toLocaleString('en-IN')}</span></div>
            <div class="row total"><span>Gross Earnings:</span><span>₹\${(basic + hra + allowance).toLocaleString('en-IN')}</span></div>
          </div>
          <div>
            <div class="section-title">Deductions</div>
            <div class="row"><span>Provident Fund (PF):</span><span>₹\${pf.toLocaleString('en-IN')}</span></div>
            <div class="row"><span>Income Tax (TDS):</span><span>₹\${tax.toLocaleString('en-IN')}</span></div>
            <div class="row total"><span>Total Deductions:</span><span>₹\${(pf + tax).toLocaleString('en-IN')}</span></div>
          </div>
        </div>

        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; display: flex; justify-content: space-between; align-items: center; margin-top: 20px;">
          <div>
            <div style="font-size: 11px; font-weight: bold; text-transform: uppercase; color: #64748b; margin-bottom: 4px;">Net Pay (Take-home)</div>
            <div style="font-size: 24px; font-weight: bold; color: #4f46e5;">₹\${net.toLocaleString('en-IN')}</div>
          </div>
          <div style="text-align: right; font-size: 12px; color: #64748b;">
            Rupees \${net === 63700 ? 'Sixty-Three Thousand Seven Hundred Only' : 'Forty-Nine Thousand Four Hundred Fifty Only'}
          </div>
        </div>

        <div class="footer">
          <p>This is a system-generated payslip downloaded by the Administrator of FlyTowards CRM.</p>
          <p>© 2026 FlyTowards CRM. All rights reserved.</p>
        </div>

        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
};

const EmployeeManagement = () => {
  const dispatch = useAppDispatch();
  const { employees, isLoading, error } = useAppSelector((state) => state.users);
  const displayEmployees = employees.filter(emp => emp.role !== 'superadmin');
  const { items: leaves } = useAppSelector((state) => state.leaves);
  
  const [showModal, setShowModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [selectedEmployeeLogs, setSelectedEmployeeLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsError, setLogsError] = useState('');
  const [form, setForm] = useState({ 
    name: '', email: '', password: '', 
    phone: '', designation: '', department: '', joiningDate: '', photo: '' 
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isCustomDepartment, setIsCustomDepartment] = useState(false);
  const [formError, setFormError] = useState('');
  const [profileTab, setProfileTab] = useState<'details' | 'attendance' | 'leaves' | 'payroll'>('details');

  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [profileCalendarViewDate, setProfileCalendarViewDate] = useState<Date>(new Date());
  const [profileSelectedDate, setProfileSelectedDate] = useState<Date>(new Date());

  // Details Edit States
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [editDetailsForm, setEditDetailsForm] = useState({
    name: '', email: '', password: '', phone: '', designation: '', department: '', joiningDate: '', employeeId: '',
    profile: {
      dob: '', gender: '', address: '', aadhaar: '', pan: '',
      bank: { accountType: '', accountNumber: '', ifsc: '' },
      emergencyContact: { name: '', relation: '', phone: '' }
    }
  });
  const [detailsSaving, setDetailsSaving] = useState(false);
  const [detailsError, setDetailsError] = useState('');

  // Payroll Edit States
  const [isEditingPayroll, setIsEditingPayroll] = useState(false);
  const [payrollSalary, setPayrollSalary] = useState('');
  const [payrollPfContribution, setPayrollPfContribution] = useState('');
  const [payrollUan, setPayrollUan] = useState('');
  const [payrollPensionStatus, setPayrollPensionStatus] = useState('');
  const [payrollSaving, setPayrollSaving] = useState(false);
  const [payrollError, setPayrollError] = useState('');

  useEffect(() => {
    if (selectedEmployee) {
      setEditDetailsForm({
        name: selectedEmployee.name || '',
        email: selectedEmployee.email || '',
        phone: selectedEmployee.phone || '',
        designation: selectedEmployee.designation || '',
        department: selectedEmployee.department || '',
        joiningDate: selectedEmployee.joiningDate ? new Date(selectedEmployee.joiningDate).toISOString().split('T')[0] : '',
        employeeId: selectedEmployee.employeeId || '',
        password: selectedEmployee.profile?.generatedPassword || '',
        profile: {
          dob: selectedEmployee.profile?.dob || '',
          gender: selectedEmployee.profile?.gender || '',
          address: selectedEmployee.profile?.address || '',
          aadhaar: selectedEmployee.profile?.aadhaar || '',
          pan: selectedEmployee.profile?.pan || '',
          bank: {
            accountType: selectedEmployee.profile?.bank?.accountType || '',
            accountNumber: selectedEmployee.profile?.bank?.accountNumber || '',
            ifsc: selectedEmployee.profile?.bank?.ifsc || ''
          },
          emergencyContact: {
            name: selectedEmployee.profile?.emergencyContact?.name || '',
            relation: selectedEmployee.profile?.emergencyContact?.relation || '',
            phone: selectedEmployee.profile?.emergencyContact?.phone || ''
          }
        }
      });
      setIsEditingDetails(false);
      setDetailsError('');

      setPayrollSalary(selectedEmployee.profile?.salary?.toString() || (selectedEmployee.designation?.toLowerCase().includes('marketing') ? '35000' : '45000'));
      setPayrollPfContribution(selectedEmployee.profile?.pfContribution?.toString() || '1800');
      setPayrollUan(selectedEmployee.profile?.uan || '100988776655');
      setPayrollPensionStatus(selectedEmployee.profile?.pensionStatus || 'Active / Contributing');
      setIsEditingPayroll(false);
      setPayrollError('');
    }
  }, [selectedEmployee]);

  const handleSaveDetails = async () => {
    if (!selectedEmployee) return;
    setDetailsSaving(true);
    setDetailsError('');
    try {
      const updatedEmployee = await dispatch(updateEmployeeDetails({ id: selectedEmployee._id, data: editDetailsForm })).unwrap();
      setSelectedEmployee({ ...selectedEmployee, ...updatedEmployee });
      setIsEditingDetails(false);
      dispatch(fetchEmployees());
    } catch (err: any) {
      setDetailsError(err || 'Failed to update employee details');
    } finally {
      setDetailsSaving(false);
    }
  };

  const handleSavePayroll = async () => {
    if (!selectedEmployee) return;
    setPayrollSaving(true);
    setPayrollError('');
    try {
      await api.put(`/users/employees/${selectedEmployee._id}/payroll`, {
        salary: Number(payrollSalary) || 0,
        pfContribution: Number(payrollPfContribution) || 0,
        uan: payrollUan,
        pensionStatus: payrollPensionStatus,
      });
      setSelectedEmployee({
        ...selectedEmployee,
        profile: {
          ...selectedEmployee.profile,
          salary: Number(payrollSalary) || 0,
          pfContribution: Number(payrollPfContribution) || 0,
          uan: payrollUan,
          pensionStatus: payrollPensionStatus,
        }
      });
      setIsEditingPayroll(false);
      dispatch(fetchEmployees());
    } catch (err: any) {
      setPayrollError(err?.response?.data?.message || 'Failed to update employee payroll details');
    } finally {
      setPayrollSaving(false);
    }
  };

  useEffect(() => {
    dispatch(fetchEmployees());
    dispatch(fetchLeaves());
  }, [dispatch]);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === 'employeeProfileUpdated') {
        dispatch(fetchEmployees());
      }
    };

    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [dispatch]);



  useEffect(() => {
    const fetchLogs = async () => {
      if (!selectedEmployee) {
        setSelectedEmployeeLogs([]);
        setLogsError('');
        return;
      }

      setLogsLoading(true);
      setLogsError('');
      setExpandedLogId(null); // Reset expanded row when employee changes

      try {
        const response = await api.get(`/users/employees/${selectedEmployee._id}/work-logs`);
        const logs = response.data.logs || [];
        const sorted = [...logs].sort((a, b) => new Date(a.loginAt).getTime() - new Date(b.loginAt).getTime());
        setSelectedEmployeeLogs(sorted);
      } catch (err: any) {
        setLogsError(err?.response?.data?.message || 'Failed to load employee session history');
      } finally {
        setLogsLoading(false);
      }
    };

    fetchLogs();
  }, [selectedEmployee]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!form.name || !form.email || !form.password) {
      setFormError('Name, Email, and Password are required');
      return;
    }

    try {
      await dispatch(createEmployee(form)).unwrap();
      handleCloseModal();
    } catch (err: any) {
      setFormError(err || 'Failed to create employee');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setForm({ name: '', email: '', password: '', phone: '', designation: '', department: '', joiningDate: '', photo: '' });
    setShowPassword(false);
    setIsCustomDepartment(false);
    setFormError('');
  };

  const handleGeneratePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$';
    let newPassword = '';
    for (let i = 0; i < 10; i++) {
      newPassword += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setForm({ ...form, password: newPassword });
    setShowPassword(true); // Automatically show the generated password
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setFormError('Image size must be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm({ ...form, photo: reader.result as string });
        setFormError('');
      };
      reader.readAsDataURL(file);
    }
  };

  if (selectedEmployee) {
    return (
      <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
        {/* Back button */}
        <button
          type="button"
          onClick={() => setSelectedEmployee(null)}
          className="flex items-center gap-2 text-slate-500 hover:text-indigo-650 text-sm font-semibold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Staff Directory
        </button>

        {/* Profile Card Container - Full Page Style */}
        <div className="glass overflow-hidden rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800 shadow-xl shadow-slate-100/50 dark:shadow-none">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 h-32 relative flex items-end px-8 pb-4">
            {/* Profile Avatar */}
            <div className="w-24 h-24 rounded-2xl bg-white dark:bg-slate-800 border-4 border-white dark:border-slate-800 shadow-lg flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-4xl font-bold translate-y-12 overflow-hidden">
              {selectedEmployee.name.charAt(0).toUpperCase()}
            </div>

            {/* Profile Photo (Right side of banner) */}
            <div 
              className="absolute right-8 bottom-0 translate-y-12 w-24 h-24 rounded-2xl bg-white dark:bg-slate-800 border-4 border-white dark:border-slate-800 shadow-lg overflow-hidden flex items-center justify-center"
            >
              {selectedEmployee.profile?.photo ? (
                <img 
                  src={selectedEmployee.profile.photo} 
                  alt="Employee profile" 
                  className="w-full h-full object-cover animate-fade-in"
                />
              ) : (
                <div className="w-full h-full bg-slate-100 dark:bg-slate-700 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 text-[10px] font-bold text-center p-2">
                  <User className="w-8 h-8 mb-1 opacity-60 animate-pulse" />
                  No Photo
                </div>
              )}
            </div>
          </div>

          {/* Name & Title Header */}
          <div className="pt-16 px-8 pb-6 border-b border-slate-100 dark:border-slate-700/50">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{selectedEmployee.name}</h2>
                <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">{selectedEmployee.designation || 'Staff Member'}</p>
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full text-xs font-bold border border-indigo-100 dark:border-indigo-800/50 w-fit h-fit">
                <Shield className="w-3.5 h-3.5" />
                Employee Account
              </div>
            </div>
          </div>

          <div className="p-8">
            {/* Toggle Sub-tabs for Details vs Attendance vs Leaves vs Payroll */}
            <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 mb-8 max-w-2xl overflow-x-auto">
              <button
                type="button"
                onClick={() => setProfileTab('details')}
                className={cn(
                  "flex-1 min-w-[90px] flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all",
                  profileTab === 'details'
                    ? "bg-white dark:bg-slate-800 text-indigo-650 dark:text-indigo-400 shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                )}
              >
                Details
              </button>
              <button
                type="button"
                onClick={() => setProfileTab('attendance')}
                className={cn(
                  "flex-1 min-w-[100px] flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all",
                  profileTab === 'attendance'
                    ? "bg-white dark:bg-slate-800 text-indigo-650 dark:text-indigo-400 shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                )}
              >
                Attendance
              </button>
              <button
                type="button"
                onClick={() => setProfileTab('leaves')}
                className={cn(
                  "flex-1 min-w-[90px] flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all",
                  profileTab === 'leaves'
                    ? "bg-white dark:bg-slate-800 text-indigo-650 dark:text-indigo-400 shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                )}
              >
                Leaves
              </button>
              <button
                type="button"
                onClick={() => setProfileTab('payroll')}
                className={cn(
                  "flex-1 min-w-[95px] flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all",
                  profileTab === 'payroll'
                    ? "bg-white dark:bg-slate-800 text-indigo-650 dark:text-indigo-400 shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                )}
              >
                Payroll
              </button>
            </div>

            {/* Tab Content */}
            {profileTab === 'details' && (
              <div className="space-y-8 animate-fade-in">
                {/* Profile Status Banner */}
                {!selectedEmployee.profileCompleted && (
                  <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-400 rounded-2xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-semibold">
                    <div className="flex items-center gap-2">
                      <span className="text-base">⚠️</span>
                      <span>Profile setup incomplete. Click "Fill Details Now" to add/edit personal and work details.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsEditingDetails(true)}
                      className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shrink-0 self-start sm:self-auto"
                    >
                      Fill Details Now
                    </button>
                  </div>
                )}

                {/* Section 1: Work & Account Info */}
                <div className="bg-slate-50/50 dark:bg-slate-900/30 rounded-3xl p-6 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Work & Account Info</h3>
                    {!isEditingDetails ? (
                      <button
                        onClick={() => setIsEditingDetails(true)}
                        className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Edit Details
                      </button>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => setIsEditingDetails(false)}
                          disabled={detailsSaving}
                          className="text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-700 bg-slate-200 dark:bg-slate-800 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveDetails}
                          disabled={detailsSaving}
                          className="text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1.5"
                        >
                          {detailsSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                          Save Changes
                        </button>
                      </div>
                    )}
                  </div>
                  {detailsError && (
                    <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm font-medium">
                      {detailsError}
                    </div>
                  )}
                  {isEditingDetails ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase">Employee ID</label>
                        <input
                          type="text"
                          value={editDetailsForm.employeeId}
                          onChange={(e) => setEditDetailsForm(prev => ({ ...prev, employeeId: e.target.value }))}
                          className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase">Name</label>
                        <input
                          type="text"
                          value={editDetailsForm.name}
                          onChange={(e) => setEditDetailsForm(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase">Email Address</label>
                        <input
                          type="email"
                          value={editDetailsForm.email}
                          onChange={(e) => setEditDetailsForm(prev => ({ ...prev, email: e.target.value }))}
                          className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase">Phone Number</label>
                        <input
                          type="text"
                          value={editDetailsForm.phone}
                          onChange={(e) => setEditDetailsForm(prev => ({ ...prev, phone: e.target.value }))}
                          className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase">Department</label>
                        <input
                          type="text"
                          value={editDetailsForm.department}
                          onChange={(e) => setEditDetailsForm(prev => ({ ...prev, department: e.target.value }))}
                          className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase">Designation</label>
                        <input
                          type="text"
                          value={editDetailsForm.designation}
                          onChange={(e) => setEditDetailsForm(prev => ({ ...prev, designation: e.target.value }))}
                          className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase">Date of Joining</label>
                        <input
                          type="date"
                          value={editDetailsForm.joiningDate}
                          onChange={(e) => setEditDetailsForm(prev => ({ ...prev, joiningDate: e.target.value }))}
                          className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase">Initial Password</label>
                        <input
                          type="text"
                          value={editDetailsForm.password}
                          onChange={(e) => setEditDetailsForm(prev => ({ ...prev, password: e.target.value }))}
                          placeholder="Leave blank to keep unchanged"
                          className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none placeholder:text-slate-300 dark:placeholder:text-slate-600"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <ProfileFormField label="Employee ID" value={selectedEmployee.employeeId} icon={Shield} />
                    <ProfileFormField label="Email Address" value={selectedEmployee.email} icon={Mail} />
                    <ProfileFormField label="Phone Number" value={selectedEmployee.phone} icon={Phone} />
                    <ProfileFormField label="Department" value={selectedEmployee.department} icon={Building2} />
                    <ProfileFormField label="Designation" value={selectedEmployee.designation} icon={Briefcase} />
                    <ProfileFormField 
                      label="Date of Joining" 
                      value={selectedEmployee.joiningDate ? new Date(selectedEmployee.joiningDate).toLocaleDateString('en-IN', { dateStyle: 'medium' }) : ''} 
                      icon={Calendar} 
                    />
                    {selectedEmployee.profile?.generatedPassword && (
                      <ProfileFormField label="Initial Password" value={selectedEmployee.profile.generatedPassword} icon={Key} />
                    )}
                    </div>
                  )}
                </div>

                {/* Section 2: Personal Details */}
                <div className="bg-slate-50/50 dark:bg-slate-900/30 rounded-3xl p-6 border border-slate-100 dark:border-slate-800">
                  <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">Personal Details</h3>
                  {isEditingDetails ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase">Date of Birth</label>
                        <input
                          type="date"
                          value={editDetailsForm.profile.dob}
                          onChange={(e) => setEditDetailsForm(prev => ({ ...prev, profile: { ...prev.profile, dob: e.target.value } }))}
                          className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase">Gender</label>
                        <select
                          value={editDetailsForm.profile.gender}
                          onChange={(e) => setEditDetailsForm(prev => ({ ...prev, profile: { ...prev.profile, gender: e.target.value } }))}
                          className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                        >
                          <option value="">Select Gender</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <div className="sm:col-span-2 lg:col-span-3 space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase">Permanent Address</label>
                        <textarea
                          value={editDetailsForm.profile.address}
                          onChange={(e) => setEditDetailsForm(prev => ({ ...prev, profile: { ...prev.profile, address: e.target.value } }))}
                          className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none min-h-[80px]"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      <ProfileFormField label="Date of Birth" value={selectedEmployee.profile?.dob} icon={Calendar} />
                      <ProfileFormField label="Gender" value={selectedEmployee.profile?.gender} icon={User} />
                      <div className="sm:col-span-2 lg:col-span-3">
                        <ProfileFormField label="Permanent Address" value={selectedEmployee.profile?.address} icon={MapPin} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Section 3: Identification Documents */}
                <div className="bg-slate-50/50 dark:bg-slate-900/30 rounded-3xl p-6 border border-slate-100 dark:border-slate-800">
                  <h3 className="text-sm font-bold text-slate-400 dark:text-slate-505 uppercase tracking-widest mb-4">Identification Documents</h3>
                  {isEditingDetails ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase">Aadhaar Card Number</label>
                        <input
                          type="text"
                          value={editDetailsForm.profile.aadhaar}
                          onChange={(e) => setEditDetailsForm(prev => ({ ...prev, profile: { ...prev.profile, aadhaar: e.target.value } }))}
                          className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase">PAN Card Number</label>
                        <input
                          type="text"
                          value={editDetailsForm.profile.pan}
                          onChange={(e) => setEditDetailsForm(prev => ({ ...prev, profile: { ...prev.profile, pan: e.target.value.toUpperCase() } }))}
                          className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none uppercase"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <ProfileFormField 
                        label="Aadhaar Card Number" 
                        value={selectedEmployee.profile?.aadhaar || ''} 
                        icon={FileText} 
                      />
                      <ProfileFormField 
                        label="PAN Card Number" 
                        value={selectedEmployee.profile?.pan || ''} 
                        icon={FileText} 
                      />
                    </div>
                  )}
                </div>

                {/* Section 4: Bank Account Details */}
                <div className="bg-slate-50/50 dark:bg-slate-900/30 rounded-3xl p-6 border border-slate-100 dark:border-slate-800">
                  <h3 className="text-sm font-bold text-slate-400 dark:text-slate-505 uppercase tracking-widest mb-4">Bank Account Details</h3>
                  {isEditingDetails ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase">Account Type</label>
                        <select
                          value={editDetailsForm.profile.bank.accountType}
                          onChange={(e) => setEditDetailsForm(prev => ({ ...prev, profile: { ...prev.profile, bank: { ...prev.profile.bank, accountType: e.target.value } } }))}
                          className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                        >
                          <option value="">Select Type</option>
                          <option value="Savings">Savings</option>
                          <option value="Current">Current</option>
                          <option value="Salary">Salary</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase">Account Number</label>
                        <input
                          type="text"
                          value={editDetailsForm.profile.bank.accountNumber}
                          onChange={(e) => setEditDetailsForm(prev => ({ ...prev, profile: { ...prev.profile, bank: { ...prev.profile.bank, accountNumber: e.target.value } } }))}
                          className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase">IFSC Code</label>
                        <input
                          type="text"
                          value={editDetailsForm.profile.bank.ifsc}
                          onChange={(e) => setEditDetailsForm(prev => ({ ...prev, profile: { ...prev.profile, bank: { ...prev.profile.bank, ifsc: e.target.value.toUpperCase() } } }))}
                          className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none uppercase"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      <ProfileFormField label="Account Type" value={selectedEmployee.profile?.bank?.accountType} icon={Briefcase} />
                      <ProfileFormField 
                        label="Account Number" 
                        value={selectedEmployee.profile?.bank?.accountNumber || ''} 
                        icon={CreditCard} 
                      />
                      <ProfileFormField label="IFSC Code" value={selectedEmployee.profile?.bank?.ifsc} icon={Building2} />
                    </div>
                  )}
                </div>

                {/* Section 5: Emergency Contact */}
                <div className="bg-slate-50/50 dark:bg-slate-900/30 rounded-3xl p-6 border border-slate-100 dark:border-slate-800">
                  <h3 className="text-sm font-bold text-slate-400 dark:text-slate-505 uppercase tracking-widest mb-4">Emergency Contact</h3>
                  {isEditingDetails ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Contact Name</label>
                        <input
                          type="text"
                          className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                          value={editDetailsForm.profile.emergencyContact.name}
                          onChange={(e) => setEditDetailsForm({ ...editDetailsForm, profile: { ...editDetailsForm.profile, emergencyContact: { ...editDetailsForm.profile.emergencyContact, name: e.target.value } } })}
                          placeholder="Contact name"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Relationship</label>
                        <input
                          type="text"
                          className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                          value={editDetailsForm.profile.emergencyContact.relation}
                          onChange={(e) => setEditDetailsForm({ ...editDetailsForm, profile: { ...editDetailsForm.profile, emergencyContact: { ...editDetailsForm.profile.emergencyContact, relation: e.target.value } } })}
                          placeholder="Relationship"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Phone Number</label>
                        <input
                          type="text"
                          className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                          value={editDetailsForm.profile.emergencyContact.phone}
                          onChange={(e) => setEditDetailsForm({ ...editDetailsForm, profile: { ...editDetailsForm.profile, emergencyContact: { ...editDetailsForm.profile.emergencyContact, phone: e.target.value } } })}
                          placeholder="Phone number"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      <ProfileFormField label="Contact Name" value={selectedEmployee.profile?.emergencyContact?.name} icon={User} />
                      <ProfileFormField label="Relationship" value={selectedEmployee.profile?.emergencyContact?.relation} icon={Users} />
                      <ProfileFormField label="Phone Number" value={selectedEmployee.profile?.emergencyContact?.phone} icon={Phone} />
                    </div>
                  )}
                </div>
              </div>
            )}

            {profileTab === 'attendance' && (
              <div className="space-y-6 animate-fade-in">
                {/* Attendance Summary Banner */}
                <div className="rounded-3xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/30 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">Attendance Log</h3>
                    <p className="mt-1 text-sm text-slate-550 dark:text-slate-400">Recorded sessions containing work logins, logouts, work summaries and duration summary.</p>
                  </div>
                  <div className="flex gap-2.5 items-center">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Active Workdays</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  {/* Attendance Calendar Sidebar */}
                  <div className="lg:col-span-5 space-y-4">
                    <div className="glass p-6 rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800 shadow-sm">
                      {/* Calendar Header */}
                      <div className="flex items-center justify-between mb-6">
                        <button
                          type="button"
                          onClick={() => setProfileCalendarViewDate(new Date(profileCalendarViewDate.getFullYear(), profileCalendarViewDate.getMonth() - 1, 1))}
                          className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-all"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <h3 className="font-bold text-slate-850 dark:text-white text-sm">
                          {profileCalendarViewDate.toLocaleString('en-IN', { month: 'long', year: 'numeric' })}
                        </h3>
                        <button
                          type="button"
                          onClick={() => setProfileCalendarViewDate(new Date(profileCalendarViewDate.getFullYear(), profileCalendarViewDate.getMonth() + 1, 1))}
                          className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-all"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Weekdays Grid */}
                      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 uppercase mb-2">
                        <div>Su</div>
                        <div>Mo</div>
                        <div>Tu</div>
                        <div>We</div>
                        <div>Th</div>
                        <div>Fr</div>
                        <div>Sa</div>
                      </div>

                      {/* Month Days Grid */}
                      <div className="grid grid-cols-7 gap-1.5">
                        {getDaysInMonth(profileCalendarViewDate).map((dayObj, idx) => {
                          const isSelected = dayObj.date.toDateString() === profileSelectedDate.toDateString();
                          const isToday = dayObj.date.toDateString() === new Date().toDateString();
                          const hasSession = hasSessionOnDate(dayObj.date, selectedEmployeeLogs);
                          
                          return (
                            <button
                              type="button"
                              key={idx}
                              onClick={() => {
                                setProfileSelectedDate(dayObj.date);
                                setExpandedLogId(null);
                              }}
                              className={cn(
                                "h-10 relative flex flex-col items-center justify-center rounded-xl text-xs font-semibold transition-all hover:scale-105",
                                !dayObj.isCurrentMonth && "text-slate-300 dark:text-slate-600 opacity-60",
                                dayObj.isCurrentMonth && !isSelected && "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700",
                                isSelected && "bg-indigo-600 text-white shadow-md shadow-indigo-200/50 dark:shadow-none hover:bg-indigo-700",
                                isToday && !isSelected && "border border-indigo-200 text-indigo-600 dark:text-indigo-400 dark:border-indigo-800"
                              )}
                            >
                              <span>{dayObj.date.getDate()}</span>
                              {hasSession && (
                                <span className={cn(
                                  "w-1.5 h-1.5 rounded-full absolute bottom-1.5",
                                  isSelected ? "bg-white" : "bg-indigo-500"
                                )} />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="p-4 bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100/50 dark:border-indigo-850 rounded-2xl">
                      <div className="flex gap-2.5 items-start text-xs text-indigo-700 dark:text-indigo-400">
                        <span className="mt-0.5">ℹ</span>
                        <p>Click any date with a dot to view login, logout, and submitted work logs for that day.</p>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Attendance logs for Selected Date */}
                  <div className="lg:col-span-7 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/50 pb-3">
                      <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                        Logs for {profileSelectedDate.toLocaleDateString('en-IN', { dateStyle: 'long' })}
                      </h4>
                      <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                        {
                          selectedEmployeeLogs.filter(log => log.loginAt && new Date(log.loginAt).toDateString() === profileSelectedDate.toDateString()).length
                        } session(s)
                      </span>
                    </div>

                    {logsLoading ? (
                      <div className="p-12 text-center text-slate-500 dark:text-slate-400">
                        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-2" />
                        Loading attendance history...
                      </div>
                    ) : logsError ? (
                      <div className="p-12 text-center text-rose-600 dark:text-rose-400">
                        {logsError}
                      </div>
                    ) : (() => {
                      const dayLogs = selectedEmployeeLogs.filter(
                        log => log.loginAt && new Date(log.loginAt).toDateString() === profileSelectedDate.toDateString()
                      );

                      if (dayLogs.length === 0) {
                        return (
                          <div className="p-12 bg-slate-50 dark:bg-slate-900/10 border border-slate-100 dark:border-slate-800 rounded-3xl text-center text-slate-500 dark:text-slate-400">
                            No login/logout history recorded for this date.
                          </div>
                        );
                      }

                      return (
                        <div className="space-y-4">
                          {dayLogs.map((log) => {
                            const login = log.loginAt ? formatDateTime(log.loginAt) : 'Unknown';
                            const logout = log.logoutAt ? formatDateTime(log.logoutAt) : 'Still active';
                            const duration = log.loginAt && log.logoutAt
                              ? (() => {
                                  const start = new Date(log.loginAt).getTime();
                                  const end = new Date(log.logoutAt).getTime();
                                  const diff = Math.max(0, end - start);
                                  const minutes = Math.floor(diff / 60000);
                                  const hours = Math.floor(minutes / 60);
                                  const remaining = minutes % 60;
                                  return `${hours}h ${remaining}m`;
                                })()
                              : '—';

                            const isExpanded = expandedLogId === log._id;
                            const hasDetails = log.workSummary || log.gitLink || log.screenshot;

                            return (
                              <div 
                                key={log._id} 
                                className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden"
                              >
                                <div className="p-5 space-y-4">
                                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                                    <div>
                                      <span className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Login Time</span>
                                      <span className="font-bold text-slate-800 dark:text-slate-200">{login.split(', ')[1]}</span>
                                    </div>
                                    <div>
                                      <span className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Logout Time</span>
                                      <span className="font-bold text-slate-800 dark:text-slate-200">{logout.split(', ')[1] || 'Still active'}</span>
                                    </div>
                                    <div className="col-span-2 sm:col-span-1">
                                      <span className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Duration</span>
                                      <span className="font-bold text-slate-800 dark:text-slate-200 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-650 dark:text-indigo-400 px-2 py-0.5 rounded text-[11px] w-fit inline-block">
                                        {duration}
                                      </span>
                                    </div>
                                  </div>

                                  {hasDetails && (
                                    <button
                                      type="button"
                                      onClick={() => setExpandedLogId(isExpanded ? null : log._id)}
                                      className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                                    >
                                      <span>{isExpanded ? 'Hide Work Details' : 'View Submitted Work Details'}</span>
                                      <ChevronRight className={cn("w-3.5 h-3.5 transition-transform", isExpanded && "rotate-90")} />
                                    </button>
                                  )}
                                </div>

                                {isExpanded && hasDetails && (
                                  <div className="bg-slate-50/50 dark:bg-slate-900/10 border-t border-slate-100 dark:border-slate-700 p-5 space-y-4">
                                    {log.workSummary && (
                                      <div className="rounded-xl bg-white dark:bg-slate-855 p-4 border border-slate-150 dark:border-slate-750 shadow-sm">
                                        <span className="block text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Work Summary</span>
                                        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{log.workSummary}</p>
                                      </div>
                                    )}

                                    <div className="flex flex-col gap-3">
                                      {log.gitLink && (
                                        <a
                                          href={log.gitLink}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="inline-flex items-center gap-1.5 rounded-xl bg-white dark:bg-slate-855 px-4 py-2.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 border border-slate-205 dark:border-slate-750 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors w-fit"
                                        >
                                          <Link2 className="w-3.5 h-3.5" />
                                          Git Commit Link
                                        </a>
                                      )}
                                      
                                      {log.screenshot && (
                                        <div className="rounded-xl bg-white dark:bg-slate-855 border border-slate-205 dark:border-slate-755 shadow-sm overflow-hidden w-fit">
                                          <div className="px-4 py-1.5 bg-slate-50 dark:bg-slate-800 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-200 dark:border-slate-755">
                                            Screenshot Proof
                                          </div>
                                          <div className="p-3">
                                            <img
                                              src={log.screenshot}
                                              alt="Proof screenshot"
                                              className="h-28 w-40 object-cover rounded border border-slate-100 dark:border-slate-700 cursor-pointer hover:opacity-90 transition-opacity"
                                              onClick={() => window.open(log.screenshot, '_blank')}
                                            />
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            )}

            {profileTab === 'leaves' && (
              <div className="space-y-6 animate-fade-in">
                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-slate-50 dark:bg-slate-900/30 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800 shadow-sm">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block mb-1">Approved Leaves</span>
                    <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                      {leaves.filter(l => l.employeeId === selectedEmployee._id && l.status === 'Approved').length}
                    </span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900/30 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800 shadow-sm">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block mb-1">Pending Requests</span>
                    <span className="text-2xl font-black text-amber-500">
                      {leaves.filter(l => l.employeeId === selectedEmployee._id && l.status === 'Pending').length}
                    </span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900/30 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800 shadow-sm">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block mb-1">Sick Leaves</span>
                    <span className="text-2xl font-black text-indigo-500">
                      {leaves.filter(l => l.employeeId === selectedEmployee._id && l.status === 'Approved' && l.type === 'Sick').length}
                    </span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900/30 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800 shadow-sm">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block mb-1">Casual Leaves</span>
                    <span className="text-2xl font-black text-indigo-500">
                      {leaves.filter(l => l.employeeId === selectedEmployee._id && l.status === 'Approved' && l.type === 'Casual').length}
                    </span>
                  </div>
                </div>

                {/* History List */}
                <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 bg-slate-50 dark:bg-slate-700 text-slate-650 dark:text-slate-300 uppercase text-xs tracking-wider font-bold border-b border-slate-200 dark:border-slate-700">
                    Leave Request History
                  </div>

                  {(() => {
                    const empLeaves = leaves.filter(l => l.employeeId === selectedEmployee._id);
                    if (empLeaves.length === 0) {
                      return (
                        <div className="p-12 text-center text-slate-500 dark:text-slate-400">
                          No leave applications submitted by this employee.
                        </div>
                      );
                    }

                    return (
                      <div className="divide-y divide-slate-100 dark:divide-slate-700">
                        {empLeaves.map((leave) => {
                          const statusColor = leave.status === 'Approved' 
                            ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-100'
                            : leave.status === 'Rejected'
                            ? 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border-rose-100'
                            : 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border-amber-100';

                          return (
                            <div key={leave._id} className="p-6 space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-bold text-slate-900 dark:text-white">
                                  {leave.type} Leave Request
                                </span>
                                <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border", statusColor)}>
                                  {leave.status}
                                </span>
                              </div>
                              <div className="grid grid-cols-2 gap-4 text-xs">
                                <div>
                                  <span className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Start Date</span>
                                  <span className="font-bold text-slate-700 dark:text-slate-300">{leave.startDate}</span>
                                </div>
                                <div>
                                  <span className="block text-[10px] uppercase font-bold text-slate-400 mb-1">End Date</span>
                                  <span className="font-bold text-slate-700 dark:text-slate-300">{leave.endDate}</span>
                                </div>
                              </div>
                              {leave.reason && (
                                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl text-xs text-slate-600 dark:text-slate-400 italic">
                                  "{leave.reason}"
                                </div>
                              )}
                              {leave.approvedOrRejectedBy && (
                                <div className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">
                                  Reviewed by: {leave.approvedOrRejectedBy}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            {profileTab === 'payroll' && (
              <div className="space-y-8 animate-fade-in">
                {/* Header Action Bar */}
                <div className="flex justify-between items-center gap-4 bg-slate-50 dark:bg-slate-900/30 p-6 rounded-3xl border border-slate-100 dark:border-slate-800">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {isEditingPayroll ? 'Edit Payroll Settings' : 'Payroll Information'}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {isEditingPayroll 
                        ? 'Modify the salary structure, UAN, and EPF contribution profile.' 
                        : 'Review salary structure, Provident Fund profiles, and payslips.'}
                    </p>
                  </div>

                  {!isEditingPayroll ? (
                    <button
                      type="button"
                      onClick={() => {
                        setPayrollSalary(selectedEmployee.profile?.salary?.toString() || (selectedEmployee.designation?.toLowerCase().includes('marketing') ? '35000' : '45000'));
                        setPayrollPfContribution(selectedEmployee.profile?.pfContribution?.toString() || '1800');
                        setPayrollUan(selectedEmployee.profile?.uan || '100988776655');
                        setPayrollPensionStatus(selectedEmployee.profile?.pensionStatus || 'Active / Contributing');
                        setIsEditingPayroll(true);
                      }}
                      className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-1.5"
                    >
                      <Briefcase className="w-3.5 h-3.5" />
                      Edit Payroll
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={payrollSaving}
                        onClick={handleSavePayroll}
                        className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-1.5 disabled:opacity-50"
                      >
                        {payrollSaving && <Loader2 className="w-3 h-3 animate-spin" />}
                        Save Changes
                      </button>
                      <button
                        type="button"
                        disabled={payrollSaving}
                        onClick={() => setIsEditingPayroll(false)}
                        className="px-4 py-2.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>

                {payrollError && (
                  <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-xs font-semibold">
                    {payrollError}
                  </div>
                )}

                {/* Salary Info Grid */}
                <div className="bg-slate-50/50 dark:bg-slate-900/30 rounded-3xl p-6 border border-slate-100 dark:border-slate-800">
                  <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">Salary Structure</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {isEditingPayroll ? (
                      <>
                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Basic Salary (₹)</label>
                          <div className="relative flex items-center">
                            <div className="absolute left-4 text-slate-400">
                              <CreditCard className="w-4 h-4" />
                            </div>
                            <input
                              type="number"
                              value={payrollSalary}
                              onChange={(e) => setPayrollSalary(e.target.value)}
                              className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-850 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              placeholder="45000"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5 opacity-60">
                          <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">HRA Allowance (40% - Auto)</label>
                          <div className="relative flex items-center">
                            <div className="absolute left-4 text-slate-400">
                              <Building2 className="w-4 h-4" />
                            </div>
                            <input
                              type="text"
                              disabled
                              value={`₹${(Math.round((Number(payrollSalary) || 0) * 0.4)).toLocaleString('en-IN')}`}
                              className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-500 cursor-not-allowed"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5 opacity-60">
                          <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Special Allowance (15% - Auto)</label>
                          <div className="relative flex items-center">
                            <div className="absolute left-4 text-slate-400">
                              <Briefcase className="w-4 h-4" />
                            </div>
                            <input
                              type="text"
                              disabled
                              value={`₹${(Math.round((Number(payrollSalary) || 0) * 0.15)).toLocaleString('en-IN')}`}
                              className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-500 cursor-not-allowed"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Provident Fund (PF) (₹)</label>
                          <div className="relative flex items-center">
                            <div className="absolute left-4 text-slate-400">
                              <Shield className="w-4 h-4" />
                            </div>
                            <input
                              type="number"
                              value={payrollPfContribution}
                              onChange={(e) => setPayrollPfContribution(e.target.value)}
                              className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-850 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              placeholder="1800"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5 opacity-60">
                          <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Income Tax (TDS) (5% - Auto)</label>
                          <div className="relative flex items-center">
                            <div className="absolute left-4 text-slate-400">
                              <FileText className="w-4 h-4" />
                            </div>
                            <input
                              type="text"
                              disabled
                              value={`₹${(Math.round((Number(payrollSalary) || 0) * 0.05)).toLocaleString('en-IN')}`}
                              className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-500 cursor-not-allowed"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5 opacity-70">
                          <label className="block text-xs font-bold text-indigo-400 uppercase tracking-wider">Estimated Net Pay (Live Preview)</label>
                          <div className="relative flex items-center">
                            <div className="absolute left-4 text-indigo-500">
                              <CreditCard className="w-4 h-4" />
                            </div>
                            <input
                              type="text"
                              disabled
                              value={`₹${(Math.round((Number(payrollSalary) || 0) * 1.5 - (Number(payrollPfContribution) || 0))).toLocaleString('en-IN')}`}
                              className="w-full pl-11 pr-4 py-3 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800 rounded-xl text-sm font-bold text-indigo-600 dark:text-indigo-400 cursor-not-allowed"
                            />
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <ProfileFormField 
                          label="Basic Salary" 
                          value={`₹${(selectedEmployee.profile?.salary || (selectedEmployee.designation?.toLowerCase().includes('marketing') ? 35000 : 45000)).toLocaleString('en-IN')} / month`} 
                          icon={CreditCard} 
                        />
                        <ProfileFormField 
                          label="House Rent Allowance (HRA)" 
                          value={`₹${((selectedEmployee.profile?.salary || (selectedEmployee.designation?.toLowerCase().includes('marketing') ? 35000 : 45000)) * 0.4).toLocaleString('en-IN')} / month`} 
                          icon={Building2} 
                        />
                        <ProfileFormField 
                          label="Special Allowance" 
                          value={`₹${((selectedEmployee.profile?.salary || (selectedEmployee.designation?.toLowerCase().includes('marketing') ? 35000 : 45000)) * 0.15).toLocaleString('en-IN')} / month`} 
                          icon={Briefcase} 
                        />
                        <ProfileFormField 
                          label="Provident Fund Deduction (PF)" 
                          value={`₹${(selectedEmployee.profile?.pfContribution || 1800).toLocaleString('en-IN')} / month`} 
                          icon={Shield} 
                        />
                        <ProfileFormField 
                          label="Income Tax Deduction (TDS)" 
                          value={`₹${((selectedEmployee.profile?.salary || (selectedEmployee.designation?.toLowerCase().includes('marketing') ? 35000 : 45000)) * 0.05).toLocaleString('en-IN')} / month`} 
                          icon={FileText} 
                        />
                        <ProfileFormField 
                          label="Net Take-Home Pay" 
                          value={`₹${((selectedEmployee.profile?.salary || (selectedEmployee.designation?.toLowerCase().includes('marketing') ? 35000 : 45000)) * 1.5 - (selectedEmployee.profile?.pfContribution || 1800)).toLocaleString('en-IN')} / month`} 
                          icon={CreditCard} 
                        />
                      </>
                    )}
                  </div>
                </div>

                {/* Pension & PF Profile */}
                <div className="bg-slate-50/50 dark:bg-slate-900/30 rounded-3xl p-6 border border-slate-100 dark:border-slate-800">
                  <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">Pension & Provident Fund Profile</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {isEditingPayroll ? (
                      <>
                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">EPF Account Status</label>
                          <div className="relative flex items-center">
                            <div className="absolute left-4 text-slate-400">
                              <Shield className="w-4 h-4" />
                            </div>
                            <select
                              value={payrollPensionStatus}
                              onChange={(e) => setPayrollPensionStatus(e.target.value)}
                              className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
                            >
                              <option value="Active / Contributing">Active / Contributing</option>
                              <option value="Inactive">Inactive</option>
                              <option value="Suspended">Suspended</option>
                            </select>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">PF UAN Number</label>
                          <div className="relative flex items-center">
                            <div className="absolute left-4 text-slate-400">
                              <FileText className="w-4 h-4" />
                            </div>
                            <input
                              type="text"
                              value={payrollUan}
                              onChange={(e) => setPayrollUan(e.target.value)}
                              className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-805 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              placeholder="100988776655"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5 opacity-60">
                          <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Employer Contribution</label>
                          <div className="relative flex items-center">
                            <div className="absolute left-4 text-slate-400">
                              <CreditCard className="w-4 h-4" />
                            </div>
                            <input
                              type="text"
                              disabled
                              value={`₹${(Number(payrollPfContribution) || 1800).toLocaleString('en-IN')} / month`}
                              className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-500 cursor-not-allowed"
                            />
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <ProfileFormField label="EPF Account Status" value={selectedEmployee.profile?.pensionStatus || "Active / Contributing"} icon={Shield} />
                        <ProfileFormField label="PF UAN Number" value={selectedEmployee.profile?.uan || "100988776655"} icon={FileText} />
                        <ProfileFormField label="Employer Contribution" value={`₹${(selectedEmployee.profile?.pfContribution || 1800).toLocaleString('en-IN')} / month`} icon={CreditCard} />
                      </>
                    )}
                  </div>
                </div>

                {/* Payslips Download Section */}
                <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 bg-slate-50 dark:bg-slate-700 flex justify-between items-center border-b border-slate-200 dark:border-slate-700">
                    <span className="text-slate-655 dark:text-slate-300 uppercase text-xs tracking-wider font-bold">
                      Payslips History
                    </span>
                    <span className="text-[10px] font-black uppercase bg-indigo-50 dark:bg-indigo-900/30 text-indigo-650 dark:text-indigo-400 px-2 py-0.5 rounded border border-indigo-100 dark:border-indigo-900/50">
                      Admin Download Only
                    </span>
                  </div>

                  <div className="divide-y divide-slate-100 dark:divide-slate-700">
                    {['July 2026', 'June 2026', 'May 2026'].map((month, idx) => (
                      <div key={idx} className="p-6 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors">
                        <div className="space-y-1">
                          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">{month} Payslip</h4>
                          <p className="text-xs text-slate-400">Regular Salary Cycle - Bank Transfer</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => downloadPayslip(month, selectedEmployee)}
                          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-xl border border-indigo-100 dark:border-indigo-800/50 shadow-sm hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all hover:scale-105"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          Download Payslip
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

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

      {isLoading && displayEmployees.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayEmployees.map((emp) => (
              <div 
                key={emp._id} 
                onClick={() => { setSelectedEmployee(emp); setProfileTab('details'); }}
                className="glass p-6 rounded-3xl flex flex-col items-center text-center gap-4 hover:shadow-lg dark:hover:shadow-indigo-900/20 transition-all border border-transparent hover:border-indigo-200 dark:hover:border-indigo-800 cursor-pointer group"
              >
                <div className="w-16 h-16 rounded-full bg-indigo-50 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-xl font-bold group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/80 transition-colors">
                  {emp.name.charAt(0).toUpperCase()}
                </div>
                <div className="w-full">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">{emp.name}</h3>
                  <div className="flex flex-col items-center gap-1.5 mt-2">
                    <div className="flex items-center justify-center gap-1.5 text-xs text-slate-505 dark:text-slate-400">
                      <Briefcase className="w-3.5 h-3.5" />
                      {emp.designation || 'Staff'}
                    </div>
                    <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/30 px-2.5 py-1 rounded-full border border-indigo-100/50 dark:border-indigo-800/50">
                      <Shield className="w-3 h-3" />
                      {emp.role.charAt(0).toUpperCase() + emp.role.slice(1)}
                    </div>
                  </div>
                </div>
                <div className="w-full pt-4 mt-auto border-t border-slate-100 dark:border-slate-700/50 flex items-center justify-between text-indigo-600 dark:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-xs font-bold">View Profile</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            ))}
            {displayEmployees.length === 0 && !isLoading && (
              <div className="col-span-full py-12 text-center text-slate-505 dark:text-slate-400">
                No employees found. Add one to get started.
              </div>
            )}
          </div>
        )}

      {/* Add Employee Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={handleCloseModal} />
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-8 animate-fade-in custom-scrollbar">
            <div className="flex items-center justify-between mb-6 sticky top-0 bg-white dark:bg-slate-800 z-10 pb-2">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Add New Employee</h2>
                <p className="text-slate-400 dark:text-slate-500 text-sm mt-0.5">Create a new account for your staff.</p>
              </div>
              <button onClick={handleCloseModal} className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 mb-4 bg-rose-50 text-rose-600 rounded-xl text-sm font-medium">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
              {/* Profile Photo Upload */}
              <div className="flex flex-col items-center justify-center pt-2 pb-4">
                <div className="relative group cursor-pointer" onClick={() => document.getElementById('photo-upload')?.click()}>
                  <div className={`w-24 h-24 rounded-full border-2 border-dashed ${form.photo ? 'border-indigo-500' : 'border-slate-300 dark:border-slate-600'} flex items-center justify-center overflow-hidden bg-slate-50 dark:bg-slate-900/50 transition-all group-hover:border-indigo-400 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30`}>
                    {form.photo ? (
                      <img src={form.photo} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="w-8 h-8 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                    )}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <input
                    id="photo-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </div>
                <p className="text-xs text-slate-500 mt-3 font-medium">Click to upload photo</p>
              </div>

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
                      autoComplete="off"
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
                      autoComplete="new-password"
                      required
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Password *</label>
                      <button 
                        type="button" 
                        onClick={handleGeneratePassword}
                        className="text-xs font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded-md transition-colors"
                      >
                        Generate
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        className="w-full px-4 py-2.5 pr-10 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-550 outline-none transition-all"
                        autoComplete="new-password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Profile Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest opacity-50 border-b border-slate-100 dark:border-slate-700 pb-2">Profile Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-20">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Department</label>
                    <select
                      name="department"
                      value={isCustomDepartment ? 'Other' : form.department}
                      onChange={(e) => {
                        if (e.target.value === 'Other') {
                          setIsCustomDepartment(true);
                          setForm({ ...form, department: '' });
                        } else {
                          setIsCustomDepartment(false);
                          setForm({ ...form, department: e.target.value });
                        }
                      }}
                      className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    >
                      <option value="">Select Department</option>
                      <option value="Telecalling">Telecalling</option>
                      <option value="Digital Marketing">Digital Marketing</option>
                      <option value="Web Development">Web Development</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Designation</label>
                    <input
                      type="text"
                      value={form.designation}
                      onChange={(e) => setForm({ ...form, designation: e.target.value })}
                      placeholder="e.g. Senior Caller"
                      className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Phone Number</label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
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
                </div>
              </div>
              
              <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-5 py-2.5 text-sm font-semibold text-slate-655 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
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
    </div>
  );
};

export default EmployeeManagement;
