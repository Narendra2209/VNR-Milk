import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api'
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  login: (username, password) => api.post('/auth/login', { username, password }).then((r) => r.data),
  me: () => api.get('/auth/me').then((r) => r.data)
};

export const userAPI = {
  list: () => api.get('/users').then((r) => r.data),
  create: (data) => api.post('/users', data).then((r) => r.data),
  update: (id, data) => api.put(`/users/${id}`, data).then((r) => r.data),
  remove: (id) => api.delete(`/users/${id}`).then((r) => r.data)
};

export const dairyConfigAPI = {
  list: () => api.get('/dairies').then((r) => r.data),
  create: (name) => api.post('/dairies', { name }).then((r) => r.data),
  update: (id, data) => api.put(`/dairies/${id}`, data).then((r) => r.data),
  remove: (id) => api.delete(`/dairies/${id}`).then((r) => r.data)
};

export const customerAPI = {
  list: (search) => api.get('/customers', { params: { search } }).then((r) => r.data),
  getBySerial: (sn) => api.get(`/customers/${sn}`).then((r) => r.data),
  create: (data) => api.post('/customers', data).then((r) => r.data),
  update: (id, data) => api.put(`/customers/${id}`, data).then((r) => r.data),
  remove: (id) => api.delete(`/customers/${id}`).then((r) => r.data)
};

export const milkAPI = {
  create: (data) => api.post('/milk-entry', data).then((r) => r.data),
  list: (params) => api.get('/milk-entry', { params }).then((r) => r.data)
};

export const dairyAPI = {
  create: (data) => api.post('/dairy-entry', data).then((r) => r.data),
  update: (id, data) => api.put(`/dairy-entry/${id}`, data).then((r) => r.data),
  list: (params) => api.get('/dairy-entry', { params }).then((r) => r.data),
  remove: (id) => api.delete(`/dairy-entry/${id}`).then((r) => r.data)
};

export const reportAPI = {
  dashboard: () => api.get('/reports/dashboard').then((r) => r.data),
  daily: (date, serialNumber) =>
    api.get('/reports/daily', { params: { date, serialNumber } }).then((r) => r.data),
  tenDays: (end, serialNumber) =>
    api.get('/reports/10days', { params: { end, serialNumber } }).then((r) => r.data),
  monthly: (month, serialNumber) =>
    api.get('/reports/monthly', { params: { month, serialNumber } }).then((r) => r.data),
  customerDiary: (serialNumber, from, to) =>
    api.get('/reports/customer-diary', { params: { serialNumber, from, to } }).then((r) => r.data)
};

export default api;
