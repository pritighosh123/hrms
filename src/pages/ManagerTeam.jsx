import { useCallback, useEffect, useState } from 'react';
import { employeeService } from '../services/api';

const ManagerTeam = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [revokingId, setRevokingId] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  const fetchTeam = useCallback(async () => {
    setLoading(true);
    try {
      const response = await employeeService.getMySubordinates();
      setEmployees(response.data);
    } catch (error) {
      setMessage({
        type: 'danger',
        text: error.response?.status === 404
          ? 'The running API has not loaded the manager team endpoint yet. Restart the HRMS API and try again.'
          : error.response?.data?.message || 'Could not load your team members.',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeam();
  }, [fetchTeam]);

  const handleRevoke = async (employee) => {
    const confirmed = window.confirm(
      `Remove ${employee.name} from your team? Their employee account and records will remain active.`
    );
    if (!confirmed) return;

    setRevokingId(employee.employeeId);
    setMessage({ type: '', text: '' });
    try {
      await employeeService.revokeSubordinate(employee.employeeId);
      setEmployees((current) => current.filter((item) => item.employeeId !== employee.employeeId));
      setMessage({ type: 'success', text: `${employee.name} was removed from your team.` });
    } catch (error) {
      setMessage({
        type: 'danger',
        text: error.response?.data?.message || 'Could not remove this employee from your team.',
      });
    } finally {
      setRevokingId(null);
    }
  };

  return (
    <div className="container-fluid p-4">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
        <div>
          <h2 className="fw-bold mb-1">My Team</h2>
          <p className="text-muted mb-0">View employees who report to you and manage your team assignments.</p>
        </div>
        <span className="badge bg-primary-subtle text-primary px-3 py-2">
          {employees.length} {employees.length === 1 ? 'Employee' : 'Employees'}
        </span>
      </div>

      {message.text && (
        <div className={`alert alert-${message.type} alert-dismissible fade show`} role="alert">
          {message.text}
          <button type="button" className="btn-close" onClick={() => setMessage({ type: '', text: '' })} aria-label="Close"></button>
        </div>
      )}

      <div className="card shadow-sm border-0 rounded-3">
        <div className="card-header bg-white py-3 border-bottom">
          <h5 className="mb-0 fw-bold">Direct Reports</h5>
        </div>
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>Employee</th>
                <th>Phone</th>
                <th>Department</th>
                <th>Role</th>
                <th>Joining Date</th>
                <th>Leave Balance</th>
                {/* <th className="text-end">Actions</th> */}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-5">
                    <span className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading team members...</span>
                    </span>
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-5 text-muted">
                    No employees currently report to you.
                  </td>
                </tr>
              ) : (
                employees.map((employee) => (
                  <tr key={employee.employeeId}>
                    <td>
                      <div className="fw-semibold text-dark">{employee.name}</div>
                      <div className="small text-muted">{employee.email}</div>
                    </td>
                    <td>{employee.phone || '-'}</td>
                    <td>{employee.departmentName || 'General'}</td>
                    <td><span className="badge bg-secondary">{employee.role || 'User'}</span></td>
                    <td>{employee.joiningDate ? new Date(employee.joiningDate).toLocaleDateString() : '-'}</td>
                    <td>
                      <span className="fw-semibold text-success">{employee.remainingLeaves ?? 0}</span>
                      <span className="text-muted"> / {employee.totalLeaves ?? 0}</span>
                    </td>
                    {/* <td className="text-end">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleRevoke(employee)}
                        disabled={revokingId === employee.employeeId}
                        title="Remove employee from your team"
                      >
                        {revokingId === employee.employeeId ? 'Removing...' : 'Revoke from Team'}
                      </button>
                    </td> */}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ManagerTeam;
