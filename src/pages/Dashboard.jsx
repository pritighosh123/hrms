import { useEffect, useState } from 'react';
import { dashboardService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { user, role } = useAuth();
  const [summary, setSummary] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [sumRes, deptRes] = await Promise.all([
          dashboardService.getSummary(),
          dashboardService.getDepartments(),
        ]);
        setSummary(sumRes.data);
        setDepartments(deptRes.data);
      } catch (err) {
        setError('Failed to fetch dashboard metrics. Ensure HRMS.API is running.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center p-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading Dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid p-4">
      {/* Welcome Banner */}
      <div className="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom">
        <div>
          <h2 className="fw-bold mb-1">Welcome back, {user?.username}!</h2>
          <p className="text-muted mb-0">Role: <span className="badge bg-primary">{role}</span></p>
        </div>
        <div className="d-flex gap-2">
          <Link to="/attendance" className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1">
            <i className="bi bi-clock"></i> Mark Attendance
          </Link>
          {role !== "Admin" && (
          <Link to="/apply-leave" className="btn btn-primary btn-sm d-flex align-items-center gap-1">
            <i className="bi bi-calendar-plus"></i> Apply Leave
          </Link>
          )}
        </div>
      </div>

      {error && (
        <div className="alert alert-warning d-flex align-items-center gap-2" role="alert">
          <i className="bi bi-exclamation-triangle-fill"></i>
          <div>{error}</div>
        </div>
      )}

      {/* Metrics Cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card shadow-sm border-0 border-start border-primary border-4 rounded-3 h-100 p-3">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <div className="text-muted small text-uppercase fw-semibold">Total Employees</div>
                <div className="fs-3 fw-bold text-dark">{summary?.totalEmployees ?? 0}</div>
              </div>
              <div className="bg-primary bg-opacity-10 text-primary p-3 rounded-circle">
                <i className="bi bi-people-fill fs-4"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card shadow-sm border-0 border-start border-success border-4 rounded-3 h-100 p-3">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <div className="text-muted small text-uppercase fw-semibold">Present Today</div>
                <div className="fs-3 fw-bold text-success">{summary?.presentToday ?? 0}</div>
              </div>
              <div className="bg-success bg-opacity-10 text-success p-3 rounded-circle">
                <i className="bi bi-check-circle-fill fs-4"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card shadow-sm border-0 border-start border-danger border-4 rounded-3 h-100 p-3">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <div className="text-muted small text-uppercase fw-semibold">Absent Today</div>
                <div className="fs-3 fw-bold text-danger">{summary?.absentToday ?? 0}</div>
              </div>
              <div className="bg-danger bg-opacity-10 text-danger p-3 rounded-circle">
                <i className="bi bi-x-circle-fill fs-4"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card shadow-sm border-0 border-start border-warning border-4 rounded-3 h-100 p-3">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <div className="text-muted small text-uppercase fw-semibold">Pending Leaves</div>
                <div className="fs-3 fw-bold text-warning">{summary?.pendingLeaveRequests ?? 0}</div>
              </div>
              <div className="bg-warning bg-opacity-10 text-warning p-3 rounded-circle">
                <i className="bi bi-hourglass-split fs-4"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Departments Breakdown */}
      <div className="row g-4">
        <div className="col-12 col-lg-8">
          <div className="card shadow-sm border-0 rounded-3">
            <div className="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
              <h5 className="mb-0 fw-bold">Department Breakdown</h5>
              <span className="badge bg-secondary">{departments.length} Departments</span>
            </div>
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Department ID</th>
                    <th>Department Name</th>
                    <th>Total Staff</th>
                  </tr>
                </thead>
                <tbody>
                  {departments.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="text-center py-4 text-muted">No departments found.</td>
                    </tr>
                  ) : (
                    departments.map((dept) => (
                      <tr key={dept.departmentId}>
                        <td>#{dept.departmentId}</td>
                        <td className="fw-semibold">{dept.departmentName}</td>
                        <td>
                          <span className="badge bg-info text-dark px-2 py-1">
                            {dept.employeeCount} {dept.employeeCount === 1 ? 'Employee' : 'Employees'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-4">
          <div className="card shadow-sm border-0 rounded-3">
            <div className="card-header bg-white py-3 border-bottom">
              <h5 className="mb-0 fw-bold">Quick Actions</h5>
            </div>
            <div className="card-body d-flex flex-column gap-2">
              <Link to="/attendance" className="btn btn-outline-secondary text-start py-2">
                <i className="bi bi-calendar-check me-2 text-primary"></i> Review Daily Attendance
              </Link>
              <Link to="/employees" className="btn btn-outline-secondary text-start py-2">
                <i className="bi bi-person-plus me-2 text-success"></i> Add New Employee
              </Link>
              <Link to="/leave-approvals" className="btn btn-outline-secondary text-start py-2">
                <i className="bi bi-card-checklist me-2 text-warning"></i> Pending Leave Approvals
              </Link>
              <Link to="/my-leaves" className="btn btn-outline-secondary text-start py-2">
                <i className="bi bi-file-earmark-text me-2 text-info"></i> View My Leave History
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
