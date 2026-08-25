import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { authApi } from '../services/api';
import type { User } from '../types';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (payload: Record<string, string>) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateUser: (u: User) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem('eventease_token');
    setUser(null);
    window.location.href = '/login';
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('eventease_token');
    if (!token) {
      setLoading(false);
      return;
    }
    authApi
      .me()
      .then((res) => setUser(res.data.data.user))
      .catch(() => localStorage.removeItem('eventease_token'))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    const res = await authApi.login({ email, password });
    localStorage.setItem('eventease_token', res.data.data.token);
    setUser(res.data.data.user);
    return res.data.data.user;
  };

  const register = async (payload: Record<string, string>): Promise<User> => {
    const res = await authApi.register(payload);
    localStorage.setItem('eventease_token', res.data.data.token);
    setUser(res.data.data.user);
    return res.data.data.user;
  };

  const refreshUser = async () => {
    const res = await authApi.me();
    setUser(res.data.data.user);
  };

  const updateUser = useCallback((u: User) => setUser(u), []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
