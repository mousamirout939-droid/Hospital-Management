import api from './api';

export const medicalRecordService = {
  create: (data) => api.post('/medical-records', data),
  getMy: (params) => api.get('/medical-records/my', { params }),
  getByPatient: (patientId, params) => api.get(`/medical-records/patient/${patientId}`, { params }),
  getById: (id) => api.get(`/medical-records/${id}`),
  update: (id, data) => api.put(`/medical-records/${id}`, data),
  remove: (id) => api.delete(`/medical-records/${id}`),
};
