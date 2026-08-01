import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

export interface User {
  id: number;
  name: string;
  email: string;
  roles: string[];
  permissions?: string[];
}

export const useAuth = () => {
  const queryClient = useQueryClient();
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('auth_token'));

  useEffect(() => {
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }, [token]);

  const { data: user, isLoading, refetch } = useQuery<User | null>({
    queryKey: ['auth-user', token],
    queryFn: async () => {
      if (!token) return null;
      try {
        const res = await api.get('/auth/me');
        return res.data.data.user;
      } catch (err) {
        setToken(null);
        return null;
      }
    },
    enabled: !!token,
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const res = await api.post('/auth/login', credentials);
      return res.data.data;
    },
    onSuccess: (data) => {
      setToken(data.token);
      queryClient.setQueryData(['auth-user', data.token], data.user);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      if (token) {
        await api.post('/auth/logout');
      }
    },
    onSuccess: () => {
      setToken(null);
      queryClient.setQueryData(['auth-user', null], null);
    },
  });

  const isAdmin = !!(user && user.roles && user.roles.includes('admin'));

  return {
    user,
    token,
    isLoading,
    isAdmin,
    login: loginMutation.mutateAsync,
    loginStatus: loginMutation,
    logout: logoutMutation.mutate,
    refetchUser: refetch,
  };
};
