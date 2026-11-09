import { useEffect, useState } from 'react';
import { employeeService, leaveService } from '../services/api';
import { useAuth } from '../context/AuthContext';

const LeaveApproval = () => {
  const { employeeId, role } = useAuth();
  const isAdminOrHr = role === 'Admin' || role === 'HR';
  const isAdmin = role === 'Admin';
  const [requests, setRequests] = useState([]);
  const [subordinateIds, setSubordinateIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [filter, setFilter] = useState(isAdminOrHr ? 'All' : 'Pending');
  const [rejectingRequest, setRejectingRequest] = useState(null);
  const [rejectionDetails, setRejectionDetails] = useState('');

  const fetchAllRequests = async () => {
    try {
      setLoading(true);
      if (isAdminOrHr) {
        const requestsRes = await leaveService.getAllRequests();
        setRequests(requestsRes.data);
        if (!isAdmin) {
          const employeesRes = await employeeService.getAll();
          setSubordinateIds(employeesRes.data
            .filter((employee) => Number(employee.reportsToEmployeeId) === Number(employeeId))
            .map((employee) => Number(employee.employeeId)));
        } else {
          setSubordinateIds([]);
        }
      } else {
        const employeesRes = await employeeService.getAll();
        const subordinateIds = employeesRes.data
          .filter((employee) => Number(employee.reportsToEmployeeId) === Number(employeeId))
          .map((employee) => Number(employee.employeeId));
        setSubordinateIds(subordinateIds);
        const subordinateRequests = await Promise.all(
          subordinateIds.map((id) => leaveService.getByEmployee(id))
        );
        setRequests(subordinateRequests.flatMap((response) => response.data));
      }
    } catch (err) {
      setMessage({
        type: 'danger',
        text: err.response?.status === 403
          ? 'Your account is not authorized to view these leave requests.'
          : 'Failed to fetch leave requests.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllRequests();
  }, [employeeId, role]);

  const handleUpdateStatus = async (leaveId, status, rejectionReason = '') => {
    if (status === 'Rejected' && !rejectionReason.trim()) {
      setMessage({ type: 'danger', text: 'Please provide details for rejecting this leave request.' });
      return;
    }
    setActionLoading(leaveId);
    setMessage({ type: '', text: '' });

    try {
      await leaveService.updateStatus(leaveId, status, rejectionReason.trim());
      setMessage({ type: 'success', text: `Leave request #${leaveId} has been ${status.toLowerCase()}!` });
      setRejectingRequest(null);
      setRejectionDetails('');
      fetchAllRequests();
    } catch (err) {
      setMessage({
        type: 'danger',
        text: err.response?.status === 403
          ? 'You are not authorized to update this leave request. Managers can only update requests from their direct reports.'
          : `Failed to update status: ${err.response?.data?.message || err.message}`,
      });
    } finally {
      setActionLoading(null);
    }
  };

  const filteredRequests = requests.filter((request) => {
    if (!isAdminOrHr) return request.status?.toLowerCase() === 'pending';
    if (filter === 'All') return true;
    return request.status?.toLowerCase() === filter.toLowerCase();
  });

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
          <h2 className="fw-bold mb-1">Leave Approvals</h2>
          <p className="text-muted mb-0">
            {isAdminOrHr
              ? 'Review, approve, or reject staff leave submissions'
              : 'Review leave requests from employees who report to you'}
          </p>
        </div>

        {/* Filter buttons */}
        {isAdminOrHr ? (
          <div className="btn-group" role="group">
            {['All', 'Pending', 'Approved', 'Rejected'].map((status) => (
              <button
                key={status}
                type="button"
                className={`btn btn-sm ${filter === status ? 'btn-primary' : 'btn-outline-secondary'}`}
                onClick={() => setFilter(status)}
              >
                {status}
              </button>
            ))}
          </div>
        ) : (
          <span className="badge bg-warning text-dark px-3 py-2">Pending</span>
        )}
      </div>

      {message.text && (
        <div className={`alert alert-${message.type} alert-dismissible fade show`} role="alert">
          {message.text}
          <button type="button" className="btn-close" onClick={() => setMessage({ type: '', text: '' })}></button>
        </div>
      )}

      {/* Requests Table */}
      <div className="card shadow-sm border-0 rounded-3">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>ID</th>
                <th>Employee</th>
                <th>From</th>
                <th>To</th>
                <th>Days</th>
                <th>Details</th>
                <th>Rejection Details</th>
                <th>Status</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading requests...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-5 text-muted">
                    No leave requests found for category: <strong>{filter}</strong>.
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req) => (
                  <tr key={req.leaveId}>
                    <td>#{req.leaveId}</td>
                    <td>
                      <div className="fw-semibold text-dark">{req.employeeName || 'Staff Member'}</div>
                      <div className="small text-muted">ID: #{req.employeeId}</div>
                    </td>
                    <td>{new Date(req.fromDate).toLocaleDateString()}</td>
                    <td>{new Date(req.toDate).toLocaleDateString()}</td>
                    <td className="fw-bold">{req.totalDays}</td>
                    <td className="small" style={{ minWidth: '220px', whiteSpace: 'pre-wrap' }}>{req.details || '—'}</td>
                    <td className="small text-danger" style={{ minWidth: '220px', whiteSpace: 'pre-wrap' }}>{req.rejectionDetails || '—'}</td>
                    <td>
                      <span className={`badge ${getStatusBadge(req.status)} px-3 py-1`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="text-end">
                      {req.status === 'Pending' && (isAdmin || subordinateIds.includes(Number(req.employeeId))) ? (
                        <div className="btn-group btn-group-sm">
                          <button
                            onClick={() => handleUpdateStatus(req.leaveId, 'Approved')}
                            className="btn btn-success d-flex align-items-center gap-1"
                            disabled={actionLoading === req.leaveId}
                          >
                            <i className="bi bi-check-lg"></i> Approve
                          </button>
                          <button
                            onClick={() => {
                              setRejectingRequest(req);
                              setRejectionDetails('');
                              setMessage({ type: '', text: '' });
                            }}
                            className="btn btn-danger d-flex align-items-center gap-1"
                            disabled={actionLoading === req.leaveId}
                          >
                            <i className="bi bi-x-lg"></i> Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-muted small">
                          {req.status === 'Pending' ? 'Manager approval required' : 'Completed'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {rejectingRequest && (
        <div className="modal show d-block" tabIndex="-1" role="dialog" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-3">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">Reject Leave Request #{rejectingRequest.leaveId}</h5>
                <button type="button" className="btn-close" onClick={() => setRejectingRequest(null)} aria-label="Close"></button>
              </div>
              <form onSubmit={(event) => {
                event.preventDefault();
                handleUpdateStatus(rejectingRequest.leaveId, 'Rejected', rejectionDetails);
              }}>
                <div className="modal-body">
                  <label className="form-label small fw-semibold" htmlFor="rejection-details">Details</label>
                  <textarea
                    id="rejection-details"
                    className="form-control"
                    rows="4"
                    maxLength="1000"
                    value={rejectionDetails}
                    onChange={(event) => setRejectionDetails(event.target.value)}
                    placeholder="Explain why this leave request is being rejected"
                    required
                  />
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setRejectingRequest(null)} disabled={actionLoading === rejectingRequest.leaveId}>Cancel</button>
                  <button type="submit" className="btn btn-danger" disabled={actionLoading === rejectingRequest.leaveId}>
                    {actionLoading === rejectingRequest.leaveId ? 'Rejecting...' : 'Reject Request'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveApproval;
