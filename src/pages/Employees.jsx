import { useEffect, useState } from 'react';
import { employeeService, dashboardService } from '../services/api';
import { useAuth } from '../context/AuthContext';

const isValidPhoneNumber = (phone) => {
  const value = phone.trim();
  const digits = value.replace(/\D/g, '');
  return /^\+?[\d\s().-]+$/.test(value) && digits.length >= 7 && digits.length <= 15;
};

const Employees = () => {
  const { loggedUserName, employeeId, role } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [managerAssignments, setManagerAssignments] = useState({});
  const [assigningManager, setAssigningManager] = useState(null);

  const [departments, setDepartments] = useState([
    { departmentId: 1, departmentName: 'Human Resources' },
    { departmentId: 2, departmentName: 'Information Technology' },
    { departmentId: 3, departmentName: 'Finance' },
    { departmentId: 4, departmentName: 'Operations' },
  ]);

  // Add Employee state
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'User',
    departmentId: 1,
    initialTotalLeaves: 24,
    reportsToEmployeeId: '',
  });

  // View Employee state
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewEmployee, setViewEmployee] = useState(null);

  // Edit Employee state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editEmployee, setEditEmployee] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    phone: '',
    departmentId: 1,
    reportsToEmployeeId: '',
  });
  const [editSubmitting, setEditSubmitting] = useState(false);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await employeeService.getAll();
      setEmployees(res.data);
    } catch (err) {
      setMessage({ type: 'danger', text: 'Failed to load employees list.' });
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await dashboardService.getDepartments();
      if (res.data && res.data.length > 0) {
        setDepartments(res.data);
      }
    } catch (err) {
      // Fallback to initial default departments
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchDepartments();
  }, []);

  // Add form change handler
  const handleAddChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === 'departmentId' || name === 'initialTotalLeaves'
          ? parseInt(value, 10)
          : name === 'reportsToEmployeeId'
          ? value === '' ? null : parseInt(value, 10)
          : value,
    }));
  };

  // Edit form change handler
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({
      ...prev,
      [name]:
        name === 'departmentId'
          ? parseInt(value, 10)
          : name === 'reportsToEmployeeId'
          ? value === '' ? null : parseInt(value, 10)
          : value,
    }));
  };

  // Create Employee
  const handleCreateEmployee = async (e) => {
    e.preventDefault();
    if (!formData.reportsToEmployeeId) {
      setMessage({ type: 'danger', text: 'Please select a manager in the Report To field.' });
      return;
    }
    const phone = formData.phone.trim();
    if (!isValidPhoneNumber(phone)) {
      setMessage({ type: 'danger', text: 'Enter a valid phone number with 7 to 15 digits.' });
      return;
    }
    setSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      const payload = {
        ...formData,
        phone,
        reportsToEmployeeId: formData.reportsToEmployeeId ? parseInt(formData.reportsToEmployeeId, 10) : null,
      };

      await employeeService.create(payload);
      setMessage({ type: 'success', text: 'Employee added successfully!' });
      setShowAddModal(false);
      setFormData({
        name: '',
        email: '',
        phone: '',
        role: 'User',
        departmentId: 1,
        initialTotalLeaves: 24,
        reportsToEmployeeId: '',
      });
      fetchEmployees();
    } catch (err) {
      setMessage({
        type: 'danger',
        text: err.response?.data?.message || 'Error creating employee. Ensure email is unique.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Open View Modal
  const handleView = (emp) => {
    setViewEmployee(emp);
    setShowViewModal(true);
  };

  // Open Edit Modal
  const handleEdit = (emp) => {
    setEditEmployee(emp);
    setEditFormData({
      name: emp.name || '',
      email: emp.email || '',
      phone: emp.phone || '',
      role: emp.role || 'User',
      departmentId: emp.departmentId || 1,
      initialTotalLeaves: emp.totalLeaves || 24,
      reportsToEmployeeId: emp.reportsToEmployeeId ? String(emp.reportsToEmployeeId) : '',
    });
    setShowEditModal(true);
  };

  // Submit Edit Employee
  const handleUpdateEmployee = async (e) => {
    e.preventDefault();
    if (!editEmployee) return;

    const phone = editFormData.phone.trim();
    if (!isValidPhoneNumber(phone)) {
      setMessage({ type: 'danger', text: 'Enter a valid phone number with 7 to 15 digits.' });
      return;
    }

    setEditSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      const payload = {
        name: editFormData.name.trim(),
        email: editFormData.email.trim(),
        phone,
        departmentId: parseInt(editFormData.departmentId, 10),
        role: editEmployee.role, // Role is not editable here,
        initialTotalLeaves: editFormData.initialTotalLeaves !== undefined ? parseInt(editFormData.initialTotalLeaves, 10) : undefined,

        reportsToEmployeeId: editFormData.reportsToEmployeeId ? parseInt(editFormData.reportsToEmployeeId, 10) : null,
      };

      await employeeService.update(editEmployee.employeeId, payload);
      setMessage({
        type: 'success',
        text: `Employee #${editEmployee.employeeId} (${payload.name}) updated successfully!`,
      });
      setShowEditModal(false);
      setEditEmployee(null);
      fetchEmployees();
    } catch (err) {
      setMessage({
        type: 'danger',
        text: err.response?.data?.message || 'Failed to update employee details.',
      });
    } finally {
      setEditSubmitting(false);
    }
  };

  // Delete Employee
  const handleDelete = async (id) => {
    if (role === 'Admin' && Number(id) === Number(employeeId)) {
      setMessage({ type: 'danger', text: 'You cannot delete your own Admin account.' });
      return;
    }

    if (!window.confirm(`Are you sure you want to delete employee #${id}?`)) return;

    try {
      await employeeService.delete(id);
      setMessage({ type: 'success', text: 'Employee deleted successfully!' });
      fetchEmployees();
    } catch (err) {
      setMessage({ type: 'danger', text: 'Failed to delete employee.' });
    }
  };

  const filteredEmployees = employees.filter(
    (e) =>
      e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.departmentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.reportsToEmployeeName?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const unassignedEmployees = employees.filter(
    (employee) => !employee.reportsToEmployeeId && employee.role?.toLowerCase() !== 'admin'
  );
  const managers = employees.filter((employee) => employee.role?.toLowerCase() === 'manager');

  const handleAssignManager = async (employee) => {
    const managerId = Number(managerAssignments[employee.employeeId]);
    if (!managerId) {
      setMessage({ type: 'danger', text: 'Select a manager before assigning this employee.' });
      return;
    }

    setAssigningManager(employee.employeeId);
    setMessage({ type: '', text: '' });
    try {
      await employeeService.assignManager(employee.employeeId, managerId);
      setMessage({ type: 'success', text: `${employee.name} was assigned to a manager.` });
      setManagerAssignments((current) => {
        const next = { ...current };
        delete next[employee.employeeId];
        return next;
      });
      await fetchEmployees();
    } catch (err) {
      setMessage({
        type: 'danger',
        text: err.response?.data?.message || 'Failed to assign this employee to the selected manager.',
      });
    } finally {
      setAssigningManager(null);
    }
  };

  return (
    <div className="container-fluid p-4">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
        <div>
          <h2 className="fw-bold mb-1">Employee Directory</h2>
          <p className="text-muted mb-0">
            Manage and view all registered organization staff
            {loggedUserName && ` · Signed in as ${loggedUserName}`}
          </p>
        </div>

        <button
          className="btn btn-primary d-flex align-items-center gap-2 shadow-sm"
          onClick={() => setShowAddModal(true)}
        >
          <i className="bi bi-person-plus-fill"></i> Add New Employee
        </button>
      </div>

      {message.text && (
        <div className={`alert alert-${message.type} alert-dismissible fade show`} role="alert">
          <i className={`bi ${message.type === 'danger' ? 'bi-exclamation-triangle-fill' : 'bi-check-circle-fill'} me-2`}></i>
          {message.text}
          <button type="button" className="btn-close" onClick={() => setMessage({ type: '', text: '' })}></button>
        </div>
      )}

      {/* {role === 'Admin' && (
        <div className="card shadow-sm border-0 rounded-3 mb-4">
          <div className="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
            <h5 className="mb-0 fw-bold">Unassigned Employees</h5>
            <span className="badge bg-warning text-dark">{unassignedEmployees.length}</span>
          </div>
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Assign to Manager</th>
                  <th className="text-end">Action</th>
                </tr>
              </thead>
              <tbody>
                {unassignedEmployees.length === 0 ? (
                  <tr><td colSpan="4" className="text-center text-muted py-4">All employees are assigned to a manager.</td></tr>
                ) : unassignedEmployees.map((employee) => (
                  <tr key={employee.employeeId}>
                    <td>
                      <div className="fw-semibold">{employee.name}</div>
                      <div className="small text-muted">{employee.email}</div>
                    </td>
                    <td>{employee.departmentName || 'General'}</td>
                    <td>
                      <select
                        className="form-select form-select-sm"
                        value={managerAssignments[employee.employeeId] || ''}
                        onChange={(event) => setManagerAssignments((current) => ({ ...current, [employee.employeeId]: event.target.value }))}
                        required
                      >
                        <option value="">Select a manager</option>
                        {managers
                          .filter((manager) => manager.employeeId !== employee.employeeId)
                          .map((manager) => (
                            <option key={manager.employeeId} value={manager.employeeId}>
                              {manager.name} (#{manager.employeeId})
                            </option>
                          ))}
                      </select>
                    </td>
                    <td className="text-end">
                      <button
                        type="button"
                        className="btn btn-sm btn-primary"
                        onClick={() => handleAssignManager(employee)}
                        disabled={assigningManager === employee.employeeId || !managerAssignments[employee.employeeId]}
                      >
                        {assigningManager === employee.employeeId ? 'Assigning...' : 'Assign'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )} */}

      {/* Search and Filters */}
      <div className="card shadow-sm border-0 mb-4 p-3">
        <div className="row g-2 align-items-center">
          <div className="col-12 col-md-6">
            <div className="input-group">
              <span className="input-group-text bg-white border-end-0">
                <i className="bi bi-search text-muted"></i>
              </span>
              <input
                type="text"
                className="form-control border-start-0"
                placeholder="Search by name, email, department, or manager..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="col-12 col-md-6 text-md-end text-muted small">
            Showing {filteredEmployees.length} of {employees.length} employees
          </div>
        </div>
      </div>

      {/* Employees Table */}
      <div className="card shadow-sm border-0 rounded-3">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>ID</th>
                <th>Employee Name</th>
                <th>Contact</th>
                <th>Department</th>
                <th>Reports To</th>
                <th>Joining Date</th>
                <th>Leaves (Rem / Total)</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading employees...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-5 text-muted">
                    No employees matching the criteria found.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp,index) => (
                  <tr key={emp.employeeId}>
                    <td className="fw-semibold text-muted">#{index + 1}</td>
                    <td>
                      <div className="fw-semibold text-dark">{emp.name}</div>
                      <div className="small text-muted">{emp.email}</div>
                    </td>
                    <td>{emp.phone || '-'}</td>
                    <td>
                      <span className="badge bg-secondary-subtle text-secondary px-2 py-1">
                        {emp.departmentName || 'General'}
                      </span>
                    </td>
                    <td>
                      {emp.reportsToEmployeeName ? (
                        <div className="d-flex align-items-center gap-1">
                          <i className="bi bi-person-check text-primary"></i>
                          <span className="fw-semibold text-dark small">{emp.reportsToEmployeeName}</span>
                          <span className="text-muted small">(#{emp.reportsToEmployeeId})</span>
                        </div>
                      ) : (
                        <span className="text-muted small fst-italic">None (Top Level)</span>
                      )}
                    </td>
                    <td>{new Date(emp.joiningDate).toLocaleDateString()}</td>
                    <td>
                      <span className="fw-semibold text-success">{emp.remainingLeaves ?? 0}</span>
                      <span className="text-muted"> / {emp.totalLeaves ?? 0}</span>
                    </td>
                    <td className="text-end text-nowrap">
                      <div className="btn-group btn-group-sm" role="group">
                        <button
                          onClick={() => handleView(emp)}
                          className="btn btn-outline-info"
                          title="View Details"
                        >
                          <i className="bi bi-eye"></i>
                        </button>
                        <button
                          onClick={() => handleEdit(emp)}
                          className="btn btn-outline-primary"
                          title="Edit Employee"
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button
                          onClick={() => handleDelete(emp.employeeId)}
                          className="btn btn-outline-danger"
                          title={role === 'Admin' && Number(emp.employeeId) === Number(employeeId) ? 'You cannot delete your own Admin account' : 'Delete Employee'}
                          disabled={role === 'Admin' && Number(emp.employeeId) === Number(employeeId)}
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Employee Modal */}
      {showViewModal && viewEmployee && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-3">
              <div className="modal-header border-bottom bg-light">
                <div className="d-flex align-items-center gap-2">
                  <div className="bg-info-subtle text-info rounded-circle d-flex align-items-center justify-content-center" style={{ width: '38px', height: '38px' }}>
                    <i className="bi bi-person-vcard fs-5"></i>
                  </div>
                  <div>
                    <h5 className="modal-title fw-bold mb-0">Employee Profile</h5>
                    <small className="text-muted">ID: #{viewEmployee.employeeId}</small>
                  </div>
                </div>
                <button type="button" className="btn-close" onClick={() => setShowViewModal(false)}></button>
              </div>

              <div className="modal-body p-4">
                <div className="d-flex align-items-center gap-3 mb-4 p-3 bg-light rounded-3">
                  <div
                    className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold fs-4"
                    style={{ width: '56px', height: '56px' }}
                  >
                    {viewEmployee.name?.charAt(0)?.toUpperCase() || 'E'}
                  </div>
                  <div>
                    <h5 className="fw-bold mb-1 text-dark">{viewEmployee.name}</h5>
                    <div className="text-muted small">{viewEmployee.email}</div>
                    <span className="badge bg-primary-subtle text-primary mt-1">
                      {viewEmployee.departmentName || 'General Department'}
                    </span>
                  </div>
                </div>

                <div className="row g-3">
                  <div className="col-6">
                    <label className="text-muted small fw-semibold">Phone Number</label>
                    <div className="fw-semibold text-dark">{viewEmployee.phone || 'Not provided'}</div>
                  </div>

                  <div className="col-6">
                    <label className="text-muted small fw-semibold">Joining Date</label>
                    <div className="fw-semibold text-dark">
                      {viewEmployee.joiningDate ? new Date(viewEmployee.joiningDate).toLocaleDateString() : 'N/A'}
                    </div>
                  </div>

                  <div className="col-12">
                    <label className="text-muted small fw-semibold">Reports To (Supervisor / Manager)</label>
                    <div className="fw-semibold text-dark d-flex align-items-center gap-2">
                      {viewEmployee.reportsToEmployeeName ? (
                        <>
                          <i className="bi bi-person-check-fill text-primary"></i>
                          <span>{viewEmployee.reportsToEmployeeName}</span>
                          <span className="badge bg-light text-muted border">ID: #{viewEmployee.reportsToEmployeeId}</span>
                        </>
                      ) : (
                        <span className="text-muted fst-italic">None (Top-Level Management)</span>
                      )}
                    </div>
                  </div>

                  <div className="col-6">
                    <label className="text-muted small fw-semibold">Linked User Account</label>
                    <div className="fw-semibold text-dark">
                      {viewEmployee.username || viewEmployee.email}
                    </div>
                  </div>

                  <div className="col-6">
                    <label className="text-muted small fw-semibold">System Role</label>
                    <div>
                      <span className="badge bg-secondary">
                        {viewEmployee.role || 'Employee'}
                      </span>
                    </div>
                  </div>
                </div>

                <hr className="my-3" />

                <h6 className="fw-bold text-muted small text-uppercase mb-3">Leave Balance Statistics</h6>
                <div className="row g-2 text-center">
                  <div className="col-4">
                    <div className="p-2 border rounded bg-light">
                      <div className="text-muted small">Total Allocated</div>
                      <div className="fs-5 fw-bold text-dark">{viewEmployee.totalLeaves ?? 24}</div>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="p-2 border rounded bg-light">
                      <div className="text-muted small">Leaves Taken</div>
                      <div className="fs-5 fw-bold text-warning">{viewEmployee.usedLeaves ?? 0}</div>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="p-2 border rounded bg-light">
                      <div className="text-muted small">Remaining</div>
                      <div className="fs-5 fw-bold text-success">{viewEmployee.remainingLeaves ?? 24}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer border-top">
                <button
                  type="button"
                  className="btn btn-primary d-flex align-items-center gap-1"
                  onClick={() => {
                    setShowViewModal(false);
                    handleEdit(viewEmployee);
                  }}
                >
                  <i className="bi bi-pencil"></i> Edit Details
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowViewModal(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Employee Modal */}
      {showEditModal && editEmployee && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered  modal-dialog-scrollable modal-lg">
            <div className="modal-content border-0 shadow-lg rounded-3">
              <div className="modal-header border-bottom">
                <div className="d-flex align-items-center gap-2">
                  <div className="bg-primary-subtle text-primary rounded-circle d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px' }}>
                    <i className="bi bi-pencil-square fs-5"></i>
                  </div>
                  <h5 className="modal-title fw-bold mb-0">Edit Employee #{editEmployee.employeeId}</h5>
                </div>
                <button type="button" className="btn-close" onClick={() => setShowEditModal(false)}></button>
              </div>

              <form onSubmit={handleUpdateEmployee}>
                <div className="modal-body p-4">
                  <div className="row g-3">
                  <div className="col-12 col-md-6">
                    <label className="form-label small fw-semibold">Full Name</label>
                    <input
                      type="text"
                      className="form-control"
                      name="name"
                      value={editFormData.name}
                      onChange={handleEditChange}
                      required
                    />
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-label small fw-semibold">Email Address</label>
                    <input
                      type="email"
                      className="form-control"
                      name="email"
                      value={editFormData.email}
                      onChange={handleEditChange}
                      required
                    />
                    <div className="form-text small">Updating email keeps login username in sync</div>
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-label small fw-semibold">Phone Number</label>
                    <input
                      type="tel"
                      className="form-control"
                      name="phone"
                      value={editFormData.phone}
                      onChange={handleEditChange}
                      placeholder="e.g. +1 555-0199"
                      required
                      maxLength="20"
                      title="Enter 7 to 15 digits. A leading +, spaces, hyphens, parentheses, and periods are allowed."
                    />
                    <div className="form-text small">Enter 7 to 15 digits; common phone formatting is allowed.</div>
                  </div>

                {editEmployee.role?.toLowerCase() !== 'admin' && (
                  <div className="col-12 col-md-6">
                    <label className="form-label small fw-semibold">Role</label>
                    <select className="form-select" name="role" value={editFormData.role} onChange={handleEditChange} required>
                      <option value="Manager">Manager</option>
                      <option value="User">User</option>
                    </select>
                  </div>
                )}

                  <div className="col-12 col-md-6">
                    <label className="form-label small fw-semibold">Department</label>
                    <select
                      className="form-select"
                      name="departmentId"
                      value={editFormData.departmentId}
                      onChange={handleEditChange}
                    >
                      {departments.map((dept) => (
                        <option key={dept.departmentId} value={dept.departmentId}>
                          {dept.departmentName}
                        </option>
                      ))}
                    </select>
                  </div>
                
                  {editEmployee.role?.toLowerCase() !== 'admin' && (
                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-semibold">Initial Leaves</label>
                      <input
                        type="number"
                        className="form-control"
                        name="initialTotalLeaves"
                        value={editFormData.initialTotalLeaves}
                        onChange={handleEditChange}
                        min="0"
                        max="50"
                      />
                  </div>
                  )}

                  <div className="col-12">
                    <label className="form-label small fw-semibold">Report To (Manager)</label>
                    <select
                      className="form-select"
                      name="reportsToEmployeeId"
                      value={editFormData.reportsToEmployeeId || ''}
                      onChange={handleEditChange}
                      disabled={editEmployee.role?.toLowerCase() === 'admin'}
                      required={editEmployee.role?.toLowerCase() !== 'admin'}
                    >
                      <option value="">-- None (Self / Top-Level Management) --</option>
                      {employees
                        .filter((e) => e.employeeId !== editEmployee.employeeId)
                        .map((emp) => (
                          <option key={emp.employeeId} value={emp.employeeId}>
                            #{emp.employeeId} - {emp.name} ({emp.departmentName || 'General'})
                          </option>
                        ))}
                    </select>
                    <div className="form-text small">Select supervisor (an employee cannot report to themselves)</div>
                  </div>
                  </div>
                </div>

                <div className="modal-footer border-top">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary d-flex align-items-center gap-2" disabled={editSubmitting}>
                    {editSubmitting && <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>}
                    <span>{editSubmitting ? 'Saving...' : 'Save Changes'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-lg">
            <div className="modal-content border-0 shadow-lg rounded-3">
              <div className="modal-header border-bottom">
                <h5 className="modal-title fw-bold">Add New Employee</h5>
                <button type="button" className="btn-close" onClick={() => setShowAddModal(false)}></button>
              </div>

              <form onSubmit={handleCreateEmployee}>
                <div className="modal-body p-4">
                  <div className="row g-3">
                  <div className="col-12 col-md-6">
                    <label className="form-label small fw-semibold">Full Name</label>
                    <input
                      type="text"
                      className="form-control"
                      name="name"
                      placeholder="e.g. John Smith"
                      value={formData.name}
                      onChange={handleAddChange}
                      required
                    />
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-label small fw-semibold">Email Address</label>
                    <input
                      type="email"
                      className="form-control"
                      name="email"
                      placeholder="e.g. john.smith@company.com"
                      value={formData.email}
                      onChange={handleAddChange}
                      required
                    />
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-label small fw-semibold">Phone</label>
                    <input
                      type="tel"
                      className="form-control"
                      name="phone"
                      placeholder="e.g. +1 555-0199"
                      value={formData.phone}
                      onChange={handleAddChange}
                      required
                      maxLength="20"
                      title="Enter 7 to 15 digits. A leading +, spaces, hyphens, parentheses, and periods are allowed."
                    />
                    <div className="form-text small">Enter 7 to 15 digits; common phone formatting is allowed.</div>
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-label small fw-semibold">Role</label>
                    <select className="form-select" name="role" value={formData.role} onChange={handleAddChange} required>
                      <option value="Manager">Manager</option>
                      <option value="User">User</option>
                    </select>
                  </div>

                  <div className="col-12 col-md-6">
                      <label className="form-label small fw-semibold">Department</label>
                      <select
                        className="form-select"
                        name="departmentId"
                        value={formData.departmentId}
                        onChange={handleAddChange}
                      >
                        {departments.map((dept) => (
                          <option key={dept.departmentId} value={dept.departmentId}>
                            {dept.departmentName}
                          </option>
                        ))}
                      </select>
                  </div>

                  <div className="col-12 col-md-6">
                      <label className="form-label small fw-semibold">Initial Leaves</label>
                      <input
                        type="number"
                        className="form-control"
                        name="initialTotalLeaves"
                        value={formData.initialTotalLeaves}
                        onChange={handleAddChange}
                        min="0"
                        max="50"
                      />
                  </div>

                  <div className="col-12">
                    <label className="form-label small fw-semibold">Report To (Manager)</label>
                    <select
                      className="form-select"
                      name="reportsToEmployeeId"
                      value={formData.reportsToEmployeeId || ''}
                      onChange={handleAddChange}
                      required
                    >
                      <option value="" disabled>Select a manager</option>
                      {employees.map((emp) => (
                        <option key={emp.employeeId} value={emp.employeeId}>
                          #{emp.employeeId} - {emp.name} ({emp.departmentName || 'General'})
                        </option>
                      ))}
                    </select>
                    <div className="form-text small">Select supervisor/manager this employee reports to</div>
                  </div>
                  </div>
                </div>

                <div className="modal-footer border-top">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? 'Creating...' : 'Create Employee'}
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

export default Employees;
