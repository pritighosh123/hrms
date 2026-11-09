import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleBadgeClass = () => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return 'bg-danger';
      case 'hr':
        return 'bg-primary';
      default:
        return 'bg-success';
    }
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark sticky-top shadow-sm px-3">
      <div className="container-fluid">
        <Link className="navbar-brand d-flex align-items-center gap-2 fw-bold" to="/dashboard">
          <i className="bi bi-briefcase-fill text-primary fs-4"></i>
          <span>HRMS Portal</span>
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarContent"
          aria-controls="navbarContent"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse justify-content-end" id="navbarContent">
          <div className="d-flex align-items-center gap-2 gap-md-3">
            <div className="text-end text-light me-1">
              <div className="fw-semibold small">{user?.username}</div>
              <span className={`badge ${getRoleBadgeClass()} text-uppercase`}>
                {role}
              </span>
            </div>

            <Link
              to="/change-password"
              className="btn btn-outline-light btn-sm d-flex align-items-center gap-1"
              title="Change Password"
            >
              <i className="bi bi-key-fill"></i>
              <span className="d-none d-md-inline">Change Password</span>
            </Link>

            <button
              onClick={handleLogout}
              className="btn btn-outline-danger btn-sm d-flex align-items-center gap-1"
            >
              <i className="bi bi-box-arrow-right"></i>
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
