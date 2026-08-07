import React, { useEffect, useState } from 'react';
import { Eye, X, Clock, CreditCard, Briefcase, User, ShieldCheck, Mail, CheckCircle2 } from 'lucide-react';
import api from '../../utils/api';

type Approval = {
  _id: string;
  employeeId?: string;
  name: string;
  email?: string;
  designation?: string;
  department?: string;
  joiningDate?: string;
  profile?: {
    mobile?: string;
    aadhaar?: string;
    pan?: string;
    dob?: string;
    address?: string;
    photo?: string;
    bank?: {
      accountNumber?: string;
      ifsc?: string;
      accountType?: string;
    };
    emergencyContact?: {
      name?: string;
      relation?: string;
      phone?: string;
    };
    submittedAt?: string;
  };
  approvalStatus?: string;
  createdAt?: string;
  lastLoginAt?: string | null;
  lastLogoutAt?: string | null;
};

const formatDate = (value?: string | null) => {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('en-IN', { dateStyle: 'medium' });
};

const formatDateTime = (value?: string | null) => {
  if (!value) return 'Not available';
  return new Date(value).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
};

const isOnline = (approval?: Approval | null) => {
  if (!approval?.lastLoginAt) return false;
  if (!approval.lastLogoutAt) return true;
  return new Date(approval.lastLoginAt).getTime() > new Date(approval.lastLogoutAt).getTime();
};

const getEmployeeStatus = (approvalStatus?: string) => {
  return approvalStatus === 'Approved' ? 'Active' : 'Inactive';
};

const EmployeeApprovalsAdmin: React.FC = () => {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [activeTab, setActiveTab] = useState<'All' | 'Requested' | 'Approved' | 'Rejected'>('All');
  const [loading, setLoading] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Approval | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const fetchApprovals = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users/employees');
      setApprovals(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchApprovals(); }, []);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === 'employeeProfileUpdated') {
        fetchApprovals();
      }
    };

    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const filteredApprovals = approvals.filter((approval) => {
    return !approval.approvalStatus || approval.approvalStatus === 'Pending';
  });

  const updateStatus = async (id: string, status: 'Approved' | 'Rejected') => {
    try {
      await api.patch(`/users/approvals/${id}`, { status });
      setApprovals(prev => prev.map(a => a._id === id ? { ...a, approvalStatus: status } : a));
      if (selectedEmployee?._id === id) {
        setSelectedEmployee({ ...selectedEmployee, approvalStatus: status });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const openDetails = async (approval: Approval) => {
    setSelectedEmployee(null);
    setDetailError(null);
    setDetailLoading(true);

    try {
      const res = await api.get(`/users/approvals/${approval._id}`);
      setSelectedEmployee(res.data);
    } catch (err: any) {
      setDetailError(err?.response?.data?.message || 'Failed to load employee details');
      console.error(err);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetails = () => {
    setSelectedEmployee(null);
    setDetailError(null);
    setDetailLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Employee Approvals</h2>
          <p className="mt-1 text-sm text-slate-500">Review pending employee profiles and approve or reject each request.</p>
        </div>
        <button onClick={fetchApprovals} className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800">
          Refresh
        </button>
      </div>

      {loading && (
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-slate-600">Loading employee approvals...</div>
      )}

      {!loading && approvals.length === 0 && (
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-slate-600">No employee requests found.</div>
      )}

      {approvals.length > 0 && (
        <div className="space-y-6">

          {filteredApprovals.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-slate-600">
              No records found for the selected tab.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-[2rem] border border-slate-200 bg-white shadow-sm max-w-full">
              <table className="min-w-full w-full table-auto text-left text-sm">
                <thead className="bg-slate-100 text-slate-600">
                  <tr>
                    <th className="px-4 py-4 font-medium uppercase tracking-[0.2em]">Employee ID</th>
                    <th className="px-4 py-4 font-medium uppercase tracking-[0.2em]">Employee Name</th>
                    <th className="px-4 py-4 font-medium uppercase tracking-[0.2em]">Department</th>
                    <th className="px-4 py-4 font-medium uppercase tracking-[0.2em]">Designation</th>
                    <th className="px-4 py-4 font-medium uppercase tracking-[0.2em]">Mobile Number</th>
                    <th className="px-4 py-4 font-medium uppercase tracking-[0.2em]">Approval Status</th>
                    <th className="px-4 py-4 font-medium uppercase tracking-[0.2em]">Submitted Date</th>
                    <th className="px-4 py-4 font-medium uppercase tracking-[0.2em] bg-slate-100">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApprovals.map((approval) => (
                    <tr key={approval._id} className="border-b border-slate-200 even:bg-slate-50">
                      <td className="px-4 py-4 align-top break-words max-w-[100px] text-slate-800">{approval.employeeId || '-'}</td>
                      <td className="px-4 py-4 align-top break-words text-slate-900 font-semibold">{approval.name}</td>
                      <td className="px-4 py-4 align-top break-words max-w-[120px] text-slate-600">{approval.department || '-'}</td>
                      <td className="px-4 py-4 align-top break-words max-w-[120px] text-slate-600">{approval.designation || '-'}</td>
                      <td className="px-4 py-4 align-top break-words max-w-[120px] text-slate-600">{approval.profile?.mobile || '-'}</td>
                      <td className="px-4 py-4 align-top break-words text-slate-700 font-semibold">{approval.approvalStatus || 'Pending'}</td>
                      <td className="px-4 py-4 align-top break-words text-slate-600">{formatDate(approval.profile?.submittedAt || approval.createdAt)}</td>
                      <td className="px-4 py-4 bg-white/95 shadow-sm flex flex-wrap gap-2 justify-end">
                        <button onClick={() => openDetails(approval)} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-slate-700 transition hover:border-slate-300 hover:bg-slate-50">
                          <Eye className="w-4 h-4" />
                          <span className="hidden sm:inline">View Details</span>
                        </button>
                        {approval.approvalStatus === 'Approved' ? (
                          <span className="rounded-2xl bg-emerald-100 text-emerald-700 px-3 py-2 text-sm font-semibold border border-emerald-200 flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" /> Approved
                          </span>
                        ) : (
                          <button onClick={() => updateStatus(approval._id, 'Approved')} className="rounded-2xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700">Approve</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {(detailLoading || selectedEmployee || detailError) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={closeDetails} />
          <div className="relative w-full max-w-6xl max-h-[90vh] overflow-hidden rounded-[2rem] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h3 className="text-xl font-semibold text-slate-900">Employee Profile</h3>
                <p className="mt-1 text-sm text-slate-500">Complete profile view with login history and approval controls.</p>
              </div>
              <button onClick={closeDetails} className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 transition hover:bg-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-[82vh] overflow-y-auto p-6 custom-scrollbar">
              {detailLoading && (
                <div className="flex min-h-[280px] items-center justify-center text-slate-500">Loading employee details...</div>
              )}

              {detailError && (
                <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-rose-700">{detailError}</div>
              )}

              {selectedEmployee && (
                <div className="space-y-6">
                  <div className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
                    <div className="space-y-4 rounded-[2rem] border border-slate-200 bg-slate-50 p-6">
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Employee</p>
                          <h2 className="mt-2 text-2xl font-bold text-slate-900">{selectedEmployee.name}</h2>
                          <p className="mt-1 text-sm text-slate-500">Employee ID: {selectedEmployee.employeeId || 'Not assigned'}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${isOnline(selectedEmployee) ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                            <CheckCircle2 className="w-4 h-4" />
                            {isOnline(selectedEmployee) ? 'Active now' : 'Offline'}
                          </span>
                          <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${selectedEmployee.approvalStatus === 'Approved' ? 'bg-emerald-100 text-emerald-700' : selectedEmployee.approvalStatus === 'Rejected' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                            <ShieldCheck className="w-4 h-4" />
                            {selectedEmployee.approvalStatus || 'Pending'}
                          </span>
                        </div>
                      </div>

                      <div className="grid gap-4 xl:grid-cols-3">
                        <div className="rounded-3xl border border-slate-200 bg-white p-5">
                          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Last Login</p>
                          <p className="mt-3 text-sm font-semibold text-slate-900">{selectedEmployee.lastLoginAt ? formatDateTime(selectedEmployee.lastLoginAt) : 'Not recorded'}</p>
                        </div>
                        <div className="rounded-3xl border border-slate-200 bg-white p-5">
                          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Last Logout</p>
                          <p className="mt-3 text-sm font-semibold text-slate-900">{selectedEmployee.lastLogoutAt ? formatDateTime(selectedEmployee.lastLogoutAt) : 'Not recorded'}</p>
                        </div>
                        <div className="rounded-3xl border border-slate-200 bg-white p-5">
                          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Current Status</p>
                          <p className="mt-3 text-sm font-semibold text-slate-900">{isOnline(selectedEmployee) ? 'Online' : 'Offline'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6 rounded-[2rem] border border-slate-200 bg-white p-6">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Quick actions</p>
                          <p className="mt-1 text-sm text-slate-500">Approve or reject from the profile view.</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {selectedEmployee.approvalStatus === 'Approved' ? (
                            <span className="rounded-2xl bg-emerald-100 text-emerald-700 px-4 py-2 text-sm font-semibold border border-emerald-200 flex items-center gap-1">
                              <CheckCircle2 className="w-4 h-4" /> Approved
                            </span>
                          ) : (
                            <button onClick={() => updateStatus(selectedEmployee._id, 'Approved')} className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700">Approve</button>
                          )}
                        </div>
                      </div>

                      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                        <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Approval summary</p>
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          <div>
                            <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">Submitted Date</p>
                            <p className="mt-2 font-semibold text-slate-900">{formatDateTime(selectedEmployee.profile?.submittedAt || selectedEmployee.createdAt)}</p>
                          </div>
                          <div>
                            <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">Employee Status</p>
                            <p className="mt-2 font-semibold text-slate-900">{getEmployeeStatus(selectedEmployee.approvalStatus)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-6 xl:grid-cols-2">
                    <section className="space-y-4 rounded-[2rem] border border-slate-200 bg-slate-50 p-6">
                      <div className="flex items-center gap-3">
                        <User className="w-5 h-5 text-slate-500" />
                        <h4 className="text-lg font-semibold text-slate-900">Personal Details</h4>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <DetailRow label="Full Name" value={selectedEmployee.name} />
                        <DetailRow label="DOB" value={formatDate(selectedEmployee.profile?.dob)} />
                        <DetailRow label="Email" value={selectedEmployee.email || '-'} />
                        <DetailRow label="Phone" value={selectedEmployee.profile?.mobile || '-'} />
                        <DetailRow label="Address" value={selectedEmployee.profile?.address || '-'} />
                        <DetailRow label="Aadhaar Number" value={selectedEmployee.profile?.aadhaar || '-'} />
                        <DetailRow label="PAN Number" value={selectedEmployee.profile?.pan || '-'} />
                      </div>
                    </section>

                    <section className="space-y-4 rounded-[2rem] border border-slate-200 bg-slate-50 p-6">
                      <div className="flex items-center gap-3">
                        <CreditCard className="w-5 h-5 text-slate-500" />
                        <h4 className="text-lg font-semibold text-slate-900">Banking Details</h4>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <DetailRow label="Account Number" value={selectedEmployee.profile?.bank?.accountNumber || '-'} />
                        <DetailRow label="IFSC Code" value={selectedEmployee.profile?.bank?.ifsc || '-'} />
                        <DetailRow label="Account Type" value={selectedEmployee.profile?.bank?.accountType || '-'} />
                      </div>
                    </section>
                  </div>

                  <section className="grid gap-6 rounded-[2rem] border border-slate-200 bg-slate-50 p-6 xl:grid-cols-2">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Briefcase className="w-5 h-5 text-slate-500" />
                        <h4 className="text-lg font-semibold text-slate-900">Employment Details</h4>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <DetailRow label="Employee ID" value={selectedEmployee.employeeId || '-'} />
                        <DetailRow label="Department" value={selectedEmployee.department || '-'} />
                        <DetailRow label="Designation" value={selectedEmployee.designation || '-'} />
                        <DetailRow label="Joining Date" value={formatDate(selectedEmployee.joiningDate)} />
                      </div>
                    </div>

                    <div className="space-y-4 rounded-[2rem] border border-slate-200 bg-white p-6">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-3xl bg-indigo-100 text-indigo-700">
                          <img src={selectedEmployee.profile?.photo || ''} alt="Profile" className="h-10 w-10 rounded-3xl object-cover" />
                        </span>
                        <div>
                          <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Profile Photo</p>
                          <p className="mt-2 text-base font-semibold text-slate-900">{selectedEmployee.profile?.photo ? 'Uploaded' : 'Not available'}</p>
                        </div>
                      </div>
                      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                        <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Emergency Contact</p>
                        <div className="mt-4 grid gap-4">
                          <DetailRow label="Name" value={selectedEmployee.profile?.emergencyContact?.name || '-'} />
                          <DetailRow label="Relation" value={selectedEmployee.profile?.emergencyContact?.relation || '-'} />
                          <DetailRow label="Phone" value={selectedEmployee.profile?.emergencyContact?.phone || '-'} />
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="rounded-[2rem] border border-slate-200 bg-slate-50 p-6">
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-slate-500" />
                      <h4 className="text-lg font-semibold text-slate-900">Login Details</h4>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <DetailRow label="Login Email" value={selectedEmployee.email || '-'} />
                      <DetailRow label="Last Login" value={selectedEmployee.lastLoginAt ? formatDateTime(selectedEmployee.lastLoginAt) : 'Not available'} />
                      <DetailRow label="Last Logout" value={selectedEmployee.lastLogoutAt ? formatDateTime(selectedEmployee.lastLogoutAt) : 'Not available'} />
                      <DetailRow label="Current Session" value={isOnline(selectedEmployee) ? 'Active' : 'Inactive'} />
                    </div>
                  </section>

                  <section className="rounded-[2rem] border border-slate-200 bg-slate-50 p-6">
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-slate-500" />
                      <h4 className="text-lg font-semibold text-slate-900">Approval Information</h4>
                    </div>
                    <div className="mt-5 grid gap-4 sm:grid-cols-2">
                      <DetailRow label="Submitted Date" value={formatDateTime(selectedEmployee.profile?.submittedAt || selectedEmployee.createdAt)} />
                      <DetailRow label="Approval Status" value={selectedEmployee.approvalStatus || 'Pending'} />
                      <DetailRow label="Employee Status" value={isOnline(selectedEmployee) ? 'Active' : 'Inactive'} />
                    </div>
                  </section>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const DetailRow: React.FC<{ label: string; value?: string | number | null }> = ({ label, value }) => (
  <div className="rounded-3xl bg-white p-4 shadow-sm">
    <p className="text-xs uppercase tracking-[0.24em] text-slate-400">{label}</p>
    <p className="mt-2 text-sm font-semibold text-slate-900">{value || '-'}</p>
  </div>
);

export default EmployeeApprovalsAdmin;
