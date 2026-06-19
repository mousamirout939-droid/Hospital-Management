import api from './api';

export const doctorService = {
  getAll: (params) => api.get('/doctors', { params }),
  getAllAdmin: (params) => api.get('/doctors/admin/all', { params }),
  getDepartments: () => api.get('/doctors/departments'),
  getById: (id) => api.get(`/doctors/${id}`),
  getAvailableSlots: (id, date) => api.get(`/doctors/${id}/available-slots`, { params: { date } }),
  create: (data) => api.post('/doctors', data),
  update: (id, data) => api.put(`/doctors/${id}`, data),
  remove: (id) => api.delete(`/doctors/${id}`),
};
