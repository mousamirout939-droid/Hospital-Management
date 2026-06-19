import api from './api';

export const invoiceService = {
  create: (data) => api.post('/invoices', data),
  getMy: (params) => api.get('/invoices/my', { params }),
  getAll: (params) => api.get('/invoices', { params }),
  getById: (id) => api.get(`/invoices/${id}`),
  recordPayment: (id, data) => api.put(`/invoices/${id}/pay`, data),
};
