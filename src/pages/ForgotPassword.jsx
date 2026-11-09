import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/api';

const ForgotPassword = () => {
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (!usernameOrEmail.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      setMessage({ type: 'danger', text: 'Please fill in all required fields.' });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ type: 'danger', text: 'New password must be at least 6 characters long.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'danger', text: 'New password and confirm password do not match.' });
      return;
    }

    setLoading(true);
    try {
      const res = await authService.forgotPassword({
        usernameOrEmail: usernameOrEmail.trim(),
        newPassword: newPassword,
      });

      setMessage({
        type: 'success',
        text: res.data.message || 'Password reset successfully! Redirecting to login...',
      });

      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setMessage({
        type: 'danger',
        text: err.response?.data?.message || 'Failed to reset password. Please verify your details.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid min-vh-100 d-flex align-items-center justify-content-center bg-light p-3">
      <div className="card shadow-lg border-0 rounded-4 p-4" style={{ maxWidth: '440px', width: '100%' }}>
        <div className="text-center mb-4">
          <div
            className="d-inline-flex align-items-center justify-content-center bg-warning text-dark rounded-circle mb-3"
            style={{ width: '60px', height: '60px' }}
          >
            <i className="bi bi-key-fill fs-2"></i>
          </div>
          <h3 className="fw-bold text-dark">Forgot Password</h3>
          <p className="text-muted small">
            Enter your username or registered email and choose a new password
          </p>
        </div>

        {message.text && (
          <div className={`alert alert-${message.type} alert-dismissible fade show small`} role="alert">
            <i className={`bi ${message.type === 'danger' ? 'bi-exclamation-triangle-fill' : 'bi-check-circle-fill'} me-2`}></i>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label small fw-semibold">Username or Email</label>
            <div className="input-group">
              <span className="input-group-text bg-white border-end-0">
                <i className="bi bi-person-badge text-muted"></i>
              </span>
              <input
                type="text"
                className="form-control border-start-0"
                placeholder="Enter username or email"
                value={usernameOrEmail}
                onChange={(e) => setUsernameOrEmail(e.target.value)}
                required
              />
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
                <i className="bi bi-shield-lock text-muted"></i>
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

          <button
            type="submit"
            className="btn btn-primary w-100 py-2 fw-semibold shadow-sm d-flex align-items-center justify-content-center gap-2 mb-3"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                <span>Resetting Password...</span>
              </>
            ) : (
              <>
                <span>Reset Password</span>
                <i className="bi bi-arrow-right"></i>
              </>
            )}
          </button>

          <div className="text-center">
            <Link to="/login" className="text-decoration-none small text-muted d-inline-flex align-items-center gap-1">
              <i className="bi bi-arrow-left"></i> Back to Sign In
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
