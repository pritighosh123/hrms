import { useEffect, useState } from 'react';
import { leaveService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const MyLeaves = () => {
  const { employeeId, role } = useAuth();
  const [requests, setRequests] = useState([]);
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const currentEmpId = employeeId || 1;

  useEffect(() => {
    const fetchLeaves = async () => {
      try {
        const [reqRes, balRes] = await Promise.all([
          leaveService.getByEmployee(currentEmpId),
          leaveService.getBalance(currentEmpId),
        ]);
        setRequests(reqRes.data);
        setBalance(balRes.data);
      } catch (err) {
        setError('Failed to fetch personal leave data.');
      } finally {
        setLoading(false);
      }
    };

    fetchLeaves();
  }, [currentEmpId]);

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return 'bg-success';
      case 'rejected':
        return 'bg-danger';
      default:
        return 'bg-warning text-dark';
    }
  };

  return (
    <div className="container-fluid p-4">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
        <div>
          <h2 className="fw-bold mb-1">My Leave Applications</h2>
          <p className="text-muted mb-0">Track all your submitted leave requests and approval status</p>
        </div>
{role !== "Admin" && (
        <Link to="/apply-leave" className="btn btn-primary d-flex align-items-center gap-2 shadow-sm">
          <i className="bi bi-calendar-plus-fill"></i> Apply for Leave
        </Link>
)}
      </div>

      {error && (
        <div className="alert alert-warning" role="alert">
          {error}
        </div>
      )}

      {/* Balance Summary Header */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-4">
          <div className="card shadow-sm border-0 p-3 text-center">
            <span className="text-muted small">Total Allocated</span>
            <span className="fs-3 fw-bold text-dark">{balance?.totalLeaves ?? 24}</span>
          </div>
        </div>
        <div className="col-12 col-sm-4">
          <div className="card shadow-sm border-0 p-3 text-center">
            <span className="text-muted small">Leaves Taken</span>
            <span className="fs-3 fw-bold text-warning">{balance?.usedLeaves ?? 0}</span>
          </div>
        </div>
        <div className="col-12 col-sm-4">
          <div className="card shadow-sm border-0 p-3 text-center">
            <span className="text-muted small">Remaining Balance</span>
            <span className="fs-3 fw-bold text-success">{balance?.remainingLeaves ?? 24}</span>
          </div>
        </div>
      </div>

      {/* Requests History Table */}
      <div className="card shadow-sm border-0 rounded-3">
        <div className="card-header bg-white py-3 border-bottom">
          <h5 className="mb-0 fw-bold">Request History</h5>
        </div>
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>Request ID</th>
                <th>From Date</th>
                <th>To Date</th>
                <th>Total Days</th>
                <th>Details</th>
                <th>Status</th>
                <th>Rejection Details</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading requests...</span>
                    </div>
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-5 text-muted">
                    No leave requests found. Click <strong>Apply for Leave</strong> to submit one.
                  </td>
                </tr>
              ) : (
                requests.map((req) => (
                  <tr key={req.leaveId}>
                    <td>#{req.leaveId}</td>
                    <td>{new Date(req.fromDate).toLocaleDateString()}</td>
                    <td>{new Date(req.toDate).toLocaleDateString()}</td>
                    <td className="fw-semibold">{req.totalDays} {req.totalDays === 1 ? 'Day' : 'Days'}</td>
                    <td className="small" style={{ whiteSpace: 'pre-wrap' }}>{req.details || '-'}</td>
                    <td>
                      <span className={`badge ${getStatusBadge(req.status)} px-3 py-1`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="small text-danger" style={{ whiteSpace: 'pre-wrap' }}>{req.rejectionDetails || '-'}</td>
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

export default MyLeaves;
