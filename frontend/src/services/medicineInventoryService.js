import api from './api';

export const medicineInventoryService = {
  getAll: () => api.get('/medicine-inventory'),
  create: (data) => api.post('/medicine-inventory', data),
  update: (id, data) => api.put(`/medicine-inventory/${id}`, data),
};
