import api from './api';

export const dashboardService = {
  getAdminDashboard: () => api.get('/dashboard/admin'),
  getPatientDashboard: () => api.get('/dashboard/patient'),
};
