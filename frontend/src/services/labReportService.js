import api from './api';

export const labReportService = {
  analyze: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/lab-reports/analyze', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  create: (data) => api.post('/lab-reports', data),
  getMy: (params) => api.get('/lab-reports/my', { params }),
  getByPatient: (patientId, params) => api.get(`/lab-reports/patient/${patientId}`, { params }),
  getAll: (params) => api.get('/lab-reports', { params }),
  getById: (id) => api.get(`/lab-reports/${id}`),
  update: (id, data) => api.put(`/lab-reports/${id}`, data),
  remove: (id) => api.delete(`/lab-reports/${id}`),
};
