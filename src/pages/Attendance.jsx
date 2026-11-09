import { useState, useEffect } from 'react';
import { attendanceService, employeeService } from '../services/api';
import { useAuth } from '../context/AuthContext';

const Attendance = () => {
  const { employeeId, role } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [marking, setMarking] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [markData, setMarkData] = useState({
    status: 'Present',
  });

  const fetchAttendanceByDate = async (date) => {
    setLoading(true);
    try {
      const attendanceRes = await attendanceService.getByDate(date);
      if (role === 'Admin') {
        setAttendanceRecords(attendanceRes.data);
      } else {
        const employeesRes = await employeeService.getAll();
        const visibleEmployeeIds = new Set([
          Number(employeeId),
          ...employeesRes.data
            .filter((employee) => Number(employee.reportsToEmployeeId) === Number(employeeId))
            .map((employee) => Number(employee.employeeId)),
        ]);
        setAttendanceRecords(attendanceRes.data.filter((record) => visibleEmployeeIds.has(Number(record.employeeId))));
      }
    } catch (err) {
      setMessage({ type: 'danger', text: 'Failed to fetch attendance records.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendanceByDate(selectedDate);
  }, [selectedDate, employeeId, role]);

  const handleMarkAttendance = async (e) => {
    e.preventDefault();
    if (!employeeId) {
      setMessage({ type: 'danger', text: 'Your account is not linked to an employee record.' });
      return;
    }
    setMarking(true);
    setMessage({ type: '', text: '' });

    try {
      await attendanceService.mark({
        employeeId: Number(employeeId),
        date: new Date().toISOString(),
        status: markData.status,
      });

      setMessage({ type: 'success', text: `Attendance marked as ${markData.status} successfully!` });
      fetchAttendanceByDate(selectedDate);
    } catch (err) {
      setMessage({
        type: 'danger',
        text: err.response?.data?.message || 'Failed to mark attendance. Check employee ID.',
      });
    } finally {
      setMarking(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'present':
        return 'bg-success';
      case 'absent':
        return 'bg-danger';
      case 'halfday':
        return 'bg-warning text-dark';
      case 'onleave':
        return 'bg-info text-dark';
      default:
        return 'bg-secondary';
    }
  };

  return (
    <div className="container-fluid p-4">
      <div className="mb-4">
        <h2 className="fw-bold mb-1">Attendance Management</h2>
        <p className="text-muted mb-0">Record your attendance and review your own and direct reports’ attendance logs</p>
      </div>

      {message.text && (
        <div className={`alert alert-${message.type} alert-dismissible fade show`} role="alert">
          {message.text}
          <button type="button" className="btn-close" onClick={() => setMessage({ type: '', text: '' })}></button>
        </div>
      )}

      <div className="row g-4">
        {/* Mark Attendance Card */}
        <div className="col-12 col-lg-4">
          <div className="card shadow-sm border-0 rounded-3">
            <div className="card-header bg-white py-3 border-bottom">
              <h5 className="mb-0 fw-bold">Mark Today's Attendance</h5>
            </div>
            <div className="card-body p-4">
              <form onSubmit={handleMarkAttendance}>
                <div className="mb-4">
                  <label className="form-label small fw-semibold">Attendance Status</label>
                  <select
                    className="form-select"
                    value={markData.status}
                    onChange={(e) => setMarkData({ ...markData, status: e.target.value })}
                  >
                    <option value="Present">Present</option>
                    <option value="Absent">Absent</option>
                    <option value="HalfDay">Half Day</option>
                    <option value="OnLeave">On Leave</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-100 py-2 d-flex align-items-center justify-content-center gap-2"
                  disabled={marking}
                >
                  {marking ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status"></span>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check2-circle fs-5"></i>
                      <span>Submit Attendance</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* View Attendance List */}
        <div className="col-12 col-lg-8">
          <div className="card shadow-sm border-0 rounded-3">
            <div className="card-header bg-white py-3 border-bottom d-flex flex-wrap justify-content-between align-items-center gap-2">
              <h5 className="mb-0 fw-bold">Daily Records</h5>
              <div className="d-flex align-items-center gap-2">
                <label className="small text-muted mb-0">Date:</label>
                <input
                  type="date"
                  className="form-control form-control-sm"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>
            </div>

            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    {/* <th>Record ID</th> */}
                    {/* <th>Employee ID</th> */}
                    <th>Employee Name</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="3" className="text-center py-5">
                        <div className="spinner-border text-primary" role="status">
                          <span className="visually-hidden">Loading records...</span>
                        </div>
                      </td>
                    </tr>
                  ) : attendanceRecords.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="text-center py-5 text-muted">
                        No attendance marked for {selectedDate}.
                      </td>
                    </tr>
                  ) : (
                    attendanceRecords.map((item) => (
                      <tr key={item.attendanceId}>
                        {/* <td>#{item.attendanceId}</td> */}
                        {/* <td>#{item.employeeId}</td> */}
                        <td className="fw-semibold">{item.employeeName || 'Staff Member'}</td>
                        <td>{new Date(item.date).toLocaleDateString()}</td>
                        <td>
                          <span className={`badge ${getStatusBadge(item.status)} px-3 py-1`}>
                            {item.status}
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
      </div>
    </div>
  );
};

export default Attendance;
