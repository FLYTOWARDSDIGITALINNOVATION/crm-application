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
    aadhaar: '',
    dob: '',
    gender: '',
    photoFile: null as File | null,
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files && e.target.files[0];
    if (f) setForm((s) => ({ ...s, photoFile: f }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const fd = new FormData();
      fd.append('name', form.name);
      fd.append('mobile', form.mobile);
      fd.append('aadhaar', form.aadhaar);
      fd.append('dob', form.dob);
      fd.append('gender', form.gender);
      if (form.photoFile) fd.append('profilePhoto', form.photoFile);

      await api.post('/users/profile', fd);

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

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Full Name</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-2 rounded-xl border" />
        </div>
        <div>
          <label className="block text-sm font-medium">Email (Read only)</label>
          <input value={form.email} readOnly className="w-full px-4 py-2 rounded-xl border bg-slate-100" />
        </div>
        <div>
          <label className="block text-sm font-medium">Mobile Number</label>
          <input value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} className="w-full px-4 py-2 rounded-xl border" />
        </div>
        <div>
          <label className="block text-sm font-medium">Aadhaar Number</label>
          <input value={form.aadhaar} onChange={(e) => setForm({ ...form, aadhaar: e.target.value })} className="w-full px-4 py-2 rounded-xl border" />
        </div>
        <div className="grid grid-cols-2 gap-4">
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
        <div>
          <label className="block text-sm font-medium">Profile Photo</label>
          <input type="file" accept="image/*" onChange={handleFile} />
        </div>

        <div className="flex items-center justify-end gap-3">
          <button type="submit" disabled={loading} className="px-4 py-2 rounded-xl bg-indigo-600 text-white">{loading ? 'Submitting...' : 'Submit'}</button>
        </div>
      </form>
    </div>
  );
};

export default CompleteProfile;
