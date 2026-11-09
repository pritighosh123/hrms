import { useState, useEffect } from 'react';
import { leaveService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const ApplyLeave = () => {
  const { employeeId } = useAuth();
  const navigate = useNavigate();

  const [balance, setBalance] = useState(null);
  const [existingLeaves, setExistingLeaves] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [formData, setFormData] = useState({
    employeeId: employeeId || 1,
    fromDate: '',
    toDate: '',
    totalDays: 1,
    details: '',
  });

  useEffect(() => {
    const fetchEmployeeLeaveData = async () => {
      const id = parseInt(formData.employeeId, 10);
      if (!id || isNaN(id)) return;

      try {
        const [balRes, leavesRes] = await Promise.all([
          leaveService.getBalance(id),
          leaveService.getByEmployee(id),
        ]);
        setBalance(balRes.data);
        setExistingLeaves(leavesRes.data || []);
      } catch (err) {
        console.warn('Could not fetch employee leave data', err);
      }
    };

    fetchEmployeeLeaveData();
  }, [formData.employeeId]);

  // Check if requested date range overlaps with any existing non-rejected leave for this employee
  const findConflictingLeave = (startStr, endStr) => {
    if (!startStr || !endStr || !existingLeaves.length) return null;
    return existingLeaves.find((leave) => {
      if (leave.status?.toLowerCase() === 'rejected') return false;
      const existStart = leave.fromDate.substring(0, 10);
      const existEnd = leave.toDate.substring(0, 10);
      return startStr <= existEnd && endStr >= existStart;
    });
  };

  // Auto calculate total days when dates change and validate overlap
  const handleDateChange = (e) => {
    const { name, value } = e.target;
    const updated = { ...formData, [name]: value };

    if (updated.fromDate && updated.toDate) {
      if (updated.toDate < updated.fromDate) {
        updated.totalDays = 0;
        setMessage({
          type: 'danger',
          text: 'To Date cannot be earlier than From Date.',
        });
      } else {
        const start = new Date(`${updated.fromDate}T00:00:00Z`);
        const end = new Date(`${updated.toDate}T00:00:00Z`);
        let totalDays = 0;
        for (const date = new Date(start); date <= end; date.setUTCDate(date.getUTCDate() + 1)) {
          const dayOfWeek = date.getUTCDay();
          if (dayOfWeek !== 0 && dayOfWeek !== 6) totalDays += 1;
        }
        updated.totalDays = totalDays;

        const conflict = findConflictingLeave(updated.fromDate, updated.toDate);
        if (conflict) {
          setMessage({
            type: 'warning',
            text: `Validation Warning: Employee #${formData.employeeId} already has a ${conflict.status.toLowerCase()} leave request (#${conflict.leaveId}) covering ${conflict.fromDate.substring(0, 10)} to ${conflict.toDate.substring(0, 10)}.`,
          });
        } else if (message.type === 'warning' || message.type === 'danger') {
          setMessage({ type: '', text: '' });
        }
      }
    }

    setFormData(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (!formData.fromDate || !formData.toDate) {
      setMessage({ type: 'danger', text: 'Please specify both start and end dates.' });
      return;
    }

    if (!formData.details.trim()) {
      setMessage({ type: 'danger', text: 'Please provide details for your leave request.' });
      return;
    }

    if (formData.toDate < formData.fromDate) {
      setMessage({ type: 'danger', text: 'To Date cannot be earlier than From Date.' });
      return;
    }

    // Validation: same employee id and same / overlapping date range cannot apply
    const conflict = findConflictingLeave(formData.fromDate, formData.toDate);
    if (conflict) {
      setMessage({
        type: 'danger',
        text: `Cannot apply leave: A ${conflict.status.toLowerCase()} leave request (#${conflict.leaveId}) already exists for Employee #${formData.employeeId} in the selected date range (${conflict.fromDate.substring(0, 10)} to ${conflict.toDate.substring(0, 10)}).`,
      });
      return;
    }

    if (balance && formData.totalDays > balance.remainingLeaves) {
      setMessage({
        type: 'danger',
        text: `Insufficient leave balance! You have ${balance.remainingLeaves} days remaining, but requested ${formData.totalDays} days.`,
      });
      return;
    }

    setSubmitting(true);
    try {
      await leaveService.apply({
        employeeId: parseInt(formData.employeeId, 10),
        fromDate: new Date(formData.fromDate).toISOString(),
        toDate: new Date(formData.toDate).toISOString(),
        totalDays: parseInt(formData.totalDays, 10),
        details: formData.details.trim(),
      });

      setMessage({ type: 'success', text: 'Leave application submitted successfully!' });
      setTimeout(() => navigate('/my-leaves'), 1500);
    } catch (err) {
      setMessage({
        type: 'danger',
        text: err.response?.data?.message || 'Failed to submit leave request.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container-fluid p-4">
      <div className="mb-4">
        <h2 className="fw-bold mb-1">Apply for Leave</h2>
        <p className="text-muted mb-0">Submit a new leave request for supervisor approval</p>
      </div>

      {message.text && (
        <div className={`alert alert-${message.type} alert-dismissible fade show`} role="alert">
          <i className={`bi ${message.type === 'danger' ? 'bi-exclamation-triangle-fill' : message.type === 'warning' ? 'bi-exclamation-circle-fill' : 'bi-check-circle-fill'} me-2`}></i>
          {message.text}
          <button type="button" className="btn-close" onClick={() => setMessage({ type: '', text: '' })}></button>
        </div>
      )}

      <div className="row g-4">
        {/* Leave Balance Overview & Existing Requests */}
        <div className="col-12 col-md-4">
          <div className="card shadow-sm border-0 rounded-3 text-center p-4 mb-4">
            <h5 className="fw-bold text-muted mb-3">Your Leave Balance</h5>
            <div className="display-4 fw-bold text-primary mb-2">
              {balance?.remainingLeaves ?? 24}
            </div>
            <div className="text-muted small mb-4">Remaining Available Days</div>

            <div className="d-flex justify-content-around border-top pt-3">
              <div>
                <div className="fw-bold text-dark fs-5">{balance?.totalLeaves ?? 24}</div>
                <div className="text-muted small">Total Allocated</div>
              </div>
              <div className="vr"></div>
              <div>
                <div className="fw-bold text-warning fs-5">{balance?.usedLeaves ?? 0}</div>
                <div className="text-muted small">Used to Date</div>
              </div>
            </div>
          </div>

          {/* Active / Existing Leaves List */}
          {existingLeaves.length > 0 && (
            <div className="card shadow-sm border-0 rounded-3 p-3">
              <h6 className="fw-bold text-muted mb-3">
                <i className="bi bi-clock-history me-1"></i> Existing Leave Requests
              </h6>
              <div className="list-group list-group-flush small">
                {existingLeaves.slice(0, 5).map((l) => (
                  <div key={l.leaveId} className="list-group-item px-0 py-2 d-flex justify-content-between align-items-center">
                    <div>
                      <div className="fw-semibold text-dark">
                        {l.fromDate.substring(0, 10)} &rarr; {l.toDate.substring(0, 10)}
                      </div>
                      <div className="text-muted small">{l.totalDays} {l.totalDays === 1 ? 'day' : 'days'}</div>
                    </div>
                    <span
                      className={`badge ${
                        l.status === 'Approved'
                          ? 'bg-success'
                          : l.status === 'Rejected'
                          ? 'bg-danger'
                          : 'bg-warning text-dark'
                      } px-2 py-1`}
                    >
                      {l.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Application Form */}
        <div className="col-12 col-md-8">
          <div className="card shadow-sm border-0 rounded-3">
            <div className="card-header bg-white py-3 border-bottom">
              <h5 className="mb-0 fw-bold">Leave Application Form</h5>
            </div>
            <div className="card-body p-4">
              <form onSubmit={handleSubmit}>
                <div className="mb-3" style={{ display: 'none' }}>
                  <label className="form-label small fw-semibold">Employee ID</label>
                  <input
                    type="number"
                    className="form-control"
                    name="employeeId"
                    value={formData.employeeId}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                    required
                    min="1"
                  />
                </div>

                <div className="row g-3 mb-3">
                  <div className="col-12 col-sm-6">
                    <label className="form-label small fw-semibold">From Date</label>
                    <input
                      type="date"
                      className="form-control"
                      name="fromDate"
                      value={formData.fromDate}
                      onChange={handleDateChange}
                      required
                    />
                  </div>

                  <div className="col-12 col-sm-6">
                    <label className="form-label small fw-semibold">To Date</label>
                    <input
                      type="date"
                      className="form-control"
                      name="toDate"
                      value={formData.toDate}
                      onChange={handleDateChange}
                      required
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="form-label small fw-semibold">Total Days Requested</label>
                  <input
                    type="number"
                    className="form-control bg-light"
                    name="totalDays"
                    value={formData.totalDays}
                    readOnly
                  />
                </div>

                <div className="mb-4">
                  <label className="form-label small fw-semibold" htmlFor="leave-details">Details</label>
                  <textarea
                    id="leave-details"
                    className="form-control"
                    name="details"
                    rows="4"
                    maxLength="1000"
                    placeholder="Describe the reason for your leave"
                    value={formData.details}
                    onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                    required
                  />
                </div>

                <div className="d-flex justify-content-end gap-2">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => navigate('/my-leaves')}>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary px-4 d-flex align-items-center gap-2"
                    disabled={submitting}
                  >
                    {submitting && <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>}
                    <span>{submitting ? 'Submitting...' : 'Submit Request'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplyLeave;
