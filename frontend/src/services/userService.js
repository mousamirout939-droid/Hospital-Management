import api from './api';

export const userService = {
  updateProfile: (data) => api.put('/users/profile', data),
  getAllPatients: (params) => api.get('/users/patients', { params }),
  getPatientById: (id) => api.get(`/users/patients/${id}`),
  updatePatientStatus: (id, data) => api.put(`/users/patients/${id}/status`, data),
  getAdminStats: () => api.get('/users/admin/stats'),
};
