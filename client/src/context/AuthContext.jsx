import { createContext, useContext, useState, useEffect } from 'react';
import * as api from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('uc_user'));
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('uc_token');
    if (token) {
      api
        .getMe()
        .then((res) => {
          setUser(res.data.user);
          localStorage.setItem('uc_user', JSON.stringify(res.data.user));
        })
        .catch(() => {
          localStorage.removeItem('uc_token');
          localStorage.removeItem('uc_user');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await api.login({ email, password });
    localStorage.setItem('uc_token', res.data.token);
    localStorage.setItem('uc_user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    toast.success('Welcome back!');
    return res.data;
  };

  const register = async (data) => {
    const res = await api.register(data);
    localStorage.setItem('uc_token', res.data.token);
    localStorage.setItem('uc_user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    toast.success('Account created successfully!');
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('uc_token');
    localStorage.removeItem('uc_user');
    setUser(null);
    toast.success('Logged out');
  };

  const updateUser = (updated) => {
    setUser(updated);
    localStorage.setItem('uc_user', JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, updateUser, isAuthenticated: !!user }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
