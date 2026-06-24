import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL ||
  (window.location.hostname.endsWith('.vercel.app')
    ? 'https://hospital-management-jktm.onrender.com/api'
    : 'http://localhost:5000/api');

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach Authorization header from localStorage as a fallback to cookies
// (useful when third-party cookies are restricted in some browsers)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('hms_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Global response handling: on 401, clear stale session
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('hms_token');
      localStorage.removeItem('hms_user');
    }
    return Promise.reject(error);
  }
);

export const extractErrorMessage = (error) => {
  if (error?.response?.data?.errors?.length) {
    return error.response.data.errors.join('. ');
  }
  return error?.response?.data?.message || error?.message || 'Something went wrong. Please try again.';
};

export default api;
