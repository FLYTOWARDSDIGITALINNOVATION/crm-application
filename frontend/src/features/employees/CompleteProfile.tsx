import React, { useState } from 'react';
import api from '../../utils/api';
import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../store';
import { refreshUser } from '../../store/slices/authSlice';

const CompleteProfile: React.FC = () => {
  const { user } = useAppSelector((s) => s.auth);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    mobile: '',
    address: '',
    pan: '',
    aadhaar: '',
    dob: '',
    gender: '',
    accountNumber: '',
    ifsc: '',
    accountType: '',
    emergencyName: '',
    emergencyRelation: '',
    emergencyPhone: '',
    designation: user?.designation || '',
    department: user?.department || '',
    joiningDate: user?.joiningDate || '',
    agreeTerms: false,
    photoFile: null as File | null,
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!form.mobile || !form.aadhaar || !form.dob || !form.gender || !form.address || !form.pan || !form.department || !form.designation || !form.joiningDate) {
      setMessage('Please fill all required fields before submitting.');
      return;
    }

    if (!form.agreeTerms) {
      setMessage('You must agree to the Terms & Policy to continue.');
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
      // Refresh local user state
      await dispatch(refreshUser());
      // Show overlay for a short moment then navigate to approval-status
      setTimeout(() => navigate('/approval-status'), 1200);
    } catch (err: any) {
      setMessage(err?.response?.data?.message || 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto glass p-8 rounded-2xl">
      <h2 className="text-xl font-bold mb-2">Complete Your Profile</h2>
      <p className="text-sm text-slate-500 mb-6">Please fill in the required details. This is required on first login.</p>

      {message && <div className="mb-4 text-sm text-slate-700">{message}</div>}

      {/* Submission overlay */}
      {submitted && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-slate-900/50" />
          <div className="relative bg-white dark:bg-slate-800 rounded-2xl p-8 max-w-lg w-full text-center shadow-2xl">
            <h3 className="text-lg font-bold mb-2">Profile Submitted</h3>
            <p className="text-sm text-slate-500">Your profile has been submitted. Please wait for Admin approval.</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium">Full Name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-2 rounded-xl border" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Email (Read only)</label>
              <input value={form.email} readOnly className="w-full px-4 py-2 rounded-xl border bg-slate-100" />
            </div>
            <div>
              <label className="block text-sm font-medium">Password (Read only)</label>
              <input value="********" readOnly className="w-full px-4 py-2 rounded-xl border bg-slate-100" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Mobile Number</label>
              <input value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} className="w-full px-4 py-2 rounded-xl border" />
            </div>
            <div>
              <label className="block text-sm font-medium">Aadhaar Number</label>
              <input value={form.aadhaar} onChange={(e) => setForm({ ...form, aadhaar: e.target.value })} className="w-full px-4 py-2 rounded-xl border" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium">Address</label>
            <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full px-4 py-2 rounded-xl border" rows={3} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium">PAN Number</label>
              <input value={form.pan} onChange={(e) => setForm({ ...form, pan: e.target.value })} className="w-full px-4 py-2 rounded-xl border" />
            </div>
            <div>
              <label className="block text-sm font-medium">Date of Birth</label>
              <input type="date" value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} className="w-full px-4 py-2 rounded-xl border" />
            </div>
            <div>
              <label className="block text-sm font-medium">Gender</label>
              <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className="w-full px-4 py-2 rounded-xl border">
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium">Account Number</label>
              <input value={form.accountNumber} onChange={(e) => setForm({ ...form, accountNumber: e.target.value })} className="w-full px-4 py-2 rounded-xl border" />
            </div>
            <div>
              <label className="block text-sm font-medium">IFSC Code</label>
              <input value={form.ifsc} onChange={(e) => setForm({ ...form, ifsc: e.target.value })} className="w-full px-4 py-2 rounded-xl border" />
            </div>
            <div>
              <label className="block text-sm font-medium">Account Type</label>
              <select value={form.accountType} onChange={(e) => setForm({ ...form, accountType: e.target.value })} className="w-full px-4 py-2 rounded-xl border">
                <option value="">Select</option>
                <option value="Savings">Savings</option>
                <option value="Current">Current</option>
                <option value="Salary">Salary</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Designation</label>
              <input value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} className="w-full px-4 py-2 rounded-xl border" />
            </div>
            <div>
              <label className="block text-sm font-medium">Department</label>
              <select value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className="w-full px-4 py-2 rounded-xl border">
                <option value="">Select Department</option>
                <option value="Digital Marketing">Digital Marketing</option>
                <option value="Web Development">Web Development</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">Joining Date</label>
              <input type="date" value={form.joiningDate} onChange={(e) => setForm({ ...form, joiningDate: e.target.value })} className="w-full px-4 py-2 rounded-xl border" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium">Profile Photo</label>
            <input type="file" accept="image/jpeg,image/png" onChange={handleFile} className="w-full" />
            <p className="text-xs text-slate-400 mt-2">Allowed: JPG, PNG. Max 5MB.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium">Emergency Contact Name</label>
              <input value={form.emergencyName} onChange={(e) => setForm({ ...form, emergencyName: e.target.value })} className="w-full px-4 py-2 rounded-xl border" />
            </div>
            <div>
              <label className="block text-sm font-medium">Relation</label>
              <input value={form.emergencyRelation} onChange={(e) => setForm({ ...form, emergencyRelation: e.target.value })} className="w-full px-4 py-2 rounded-xl border" />
            </div>
            <div>
              <label className="block text-sm font-medium">Phone</label>
              <input value={form.emergencyPhone} onChange={(e) => setForm({ ...form, emergencyPhone: e.target.value })} className="w-full px-4 py-2 rounded-xl border" />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input id="agreeTerms" type="checkbox" checked={form.agreeTerms} onChange={(e) => setForm({ ...form, agreeTerms: e.target.checked })} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
            <label htmlFor="agreeTerms" className="text-sm text-slate-600">I agree to the Terms & Policy.</label>
          </div>

          <div className="flex items-center justify-end gap-3">
            <button type="submit" disabled={loading || !form.agreeTerms} className="px-4 py-2 rounded-xl bg-indigo-600 text-white disabled:opacity-50 disabled:cursor-not-allowed">{loading ? 'Submitting...' : 'Complete Registration'}</button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CompleteProfile;
