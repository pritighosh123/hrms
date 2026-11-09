import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext(null);
// Helper to check if a JWT token has expired
const isTokenExpired = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const { exp } = JSON.parse(jsonPayload);
    if (!exp) return false;
    return Date.now() >= exp * 1000;
  } catch {
    return true;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loggedUserName, setLoggedUserName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('hrms_token');
    const savedUser = localStorage.getItem('hrms_user');

    if (savedToken && savedUser) {
      if (isTokenExpired(savedToken)) {
        // Token expired: clear storage
        localStorage.removeItem('hrms_token');
        localStorage.removeItem('hrms_user');
        setToken(null);
        setUser(null);
      } else {
        try {
          setToken(savedToken);
          const userData = JSON.parse(savedUser);
          setUser(userData);
          setLoggedUserName(userData.username || '');
        } catch {
          localStorage.removeItem('hrms_token');
          localStorage.removeItem('hrms_user');
        }
      }
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    const response = await authService.login({ username, password });
    const data = response.data;

    if (data.success && data.token) {
      const userData = {
        username: data.username,
        role: data.role,
        employeeId: data.employeeId,
        mustChangePassword: Boolean(data.mustChangePassword),
      };

      setToken(data.token);
      setUser(userData);
      setLoggedUserName(userData.username);
      localStorage.setItem('hrms_token', data.token);
      localStorage.setItem('hrms_user', JSON.stringify(userData));

      return {
        success: true,
        mustChangePassword: userData.mustChangePassword && userData.role !== 'Admin',
      };
    }

    return { success: false, message: data.message || 'Login failed.' };
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setLoggedUserName('');
    localStorage.removeItem('hrms_token');
    localStorage.removeItem('hrms_user');
  };

  const completeForcedPasswordChange = () => {
    setUser((currentUser) => {
      if (!currentUser) return currentUser;
      const updatedUser = { ...currentUser, mustChangePassword: false };
      localStorage.setItem('hrms_user', JSON.stringify(updatedUser));
      return updatedUser;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        role: user?.role || 'Guest',
        employeeId: user?.employeeId,
        mustChangePassword: user?.mustChangePassword || false,
        loggedUserName,
        loading,
        login,
        logout,
        completeForcedPasswordChange,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
