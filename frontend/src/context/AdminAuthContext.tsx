import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { api } from '@/lib/api';

interface AdminUser {
  id: string;
  email: string;
  name: string;
}

interface AdminAuthContextValue {
  admin: AdminUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshAdmin: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextValue | undefined>(undefined);

const TOKEN_KEY = 'catalyst_admin_token';

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setIsLoading(false);
      return;
    }
    api
      .get('/admin/auth/me')
      .then(({ data }) => setAdmin(data.data))
      .catch(() => localStorage.removeItem(TOKEN_KEY))
      .finally(() => setIsLoading(false));
  }, []);

  async function login(email: string, password: string) {
    const { data } = await api.post('/admin/auth/login', { email, password });
    localStorage.setItem(TOKEN_KEY, data.data.token);
    setAdmin(data.data.admin);
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    setAdmin(null);
  }

  async function refreshAdmin() {
    try {
      const { data } = await api.get('/admin/auth/me');
      setAdmin(data.data);
    } catch {
      // ignore
    }
  }

  return (
    <AdminAuthContext.Provider value={{ admin, isLoading, login, logout, refreshAdmin }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider');
  return ctx;
}
