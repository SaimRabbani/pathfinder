import React, { useCallback, useEffect, useState } from 'react';
import api from '../lib/api';
import AuthContext from './auth-context';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Hook global helper for API client to clear state on auth failure
  useEffect(() => {
    window.__clearAuthState = () => {
      setUser(null);
    };
    return () => {
      delete window.__clearAuthState;
    };
  }, []);

  const verifySession = useCallback(async () => {
    try {
      const response = await api.get('/api/auth/me');
      if (response.data?.user) {
        setUser(response.data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    verifySession();
  }, [verifySession]);

  const login = async (email, password) => {
    const response = await api.post('/api/auth/login', { email, password });
    if (response.data?.user) {
      setUser(response.data.user);
    }
    return response.data;
  };

  const register = async (name, email, password) => {
    const response = await api.post('/api/auth/register', { name, email, password });
    if (response.data?.user) {
      setUser(response.data.user);
    }
    return response.data;
  };

  const logout = async () => {
    try {
      await api.post('/api/auth/logout');
    } catch (error) {
      console.error('Logout request failed:', error.message);
    } finally {
      setUser(null);
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    refreshUser: verifySession
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
