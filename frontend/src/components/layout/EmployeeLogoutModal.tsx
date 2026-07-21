import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, CheckCircle2, Clock3, FileText, ImageIcon, Link2, Loader2, LogOut, ShieldCheck, Sparkles, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store';
import { clearError, employeeLogout, logout } from '../../store/slices/authSlice';
import { cn } from '../../utils/cn';

interface EmployeeLogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const EmployeeLogoutModal: React.FC<EmployeeLogoutModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { error, isLoading, user } = useAppSelector((state) => state.auth);

  const [workSummary, setWorkSummary] = useState('');
  const [gitLink, setGitLink] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (!screenshot) {
      setScreenshotPreview(null);
      return;
    }

    const previewUrl = URL.createObjectURL(screenshot);
    setScreenshotPreview(previewUrl);

    return () => URL.revokeObjectURL(previewUrl);
  }, [screenshot]);

  useEffect(() => {
    if (!isOpen) {
      setWorkSummary('');
      setGitLink('');
      setScreenshot(null);
      setFormError('');
      dispatch(clearError());
    }
  }, [dispatch, isOpen]);

  if (!isOpen || user?.role !== 'employee') {
    return null;
  }

  const closeModal = () => {
    if (isLoading) return;
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!workSummary.trim() && !gitLink.trim() && !screenshot) {
      setFormError('Add a work summary, screenshot, or Git push link before logging out.');
      return;
    }

    try {
      await dispatch(
        employeeLogout({
          workSummary: workSummary.trim() || undefined,
          gitLink: gitLink.trim() || undefined,
          screenshot,
        })
      ).unwrap();

      dispatch(logout());
      onClose();
      navigate('/login');
    } catch (err: any) {
      setFormError(
        typeof err === 'string'
          ? err
          : err?.message || 'Logout failed'
      );
    }
  };

  const submitError = formError || error;

  if (typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-3 sm:p-6">
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-md" onClick={closeModal} />

      <div className="relative w-full max-w-6xl max-h-[90vh] overflow-hidden rounded-[2rem] border border-white/40 bg-white shadow-[0_30px_120px_-40px_rgba(15,23,42,0.7)] animate-fade-in">
        <div className="grid h-full lg:grid-cols-[0.9fr_1.1fr]">
          <aside className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-cyan-700 p-6 sm:p-8 text-white">
            <div className="absolute inset-0 opacity-25 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.38),_transparent_34%),radial-gradient(circle_at_bottom_left,_rgba(34,211,238,0.24),_transparent_36%)]" />
            <div className="relative flex h-full flex-col justify-between gap-8">
              <div className="space-y-6">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.35em] text-white/80">
                  <LogOut className="w-3.5 h-3.5" />
                  Employee Logout
                </span>
                <div>
                  <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
                    Share today's work before you sign out
                  </h2>
                  <p className="mt-3 max-w-md text-sm sm:text-base text-indigo-100/85 leading-6">
                    Fill in a short update, attach a screenshot or paste your Git push link, and we will save the logout time with proof.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-white">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.3em] text-white/60">Saved to database</p>
                      <p className="mt-1 text-sm text-white/90">Login time, logout time, and proof details</p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    { title: 'Summary', icon: FileText, desc: 'What you finished today' },
                    { title: 'Proof', icon: ImageIcon, desc: 'Screenshot or Git link' },
                    { title: 'Time', icon: Clock3, desc: 'Logout timestamp saved' },
                  ].map((item) => (
                    <div key={item.title} className="rounded-2xl border border-white/10 bg-white/10 p-3">
                      <item.icon className="w-5 h-5 text-cyan-200" />
                      <p className="mt-2 text-sm font-bold">{item.title}</p>
                      <p className="mt-1 text-xs leading-5 text-white/70">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          <section className="bg-slate-50/95 p-5 sm:p-8 max-h-[90vh] overflow-y-auto">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.3em] text-indigo-700">
                  <Sparkles className="w-3.5 h-3.5" />
                  Final step
                </div>
                <h3 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900">Logout details</h3>
                <p className="mt-1 text-sm text-slate-500">Complete the details below and then sign out.</p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={isLoading}
                className="rounded-xl bg-white p-2 text-slate-400 shadow-sm ring-1 ring-slate-200 transition-all hover:text-slate-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Close logout modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 pb-6">
              {submitError && (
                <div className="flex items-start gap-3 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-rose-700">
                  <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
                  <p className="text-sm font-medium">{submitError}</p>
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700">
                  Work Summary
                  <span className="ml-2 text-xs font-medium text-slate-400">(recommended)</span>
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                  <textarea
                    autoFocus
                    value={workSummary}
                    onChange={(e) => {
                      setWorkSummary(e.target.value);
                      setFormError('');
                    }}
                    rows={5}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-10 py-3 text-sm text-slate-700 outline-none transition-all focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    placeholder="Describe what you completed, fixed, or handed over today."
                  />
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-slate-700">Git Push Link</label>
                  <div className="relative">
                    <Link2 className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                    <input
                      type="url"
                      value={gitLink}
                      onChange={(e) => {
                        setGitLink(e.target.value);
                        setFormError('');
                      }}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-10 py-3 text-sm text-slate-700 outline-none transition-all focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                      placeholder="https://github.com/.../commit/..."
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-bold text-slate-700">Screenshot</label>
                  <label className="flex min-h-[58px] cursor-pointer items-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 transition-all hover:border-indigo-300 hover:bg-indigo-50/40">
                    <ImageIcon className="w-5 h-5 text-indigo-500 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-slate-700">{screenshot ? screenshot.name : 'Upload screenshot'}</p>
                      <p className="text-xs text-slate-400">PNG, JPG or JPEG</p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        setScreenshot(e.target.files?.[0] || null);
                        setFormError('');
                      }}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {screenshotPreview && (
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <img src={screenshotPreview} alt="Screenshot preview" className="h-56 w-full object-cover" />
                </div>
              )}

              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-xs font-medium text-slate-400">
                  At least one proof method is required before logout.
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={isLoading}
                    className="rounded-xl bg-white px-5 py-3 text-sm font-bold text-slate-600 shadow-sm ring-1 ring-slate-200 transition-all hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className={cn(
                      'inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition-all hover:shadow-xl hover:shadow-indigo-200 disabled:cursor-not-allowed disabled:opacity-60',
                      isLoading && 'hover:from-indigo-600 hover:to-cyan-600'
                    )}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Save & Logout
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </section>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default EmployeeLogoutModal;
