import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService, employeeService } from '../services/api';

const ChangePassword = () => {
  const { user, loggedUserName, mustChangePassword, completeForcedPasswordChange } = useAuth();
  const navigate = useNavigate();
  const [currentUsername, setCurrentUsername] = useState(user?.employeeId ? '' : user?.username || loggedUserName || '');
  const [loadingUsername, setLoadingUsername] = useState(Boolean(user?.employeeId));

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [message, setMessage] = useState({ type: '', text: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user?.employeeId) return undefined;

    let isActive = true;
    employeeService.getById(user.employeeId)
      .then((response) => {
        if (isActive && response.data?.username) setCurrentUsername(response.data.username);
      })
      .catch(() => {
        if (isActive) setMessage({ type: 'danger', text: 'Could not load the account username. Please reload and try again.' });
      })
      .finally(() => {
        if (isActive) setLoadingUsername(false);
      });

    return () => { isActive = false; };
  }, [user?.employeeId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (!currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      setMessage({ type: 'danger', text: 'Please fill in all password fields.' });
      return;
    }

    if (!currentUsername) {
      setMessage({ type: 'danger', text: 'The linked account username is unavailable. Please reload and try again.' });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ type: 'danger', text: 'New password must be at least 6 characters long.' });
      return;
    }

    if (newPassword === currentPassword) {
      setMessage({ type: 'danger', text: 'New password cannot be the same as current password.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'danger', text: 'New password and confirm password do not match.' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await authService.changePassword({
        username: currentUsername,
        currentPassword,
        newPassword,
      });

      setMessage({
        type: 'success',
        text: res.data.message || 'Password changed successfully!',
      });

      if (mustChangePassword && user?.role !== 'Admin') {
        completeForcedPasswordChange();
        navigate('/dashboard', { replace: true });
      }

      // Clear fields on success
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setMessage({
        type: 'danger',
        text: err.response?.data?.message || 'Failed to change password. Please check your current password.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container-fluid p-4">
      <div className="mb-4">
        <h2 className="fw-bold mb-1">Change Password</h2>
        <p className="text-muted mb-0">
          {mustChangePassword && user?.role !== 'Admin'
            ? 'Change your temporary password before continuing to the portal.'
            : 'Update your account login password'}
        </p>
      </div>

      <div className="row justify-content-center">
        <div className="col-12 col-md-8 col-lg-6">
          <div className="card shadow-sm border-0 rounded-3">
            <div className="card-header bg-white py-3 border-bottom d-flex align-items-center gap-2">
              <i className="bi bi-shield-lock-fill text-primary fs-5"></i>
              <h5 className="mb-0 fw-bold">Security Settings</h5>
            </div>

            <div className="card-body p-4">
              {message.text && (
                <div className={`alert alert-${message.type} alert-dismissible fade show small`} role="alert">
                  <i className={`bi ${message.type === 'danger' ? 'bi-exclamation-triangle-fill' : 'bi-check-circle-fill'} me-2`}></i>
                  {message.text}
                  <button type="button" className="btn-close" onClick={() => setMessage({ type: '', text: '' })}></button>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Account Username</label>
                  <input
                    type="text"
                    className="form-control bg-light"
                    value={loadingUsername ? 'Loading account username…' : currentUsername}
                    readOnly
                  />
                  <div className="form-text small">Logged-in account username</div>
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-semibold">Current Password</label>
                  <div className="input-group">
                    <span className="input-group-text bg-white border-end-0">
                      <i className="bi bi-key text-muted"></i>
                    </span>
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      className="form-control border-start-0 border-end-0"
                      placeholder="Enter current password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary border-start-0 bg-white"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      title={showCurrentPassword ? 'Hide password' : 'Show password'}
                    >
                      <i className={`bi ${showCurrentPassword ? 'bi-eye-slash-fill' : 'bi-eye-fill'} text-muted`}></i>
                    </button>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-semibold">New Password</label>
                  <div className="input-group">
                    <span className="input-group-text bg-white border-end-0">
                      <i className="bi bi-lock text-muted"></i>
                    </span>
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      className="form-control border-start-0 border-end-0"
                      placeholder="At least 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary border-start-0 bg-white"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      title={showNewPassword ? 'Hide password' : 'Show password'}
                    >
                      <i className={`bi ${showNewPassword ? 'bi-eye-slash-fill' : 'bi-eye-fill'} text-muted`}></i>
                    </button>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="form-label small fw-semibold">Confirm New Password</label>
                  <div className="input-group">
                    <span className="input-group-text bg-white border-end-0">
                      <i className="bi bi-shield-check text-muted"></i>
                    </span>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      className="form-control border-start-0 border-end-0"
                      placeholder="Re-enter new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary border-start-0 bg-white"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      title={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      <i className={`bi ${showConfirmPassword ? 'bi-eye-slash-fill' : 'bi-eye-fill'} text-muted`}></i>
                    </button>
                  </div>
                </div>

                <div className="d-flex justify-content-end gap-2">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => {
                      setCurrentPassword('');
                      setNewPassword('');
                      setConfirmPassword('');
                      setMessage({ type: '', text: '' });
                    }}
                  >
                    Reset Form
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary px-4 d-flex align-items-center gap-2"
                    disabled={submitting || loadingUsername}
                  >
                    {submitting && <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>}
                    <span>{submitting ? 'Updating...' : 'Update Password'}</span>
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

export default ChangePassword;
