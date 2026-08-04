import React, { useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../../store';
import { refreshUser } from '../../store/slices/authSlice';
import { useNavigate } from 'react-router-dom';

const EmployeeApprovalPending: React.FC = () => {
  const { user } = useAppSelector((s) => s.auth);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  // Check approval status now and then every 8 seconds
  useEffect(() => {
    let mounted = true;

    const checkStatus = async () => {
      try {
        const res = await dispatch(refreshUser());
        const updated = (res as any).payload;
        if (!mounted) return;
        if (updated && updated.approvalStatus === 'Approved') {
          navigate('/');
        }
      } catch (e) {
        // ignore
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 8000);

    return () => { mounted = false; clearInterval(interval); };
  }, [dispatch, navigate]);

  return (
    <div className="max-w-2xl mx-auto glass p-8 rounded-2xl text-center">
      <h2 className="text-2xl font-bold mb-2">Account Pending Approval</h2>
      <p className="text-slate-500 mb-4">Your profile has been submitted and is awaiting admin approval.</p>
      <div className="text-left max-w-md mx-auto">
        <div className="mb-2"><strong>Name:</strong> {user?.name}</div>
        <div className="mb-2"><strong>Email:</strong> {user?.email}</div>
        <div className="mb-2"><strong>Status:</strong> {user?.approvalStatus || 'NotSubmitted'}</div>
      </div>
      <p className="text-sm text-slate-400 mt-4">You will receive a notification once your account is approved.</p>
    </div>
  );
};

export default EmployeeApprovalPending;
