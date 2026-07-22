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
import { useAppSelector } from './store';

function App() {
  const { user } = useAppSelector((state) => state.auth);

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
            user?.role === 'employee' ? <EmployeeDashboard /> :
            <Dashboard />
          } 
        />
        <Route path="leads" element={<LeadList />} />
        <Route path="leads/create" element={<CreateLead />} />
        <Route path="leads/:id" element={<LeadDetail />} />
        <Route path="customers" element={<CustomerList />} />
        <Route path="customers/:id" element={<CustomerDetail />} />
        <Route path="employees" element={user?.role === 'admin' ? <EmployeeManagement /> : <Navigate to="/" replace />} />
        <Route path="complete-profile" element={<CompleteProfile />} />
        <Route path="approval-status" element={<EmployeeApprovalPending />} />
        <Route path="employee-approvals" element={user?.role === 'admin' ? <EmployeeApprovalsAdmin /> : <Navigate to="/" replace />} />
        <Route path="tasks" element={<TaskList />} />
        <Route path="support" element={<SupportTickets />} />
        <Route path="projects" element={<ProjectManagement />} />
        <Route path="projects/:id" element={<ProjectDetail />} />
        <Route path="leaves" element={<LeaveManagement />} />
        <Route path="super-admin" element={user?.role === 'superadmin' ? <SuperAdminDashboard /> : <Navigate to="/" replace />} />
        <Route path="analytics" element={<Navigate to="/" replace />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
