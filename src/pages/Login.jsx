import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!username.trim() || !password.trim()) {
      setError("Please provide both username and password.");
      return;
    }
    console.log("Attempting login with:", { username, password });
    setLoading(true);
    try {
      const result = await login(username, password);
      if (result.success) {
        navigate(result.mustChangePassword ? "/change-password" : "/dashboard");
      } else {
        setError(result.message || "Invalid username or password.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to connect to HRMS API.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div
        className="card shadow-lg border-0 rounded-4 p-4"
        style={{ maxWidth: "420px", width: "100%" }}
      >
        <div className="text-center mb-4">
          <div
            className="d-inline-flex align-items-center justify-content-center bg-primary text-white rounded-circle mb-3"
            style={{ width: "60px", height: "60px" }}
          >
            <i className="bi bi-person-fill-lock fs-2"></i>
          </div>
          <h3 className="fw-bold text-dark">HRMS Portal</h3>
          <p className="text-muted small">
            Sign in to your account to continue
          </p>
        </div>

        {error && (
          <div
            className="alert alert-danger alert-dismissible fade show small"
            role="alert"
          >
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label small fw-semibold">Username</label>
            <div className="input-group">
              <span className="input-group-text bg-white border-end-0">
                <i className="bi bi-person text-muted"></i>
              </span>
              <input
                type="text"
                className="form-control border-start-0"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="mb-4">
            <div className="d-flex justify-content-between align-items-center mb-1">
              <label className="form-label small fw-semibold mb-0">
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-decoration-none small text-primary fw-semibold"
              >
                Forgot password?
              </Link>
            </div>
            <div className="input-group">
              <span className="input-group-text bg-white border-end-0">
                <i className="bi bi-lock text-muted"></i>
              </span>
              <input
                type={showPassword ? "text" : "password"}
                className="form-control border-start-0 border-end-0"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="btn btn-outline-secondary border-start-0 bg-white"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? "Hide password" : "Show password"}
              >
                <i
                  className={`bi ${showPassword ? "bi-eye-slash-fill" : "bi-eye-fill"} text-muted`}
                ></i>
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary w-100 py-2 fw-semibold shadow-sm d-flex align-items-center justify-content-center gap-2"
            disabled={loading}
          >
            {loading ? (
              <>
                <span
                  className="spinner-border spinner-border-sm"
                  role="status"
                  aria-hidden="true"
                ></span>
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <i className="bi bi-arrow-right"></i>
              </>
            )}
          </button>
        </form>

        <div className="mt-4 pt-3 border-top text-center text-muted small">
          <div>
            Default Admin: <strong>admin</strong> /{" "}
            <strong>Password: 123</strong>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
