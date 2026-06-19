import api from './api';

export const appointmentService = {
  book: (data) => api.post('/appointments', data),
  getMy: (params) => api.get('/appointments/my', { params }),
  getAll: (params) => api.get('/appointments', { params }),
  getById: (id) => api.get(`/appointments/${id}`),
  updateStatus: (id, data) => api.put(`/appointments/${id}/status`, data),
  cancel: (id, data) => api.put(`/appointments/${id}/cancel`, data),
  getToday: () => api.get('/appointments/admin/today'),
};
