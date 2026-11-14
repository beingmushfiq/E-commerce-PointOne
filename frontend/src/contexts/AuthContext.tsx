import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User } from '../types/auth';
import api from '../services/api';

export type AuthGuard = 'customer' | 'staff' | 'platform';

interface AuthContextType {
  user: User | null;
  token: string | null;
  platformToken: string | null;
  activeGuard: AuthGuard;
  isLoading: boolean;
  login: (token: string, user: User, guard?: AuthGuard) => void;
  logout: (guard?: AuthGuard) => void;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
  isPlatformAdmin: boolean;
  isStaff: boolean;
  isCustomer: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('cp_staff_token') ||
      localStorage.getItem('token') ||
      localStorage.getItem('auth_token');
  });

  const [platformToken, setPlatformToken] = useState<string | null>(() => {
    return localStorage.getItem('cp_platform_token') ||
      localStorage.getItem('mcp_token');
  });

  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeGuard, setActiveGuard] = useState<AuthGuard>('customer');

  const logout = useCallback((guard: AuthGuard = 'staff') => {
    if (guard === 'platform') {
      localStorage.removeItem('cp_platform_token');
      localStorage.removeItem('mcp_token');
      setPlatformToken(null);
    } else {
      if (token) {
        api.post('/auth/logout').catch(() => {});
      }
      localStorage.removeItem('cp_staff_token');
      localStorage.removeItem('token');
      localStorage.removeItem('auth_token');
      setToken(null);
      setUser(null);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      api.get('/auth/me')
        .then((res) => {
          const userData = res.data?.data?.user || res.data?.data;
          setUser(userData);
          if (userData?.roles?.includes('admin') || userData?.roles?.includes('staff')) {
            setActiveGuard('staff');
          } else {
            setActiveGuard('customer');
          }
        })
        .catch(() => {
          logout('staff');
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, [token, logout]);

  const login = (newToken: string, newUser: User, guard: AuthGuard = 'staff') => {
    if (guard === 'platform') {
      localStorage.setItem('cp_platform_token', newToken);
      localStorage.setItem('mcp_token', newToken);
      setPlatformToken(newToken);
    } else {
      localStorage.setItem('cp_staff_token', newToken);
      localStorage.setItem('token', newToken);
      localStorage.setItem('auth_token', newToken);
      setToken(newToken);
      setUser(newUser);
      setActiveGuard(guard);
    }
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    if (user.roles?.includes('admin') || user.roles?.includes('superadmin')) return true;
    return Boolean(user.permissions?.includes(permission));
  };

  const hasRole = (role: string): boolean => {
    if (!user) return false;
    return Boolean(user.roles?.includes(role));
  };

  const isPlatformAdmin = Boolean(
    platformToken ||
    user?.roles?.includes('superadmin') ||
    user?.roles?.includes('platform_admin')
  );

  const isStaff = Boolean(
    user?.roles?.includes('admin') ||
    user?.roles?.includes('staff') ||
    user?.roles?.includes('manager')
  );

  const isCustomer = !isStaff && !isPlatformAdmin;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        platformToken,
        activeGuard,
        isLoading,
        login,
        logout,
        hasPermission,
        hasRole,
        isPlatformAdmin,
        isStaff,
        isCustomer,
      }}
    >
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
