import axios from 'axios';

const API_BASE_URL = 'https://localhost:7150/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT/Token if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('hrms_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for centralized error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('hrms_token');
      localStorage.removeItem('hrms_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth Services
export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  changePassword: (data) => api.post('/auth/change-password', data),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
};

// Employee Services
export const employeeService = {
  getAll: () => api.get('/employee'),
  getById: (id) => api.get(`/employee/${id}`),
  getMySubordinates: () => api.get('/employee/subordinates'),
  revokeSubordinate: (id) => api.put(`/employee/subordinates/${id}/revoke`),
  assignManager: (id, managerEmployeeId) => api.put(`/employee/${id}/manager`, { managerEmployeeId }),
  create: (data) => api.post('/employee', data),
  update: (id, data) => api.put(`/employee/${id}`, data),
  delete: (id) => api.delete(`/employee/${id}`),
};

// Attendance Services
export const attendanceService = {
  getByDate: (date) => api.get(`/attendance/date/${date}`),
  getByEmployee: (employeeId) => api.get(`/attendance/employee/${employeeId}`),
  mark: (data) => api.post('/attendance/mark', data),
};

// Leave Services
export const leaveService = {
  getAllRequests: () => api.get('/leave/requests'),
  getByEmployee: (employeeId) => api.get(`/leave/requests/employee/${employeeId}`),
  getBalance: (employeeId) => api.get(`/leave/balance/${employeeId}`),
  apply: (data) => api.post('/leave/apply', data),
  updateStatus: (leaveId, status, rejectionDetails = '') => api.put(`/leave/requests/${leaveId}/status`, { status, rejectionDetails }),
};

// Dashboard Services
export const dashboardService = {
  getSummary: () => api.get('/dashboard/summary'),
  getDepartments: () => api.get('/dashboard/departments'),
};

export default api;
