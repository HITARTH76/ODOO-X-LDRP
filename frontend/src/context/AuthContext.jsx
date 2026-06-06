import React, { createContext, useState, useEffect, useContext } from 'react';
import { api } from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const data = await api.get('/auth/me');
      setUser(data);
    } catch (err) {
      console.error('Failed to load user info:', err.message);
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  const login = async (email, password) => {
    try {
      const data = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', data.token);
      setUser(data.user);
      // Reload user details (for vendor details, etc.)
      await loadUser();
      return data.user;
    } catch (err) {
      throw err;
    }
  };

  const register = async (formData) => {
    try {
      const data = await api.post('/auth/register', formData);
      localStorage.setItem('token', data.token);
      setUser(data.user);
      await loadUser();
      return data.user;
    } catch (err) {
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const forgotPassword = async (email) => {
    return await api.post('/auth/forgot-password', { email });
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, forgotPassword, reloadUser: loadUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
