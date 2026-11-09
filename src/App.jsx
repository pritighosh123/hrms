import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ChangePassword from './pages/ChangePassword';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import Attendance from './pages/Attendance';
import ApplyLeave from './pages/ApplyLeave';
import MyLeaves from './pages/MyLeaves';
import LeaveApproval from './pages/LeaveApproval';
import ManagerTeam from './pages/ManagerTeam';

// Layout wrapper for authenticated pages
const AppLayout = () => {
  return (
    <div className="d-flex flex-column min-vh-100 bg-light">
      <Navbar />
      <div className="d-flex flex-grow-1">
        <Sidebar />
        <main className="flex-grow-1 overflow-auto bg-light">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/attendance" element={<Attendance />} />
              <Route path="/apply-leave" element={<ApplyLeave />} />
              <Route path="/my-leaves" element={<MyLeaves />} />
              <Route path="/change-password" element={<ChangePassword />} />

              {/* Employee management is restricted to Admin and HR. */}
              <Route element={<ProtectedRoute allowedRoles={['Admin', 'HR']} />}>
                <Route path="/employees" element={<Employees />} />
              </Route>
              <Route path="/leave-approvals" element={<LeaveApproval />} />
              <Route element={<ProtectedRoute allowedRoles={['Manager']} />}>
                <Route path="/my-team" element={<ManagerTeam />} />
              </Route>
            </Route>
          </Route>

          {/* Catch-all route */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
