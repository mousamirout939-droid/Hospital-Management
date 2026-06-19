import api from './api';

export const labReportService = {
  create: (data) => api.post('/lab-reports', data),
  getMy: (params) => api.get('/lab-reports/my', { params }),
  getByPatient: (patientId, params) => api.get(`/lab-reports/patient/${patientId}`, { params }),
  getAll: (params) => api.get('/lab-reports', { params }),
  getById: (id) => api.get(`/lab-reports/${id}`),
  update: (id, data) => api.put(`/lab-reports/${id}`, data),
  remove: (id) => api.delete(`/lab-reports/${id}`),
};
