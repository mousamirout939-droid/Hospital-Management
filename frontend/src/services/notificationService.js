import api from './api';

export const notificationService = {
  getMy: (params) => api.get('/notifications', { params }),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  remove: (id) => api.delete(`/notifications/${id}`),
};
