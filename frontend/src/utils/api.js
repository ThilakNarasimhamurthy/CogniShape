import axios from 'axios';

// Create axios instance
export const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API calls
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (email, password, role) => api.post('/auth/register', { email, password, role }),
  getProfile: () => api.get('/user/profile'),
  updateProfile: (data) => api.put('/user/profile', data),
};

// Children API calls
export const childrenAPI = {
  create: (childData) => api.post('/children/create', childData),
  getAll: () => api.get('/children'),
  getById: (childId) => api.get(`/children/${childId}`),
  update: (childId, data) => api.put(`/children/${childId}`, data),
  delete: (childId) => api.delete(`/children/${childId}`),
};

// Session API calls
export const sessionAPI = {
  log: (sessionData) => api.post('/session/log', sessionData),
  getHistory: (childId) => api.get(`/session/history/${childId}`),
  getSession: (sessionId) => api.get(`/session/${sessionId}`),
  endSession: (sessionId, summary) => api.post(`/session/${sessionId}/end`, summary),
};

// Reports API calls
export const reportsAPI = {
  getChildReports: (childId) => api.get(`/reports/${childId}`),
  generateReport: (childId, sessions) => api.post(`/reports/${childId}/generate`, { sessions }),
  downloadReport: (reportId) => api.get(`/reports/${reportId}/download`, { responseType: 'blob' }),
  confirmDiagnosis: (reportId, diagnosis) => api.post(`/reports/${reportId}/confirm`, { diagnosis }),
};

// Payment API calls
export const paymentAPI = {
  createOrder: (orderData) => api.post('/payments/create-order', orderData),
  verifyPayment: (paymentData) => api.post('/payments/verify', paymentData),
  getHistory: () => api.get('/payments/history'),
  getPricing: (itemType, userRole, currency) => api.get('/payments/pricing', {
    params: { item_type: itemType, user_role: userRole, currency }
  }),
};

// AI Analysis API calls
export const aiAPI = {
  analyzeSession: (sessionId) => api.post(`/ai/analyze/${sessionId}`),
  generateGameConfig: (childId, previousSessions) => api.post('/ai/game-config', {
    child_id: childId,
    previous_sessions: previousSessions
  }),
  getBehaviorInsights: (childId) => api.get(`/ai/insights/${childId}`),
};

// License API calls
export const licenseAPI = {
  getUsage: () => api.get('/license/usage'),
  upgrade: (upgradeType) => api.post('/license/upgrade', { upgrade_type: upgradeType }),
  checkLimit: () => api.get('/license/check-limit'),
};

// Dashboard API calls
export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
  getRecentActivity: () => api.get('/dashboard/recent-activity'),
  getAnalytics: (timeframe) => api.get('/dashboard/analytics', { params: { timeframe } }),
};

// Game configuration API calls
export const gameAPI = {
  getConfigs: () => api.get('/game/configs'),
  createConfig: (config) => api.post('/game/configs', config),
  updateConfig: (configId, config) => api.put(`/game/configs/${configId}`, config),
  deleteConfig: (configId) => api.delete(`/game/configs/${configId}`),
  getDefaultConfig: (childAge, interests) => api.get('/game/default-config', {
    params: { age: childAge, interests }
  }),
};

// Utility functions
export const uploadFile = async (file, endpoint) => {
  const formData = new FormData();
  formData.append('file', file);
  
  return api.post(endpoint, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const downloadFile = async (url, filename) => {
  const response = await api.get(url, { responseType: 'blob' });
  const blob = new Blob([response.data]);
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(downloadUrl);
};

// Error handling utility
export const handleAPIError = (error, defaultMessage = 'An error occurred') => {
  if (error.response?.data?.detail) {
    return error.response.data.detail;
  } else if (error.response?.data?.message) {
    return error.response.data.message;
  } else if (error.message) {
    return error.message;
  } else {
    return defaultMessage;
  }
};

export default api;