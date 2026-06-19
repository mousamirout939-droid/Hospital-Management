import api from './api';

export const prescriptionService = {
  create: (data) => api.post('/prescriptions', data),
  getMy: (params) => api.get('/prescriptions/my', { params }),
  getByPatient: (patientId, params) => api.get(`/prescriptions/patient/${patientId}`, { params }),
  getAll: (params) => api.get('/prescriptions', { params }),
  getById: (id) => api.get(`/prescriptions/${id}`),
  updateStatus: (id, data) => api.put(`/prescriptions/${id}/status`, data),
};
