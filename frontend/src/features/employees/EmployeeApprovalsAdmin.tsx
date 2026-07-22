import React, { useEffect, useState } from 'react';
import api from '../../utils/api';

type Approval = {
  _id: string;
  name: string;
  email: string;
  department?: string;
  profile?: any;
  approvalStatus?: string;
  createdAt?: string;
};

const EmployeeApprovalsAdmin: React.FC = () => {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchApprovals = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users/approvals');
      setApprovals(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchApprovals(); }, []);

  const updateStatus = async (id: string, status: 'Approved' | 'Rejected') => {
    try {
      await api.patch(`/users/approvals/${id}`, { status });
      fetchApprovals();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Employee Approvals</h2>
      {loading && <div>Loading...</div>}
      <div className="overflow-x-auto">
        <table className="w-full table-auto text-sm border-collapse">
          <thead>
            <tr className="text-left">
              <th className="p-2">Name</th>
              <th className="p-2">Email</th>
              <th className="p-2">Department</th>
              <th className="p-2">Mobile</th>
              <th className="p-2">Aadhaar</th>
              <th className="p-2">Photo</th>
              <th className="p-2">Submitted</th>
              <th className="p-2">Status</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {approvals.map(a => (
              <tr key={a._id} className="border-t">
                <td className="p-2">{a.name}</td>
                <td className="p-2">{a.email}</td>
                <td className="p-2">{a.department || '-'}</td>
                <td className="p-2">{a.profile?.mobile || '-'}</td>
                <td className="p-2">{a.profile?.aadhaar || '-'}</td>
                <td className="p-2">{a.profile?.photo ? <img src={a.profile.photo} alt="photo" className="w-12 h-12 object-cover rounded" /> : '-'}</td>
                <td className="p-2">{a.profile?.submittedAt ? new Date(a.profile.submittedAt).toLocaleString() : '-'}</td>
                <td className="p-2">{a.approvalStatus}</td>
                <td className="p-2 space-x-2">
                  <button onClick={() => updateStatus(a._id, 'Approved')} className="px-3 py-1 bg-emerald-600 text-white rounded">Approve</button>
                  <button onClick={() => updateStatus(a._id, 'Rejected')} className="px-3 py-1 bg-rose-600 text-white rounded">Reject</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EmployeeApprovalsAdmin;
