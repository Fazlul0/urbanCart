import { createContext, useContext, useState, useEffect } from 'react';
import * as api from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('uc_admin_user'));
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('uc_admin_token');
    if (token) {
      api
        .getMe()
        .then((res) => {
          if (res.data.user.role !== 'admin') throw new Error('Not admin');
          setAdmin(res.data.user);
          localStorage.setItem('uc_admin_user', JSON.stringify(res.data.user));
        })
        .catch(() => {
          localStorage.removeItem('uc_admin_token');
          localStorage.removeItem('uc_admin_user');
          setAdmin(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await api.adminLogin({
      email: String(email || '').trim(),
      password: String(password || ''),
    });
    if (res.data.user.role !== 'admin') throw new Error('Not authorized');
    localStorage.setItem('uc_admin_token', res.data.token);
    localStorage.setItem('uc_admin_user', JSON.stringify(res.data.user));
    setAdmin(res.data.user);
    toast.success('Welcome, Admin');
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('uc_admin_token');
    localStorage.removeItem('uc_admin_user');
    setAdmin(null);
    toast.success('Logged out');
  };

  return (
    <AuthContext.Provider value={{ admin, loading, login, logout, isAuthenticated: !!admin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
