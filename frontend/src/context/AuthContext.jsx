import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';
import { extractErrorMessage } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState('');

  const loadSession = useCallback(async () => {
    const cachedUser = localStorage.getItem('hms_user');
    const token = localStorage.getItem('hms_token');

    if (!token && !cachedUser) {
      setLoading(false);
      return;
    }

    try {
      const res = await authService.getMe();
      setUser(res.data.user);
      localStorage.setItem('hms_user', JSON.stringify(res.data.user));
    } catch (error) {
      localStorage.removeItem('hms_token');
      localStorage.removeItem('hms_user');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  const persistSession = (data) => {
    localStorage.setItem('hms_token', data.token);
    localStorage.setItem('hms_user', JSON.stringify(data.user));
    setUser(data.user);
  };

  const login = async (credentials) => {
    setAuthError('');
    try {
      const res = await authService.login(credentials);
      persistSession(res.data);
      return { success: true, user: res.data.user };
    } catch (error) {
      const message = extractErrorMessage(error);
      setAuthError(message);
      return { success: false, message };
    }
  };

  const register = async (payload) => {
    setAuthError('');
    try {
      const res = await authService.register(payload);
      persistSession(res.data);
      return { success: true, user: res.data.user };
    } catch (error) {
      const message = extractErrorMessage(error);
      setAuthError(message);
      return { success: false, message };
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      // ignore network errors on logout - clear client state regardless
    }
    localStorage.removeItem('hms_token');
    localStorage.removeItem('hms_user');
    setUser(null);
  };

  const updateLocalUser = (updatedFields) => {
    setUser((prev) => {
      const next = { ...prev, ...updatedFields };
      localStorage.setItem('hms_user', JSON.stringify(next));
      return next;
    });
  };

  const value = {
    user,
    loading,
    authError,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isPatient: user?.role === 'patient',
    login,
    register,
    logout,
    updateLocalUser,
    setAuthError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
