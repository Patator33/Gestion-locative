import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API_URL = `${BACKEND_URL}/api`;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me')
};

// Properties
export const propertiesAPI = {
  getAll: () => api.get('/properties'),
  getOne: (id) => api.get(`/properties/${id}`),
  create: (data) => api.post('/properties', data),
  update: (id, data) => api.put(`/properties/${id}`, data),
  delete: (id) => api.delete(`/properties/${id}`)
};

// Tenants
export const tenantsAPI = {
  getAll: () => api.get('/tenants'),
  getOne: (id) => api.get(`/tenants/${id}`),
  create: (data) => api.post('/tenants', data),
  update: (id, data) => api.put(`/tenants/${id}`, data),
  delete: (id) => api.delete(`/tenants/${id}`)
};

// Leases
export const leasesAPI = {
  getAll: () => api.get('/leases'),
  getOne: (id) => api.get(`/leases/${id}`),
  create: (data) => api.post('/leases', data),
  terminate: (id, endDate) => api.put(`/leases/${id}/terminate?end_date=${endDate}`)
};

// Payments
export const paymentsAPI = {
  getAll: () => api.get('/payments'),
  getByLease: (leaseId) => api.get(`/payments/lease/${leaseId}`),
  create: (data) => api.post('/payments', data),
  delete: (id) => api.delete(`/payments/${id}`)
};

// Vacancies
export const vacanciesAPI = {
  getAll: () => api.get('/vacancies'),
  create: (data) => api.post('/vacancies', data),
  end: (id, endDate) => api.put(`/vacancies/${id}/end?end_date=${endDate}`)
};

// Notifications
export const notificationsAPI = {
  getAll: () => api.get('/notifications'),
  getSettings: () => api.get('/notifications/settings'),
  updateSettings: (data) => api.put('/notifications/settings', data),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all')
};

// Dashboard
export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats')
};

// Receipts
export const receiptsAPI = {
  generate: (paymentId) => api.get(`/receipts/${paymentId}`)
};

// Export
export const exportAPI = {
  payments: (year) => api.get(`/export/payments${year ? `?year=${year}` : ''}`),
  paymentsExcel: (year) => api.get(`/export/payments/excel${year ? `?year=${year}` : ''}`, { responseType: 'blob' })
};

// Reminders
export const remindersAPI = {
  testSmtp: () => api.post('/reminders/test-smtp'),
  send: () => api.post('/reminders/send'),
  getPending: () => api.get('/reminders/pending')
};

// Documents
export const documentsAPI = {
  getAll: (relatedType, relatedId) => {
    let url = '/documents';
    const params = [];
    if (relatedType) params.push(`related_type=${relatedType}`);
    if (relatedId) params.push(`related_id=${relatedId}`);
    if (params.length) url += '?' + params.join('&');
    return api.get(url);
  },
  getOne: (id) => api.get(`/documents/${id}`),
  upload: (formData) => api.post('/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  download: (id) => api.get(`/documents/${id}/download`, { responseType: 'blob' }),
  delete: (id) => api.delete(`/documents/${id}`)
};

// Calendar
export const calendarAPI = {
  getEvents: (month, year) => api.get(`/calendar/events?month=${month}&year=${year}`)
};

export default api;
