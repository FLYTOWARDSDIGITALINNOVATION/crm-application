import React, { useState } from 'react';
import api from '../../utils/api';
import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../store';
import { refreshUser } from '../../store/slices/authSlice';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '../../utils/cn';

const CompleteProfile: React.FC = () => {
  const { user } = useAppSelector((s) => s.auth);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    mobile: user?.profile?.mobile || user?.phone || '',
    address: user?.profile?.address || '',
    pan: user?.profile?.pan || '',
    aadhaar: user?.profile?.aadhaar || '',
    dob: user?.profile?.dob || '',
    gender: user?.profile?.gender || '',
    accountNumber: user?.profile?.bank?.accountNumber || '',
    ifsc: user?.profile?.bank?.ifsc || '',
    accountType: user?.profile?.bank?.accountType || 'Savings',
    emergencyName: user?.profile?.emergencyContact?.name || '',
    emergencyRelation: user?.profile?.emergencyContact?.relation || '',
    emergencyPhone: user?.profile?.emergencyContact?.phone || '',
    designation: user?.designation || '',
    department: user?.department || '',
    joiningDate: user?.joiningDate || '',
    agreeTerms: false,
    photoFile: null as File | null,
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;

    const allowedTypes = ['image/jpeg', 'image/png'];
    if (!allowedTypes.includes(f.type)) {
      setMessage('Profile photo must be JPG or PNG.');
      return;
    }

    if (f.size > 5 * 1024 * 1024) {
      setMessage('Profile photo must be smaller than 5MB.');
      return;
    }

    setMessage(null);
    setForm((s) => ({ ...s, photoFile: f }));
  };

  const validateForm = () => {
    const errs: Record<string, string> = {};
    if (!form.mobile.trim()) errs.mobile = 'Mobile number is required';
    if (!form.aadhaar.trim()) errs.aadhaar = 'Aadhaar number is required';
    if (!form.address.trim()) errs.address = 'Address is required';
    if (!form.pan.trim()) errs.pan = 'PAN number is required';
    if (!form.dob) errs.dob = 'Date of Birth is required';
    if (!form.gender) errs.gender = 'Please select Gender';
    if (!form.designation.trim()) errs.designation = 'Designation is required';
    if (!form.department.trim()) errs.department = 'Department is required';
    if (!form.joiningDate) errs.joiningDate = 'Joining date is required';
    if (!form.agreeTerms) errs.agreeTerms = 'You must agree to the Terms & Policy';

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!validateForm()) {
      setMessage('Please fill in all required fields highlighted in red below.');
      return;
    }

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('name', form.name);
      fd.append('mobile', form.mobile);
      fd.append('address', form.address);
      fd.append('pan', form.pan);
      fd.append('aadhaar', form.aadhaar);
      fd.append('dob', form.dob);
      fd.append('gender', form.gender);
      fd.append('accountNumber', form.accountNumber);
      fd.append('ifsc', form.ifsc);
      fd.append('accountType', form.accountType);
      fd.append('emergencyName', form.emergencyName);
      fd.append('emergencyRelation', form.emergencyRelation);
      fd.append('emergencyPhone', form.emergencyPhone);
      fd.append('designation', form.designation);
      fd.append('department', form.department);
      fd.append('joiningDate', form.joiningDate);
      if (form.photoFile) fd.append('profilePhoto', form.photoFile);

      await api.put('/users/profile', fd);

      setMessage('Your profile has been submitted successfully. Please wait for Admin approval.');
      setSubmitted(true);
      await dispatch(refreshUser());
      setTimeout(() => navigate('/approval-status'), 1200);
    } catch (err: any) {
      setMessage(err?.response?.data?.message || 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto glass p-8 rounded-3xl border border-slate-100 shadow-xl my-6">
      <h2 className="text-2xl font-extrabold text-slate-900 mb-1">Complete Your Profile</h2>
      <p className="text-sm text-slate-500 mb-6">Please fill in the required employee details to activate your account.</p>

      {message && (
        <div className={cn(
          "mb-6 p-4 rounded-2xl flex items-center gap-3 text-sm font-semibold border",
          submitted ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"
        )}>
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Submission overlay */}
      {submitted && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
          <div className="relative bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-2xl space-y-4 animate-scale-up">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Profile Submitted!</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Your profile details have been submitted. Redirecting to approval status page...
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Full Name *</label>
            <input 
              value={form.name} 
              onChange={(e) => setForm({ ...form, name: e.target.value })} 
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none" 
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Email (Read only)</label>
              <input value={form.email} readOnly className="w-full px-4 py-3 rounded-2xl border border-slate-100 bg-slate-100/70 text-slate-600 text-sm font-bold" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Password (Read only)</label>
              <input value="********" readOnly className="w-full px-4 py-3 rounded-2xl border border-slate-100 bg-slate-100/70 text-slate-600 text-sm font-bold" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Mobile Number *</label>
              <input 
                value={form.mobile} 
                onChange={(e) => {
                  setForm({ ...form, mobile: e.target.value });
                  if (fieldErrors.mobile) setFieldErrors({ ...fieldErrors, mobile: '' });
                }} 
                placeholder="Enter 10-digit mobile number"
                className={cn(
                  "w-full px-4 py-3 rounded-2xl border text-sm font-bold outline-none transition-all",
                  fieldErrors.mobile ? "border-rose-400 bg-rose-50/50 text-rose-900" : "border-slate-200 text-slate-800 focus:ring-2 focus:ring-indigo-500"
                )} 
              />
              {fieldErrors.mobile && <p className="text-xs text-rose-600 font-semibold mt-1">{fieldErrors.mobile}</p>}
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Aadhaar Number *</label>
              <input 
                value={form.aadhaar} 
                onChange={(e) => {
                  setForm({ ...form, aadhaar: e.target.value });
                  if (fieldErrors.aadhaar) setFieldErrors({ ...fieldErrors, aadhaar: '' });
                }} 
                placeholder="Enter 12-digit Aadhaar number"
                className={cn(
                  "w-full px-4 py-3 rounded-2xl border text-sm font-bold outline-none transition-all",
                  fieldErrors.aadhaar ? "border-rose-400 bg-rose-50/50 text-rose-900" : "border-slate-200 text-slate-800 focus:ring-2 focus:ring-indigo-500"
                )} 
              />
              {fieldErrors.aadhaar && <p className="text-xs text-rose-600 font-semibold mt-1">{fieldErrors.aadhaar}</p>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Address *</label>
            <textarea 
              value={form.address} 
              onChange={(e) => {
                setForm({ ...form, address: e.target.value });
                if (fieldErrors.address) setFieldErrors({ ...fieldErrors, address: '' });
              }} 
              placeholder="Enter full residential address"
              className={cn(
                "w-full px-4 py-3 rounded-2xl border text-sm font-bold outline-none transition-all resize-none",
                fieldErrors.address ? "border-rose-400 bg-rose-50/50 text-rose-900" : "border-slate-200 text-slate-800 focus:ring-2 focus:ring-indigo-500"
              )} 
              rows={3} 
            />
            {fieldErrors.address && <p className="text-xs text-rose-600 font-semibold mt-1">{fieldErrors.address}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">PAN Number *</label>
              <input 
                value={form.pan} 
                onChange={(e) => {
                  setForm({ ...form, pan: e.target.value });
                  if (fieldErrors.pan) setFieldErrors({ ...fieldErrors, pan: '' });
                }} 
                placeholder="ABCDE1234F"
                className={cn(
                  "w-full px-4 py-3 rounded-2xl border text-sm font-bold outline-none transition-all",
                  fieldErrors.pan ? "border-rose-400 bg-rose-50/50 text-rose-900" : "border-slate-200 text-slate-800 focus:ring-2 focus:ring-indigo-500"
                )} 
              />
              {fieldErrors.pan && <p className="text-xs text-rose-600 font-semibold mt-1">{fieldErrors.pan}</p>}
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Date of Birth *</label>
              <input 
                type="date" 
                value={form.dob} 
                onChange={(e) => {
                  setForm({ ...form, dob: e.target.value });
                  if (fieldErrors.dob) setFieldErrors({ ...fieldErrors, dob: '' });
                }} 
                className={cn(
                  "w-full px-4 py-3 rounded-2xl border text-sm font-bold outline-none transition-all",
                  fieldErrors.dob ? "border-rose-400 bg-rose-50/50 text-rose-900" : "border-slate-200 text-slate-800 focus:ring-2 focus:ring-indigo-500"
                )} 
              />
              {fieldErrors.dob && <p className="text-xs text-rose-600 font-semibold mt-1">{fieldErrors.dob}</p>}
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Gender *</label>
              <select 
                value={form.gender} 
                onChange={(e) => {
                  setForm({ ...form, gender: e.target.value });
                  if (fieldErrors.gender) setFieldErrors({ ...fieldErrors, gender: '' });
                }} 
                className={cn(
                  "w-full px-4 py-3 rounded-2xl border text-sm font-bold outline-none transition-all cursor-pointer",
                  fieldErrors.gender ? "border-rose-400 bg-rose-50/50 text-rose-900" : "border-slate-200 text-slate-800 focus:ring-2 focus:ring-indigo-500"
                )}
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
              {fieldErrors.gender && <p className="text-xs text-rose-600 font-semibold mt-1">{fieldErrors.gender}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Account Number</label>
              <input 
                value={form.accountNumber} 
                onChange={(e) => setForm({ ...form, accountNumber: e.target.value })} 
                placeholder="Bank Account Number"
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">IFSC Code</label>
              <input 
                value={form.ifsc} 
                onChange={(e) => setForm({ ...form, ifsc: e.target.value })} 
                placeholder="Bank IFSC Code"
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Account Type</label>
              <select 
                value={form.accountType} 
                onChange={(e) => setForm({ ...form, accountType: e.target.value })} 
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
              >
                <option value="Savings">Savings</option>
                <option value="Current">Current</option>
                <option value="Salary">Salary</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Designation *</label>
              <input 
                value={form.designation} 
                onChange={(e) => {
                  setForm({ ...form, designation: e.target.value });
                  if (fieldErrors.designation) setFieldErrors({ ...fieldErrors, designation: '' });
                }} 
                placeholder="Job Designation"
                className={cn(
                  "w-full px-4 py-3 rounded-2xl border text-sm font-bold outline-none transition-all",
                  fieldErrors.designation ? "border-rose-400 bg-rose-50/50 text-rose-900" : "border-slate-200 text-slate-800 focus:ring-2 focus:ring-indigo-500"
                )} 
              />
              {fieldErrors.designation && <p className="text-xs text-rose-600 font-semibold mt-1">{fieldErrors.designation}</p>}
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Department *</label>
              <select 
                value={form.department} 
                onChange={(e) => {
                  setForm({ ...form, department: e.target.value });
                  if (fieldErrors.department) setFieldErrors({ ...fieldErrors, department: '' });
                }} 
                className={cn(
                  "w-full px-4 py-3 rounded-2xl border text-sm font-bold outline-none transition-all cursor-pointer",
                  fieldErrors.department ? "border-rose-400 bg-rose-50/50 text-rose-900" : "border-slate-200 text-slate-800 focus:ring-2 focus:ring-indigo-500"
                )}
              >
                <option value="">Select Department</option>
                <option value="Telecalling">Telecalling</option>
                <option value="Digital Marketing">Digital Marketing</option>
                <option value="Web Development">Web Development</option>
              </select>
              {fieldErrors.department && <p className="text-xs text-rose-600 font-semibold mt-1">{fieldErrors.department}</p>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Joining Date *</label>
            <input 
              type="date" 
              value={form.joiningDate} 
              onChange={(e) => {
                setForm({ ...form, joiningDate: e.target.value });
                if (fieldErrors.joiningDate) setFieldErrors({ ...fieldErrors, joiningDate: '' });
              }} 
              className={cn(
                "w-full px-4 py-3 rounded-2xl border text-sm font-bold outline-none transition-all max-w-sm",
                fieldErrors.joiningDate ? "border-rose-400 bg-rose-50/50 text-rose-900" : "border-slate-200 text-slate-800 focus:ring-2 focus:ring-indigo-500"
              )} 
            />
            {fieldErrors.joiningDate && <p className="text-xs text-rose-600 font-semibold mt-1">{fieldErrors.joiningDate}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Profile Photo (Optional)</label>
            <input 
              type="file" 
              accept="image/jpeg,image/png" 
              onChange={handleFile} 
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm font-semibold file:mr-4 file:py-1.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer" 
            />
            {form.photoFile && (
              <p className="mt-1 text-xs text-emerald-600 font-bold">Selected: {form.photoFile.name}</p>
            )}
          </div>

          <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Emergency Contact (Optional)</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input 
                placeholder="Contact Name" 
                value={form.emergencyName} 
                onChange={(e) => setForm({ ...form, emergencyName: e.target.value })} 
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold outline-none" 
              />
              <input 
                placeholder="Relation" 
                value={form.emergencyRelation} 
                onChange={(e) => setForm({ ...form, emergencyRelation: e.target.value })} 
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold outline-none" 
              />
              <input 
                placeholder="Emergency Phone" 
                value={form.emergencyPhone} 
                onChange={(e) => setForm({ ...form, emergencyPhone: e.target.value })} 
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold outline-none" 
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input 
              type="checkbox" 
              id="agreeTerms" 
              checked={form.agreeTerms} 
              onChange={(e) => {
                setForm({ ...form, agreeTerms: e.target.checked });
                if (fieldErrors.agreeTerms) setFieldErrors({ ...fieldErrors, agreeTerms: '' });
              }} 
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer" 
            />
            <label htmlFor="agreeTerms" className="text-xs font-bold text-slate-700 cursor-pointer">
              I agree to the Terms & Policy.
            </label>
          </div>
          {fieldErrors.agreeTerms && <p className="text-xs text-rose-600 font-semibold">{fieldErrors.agreeTerms}</p>}

          <button 
            type="submit" 
            disabled={loading} 
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-2xl shadow-xl shadow-indigo-100 transition-all cursor-pointer disabled:opacity-50 mt-4"
          >
            {loading ? 'Submitting Registration...' : 'Complete Registration'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CompleteProfile;
