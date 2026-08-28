import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import Dashboard from './features/analytics/Dashboard';
import LeadList from './features/leads/LeadList';
import CreateLead from './features/leads/CreateLead';
import LeadDetail from './features/leads/LeadDetail';
import CustomerList from './features/customers/CustomerList';
import CustomerDetail from './features/customers/CustomerDetail';
import TaskList from './features/tasks/TaskList';
import SupportTickets from './features/support/SupportTickets';
import Login from './features/auth/Login';
import Signup from './features/auth/Signup';
import ForgotPassword from './features/auth/ForgotPassword';
import CustomerDashboard from './features/customers/CustomerDashboard';
import EmployeeManagement from './features/employees/EmployeeManagement';
import EmployeeDashboard from './features/employees/EmployeeDashboard';
import CompleteProfile from './features/employees/CompleteProfile';
import EmployeeApprovalPending from './features/employees/EmployeeApprovalPending';
import EmployeeApprovalsAdmin from './features/employees/EmployeeApprovalsAdmin';
import ProjectManagement from './features/projects/ProjectManagement';
import ProjectDetail from './features/projects/ProjectDetail';
import LeaveManagement from './features/leaves/LeaveManagement';
import SuperAdminDashboard from './features/superadmin/SuperAdminDashboard';
import { useAppSelector, useAppDispatch } from './store';
import { useEffect } from 'react';
import { logout } from './store/slices/authSlice';

function App() {
  const { user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'FORCE_LOGOUT') {
        window.dispatchEvent(
          new CustomEvent('show_force_logout_modal', {
            detail: { message: event.data.message || 'You have been logged out by the Super Admin.' }
          })
        );
      }
    };
    
    navigator.serviceWorker.addEventListener('message', handleMessage);
    return () => navigator.serviceWorker.removeEventListener('message', handleMessage);
  }, [dispatch]);

  return (
    <Routes>
      {/* Auth routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* Main Layout wrap for authenticated routes */}
      <Route path="/" element={<MainLayout />}>
        <Route 
          index 
          element={
            user?.role === 'customer' ? <CustomerDashboard /> :
            (user?.role === 'employee' || user?.role === 'admin') ? <EmployeeDashboard /> :
            <Dashboard />
          } 
        />
        <Route path="leads" element={<LeadList />} />
        <Route path="leads/create" element={<CreateLead />} />
        <Route path="leads/:id" element={<LeadDetail />} />
        <Route path="customers" element={user?.role === 'superadmin' || user?.role === 'admin' ? <CustomerList /> : <Navigate to="/" replace />} />
        <Route path="customers/:id" element={user?.role === 'superadmin' || user?.role === 'admin' ? <CustomerDetail /> : <Navigate to="/" replace />} />
        <Route path="employees" element={user?.role === 'superadmin' || user?.role === 'admin' ? <EmployeeManagement /> : <Navigate to="/" replace />} />
        <Route path="complete-profile" element={<CompleteProfile />} />
        <Route path="approval-status" element={<EmployeeApprovalPending />} />
        <Route path="employee-approvals" element={user?.role === 'superadmin' || user?.role === 'admin' ? <EmployeeApprovalsAdmin /> : <Navigate to="/" replace />} />
        <Route path="tasks" element={<TaskList />} />
        <Route path="support" element={<SupportTickets />} />
        <Route path="projects" element={user?.role === 'superadmin' || user?.role === 'admin' ? <ProjectManagement /> : <Navigate to="/" replace />} />
        <Route path="projects/:id" element={<ProjectDetail />} />
        {/* <Route path="leaves" element={<LeaveManagement />} /> */}
        <Route path="super-admin" element={user?.role === 'superadmin' ? <SuperAdminDashboard /> : <Navigate to="/" replace />} />
        <Route path="analytics" element={<Navigate to="/" replace />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
