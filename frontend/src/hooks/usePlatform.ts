import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

export function usePlatformKpis() {
  return useQuery({
    queryKey: ['platform', 'kpis'],
    queryFn: async () => {
      const res = await api.get('/platform/kpis');
      return res.data?.data;
    },
    staleTime: 15000,
  });
}

export function usePlatformHealth() {
  return useQuery({
    queryKey: ['platform', 'health'],
    queryFn: async () => {
      const res = await api.get('/platform/health');
      return res.data?.data;
    },
    staleTime: 10000,
  });
}

export function usePlatformAuditLogs() {
  return useQuery({
    queryKey: ['platform', 'audit-logs'],
    queryFn: async () => {
      const res = await api.get('/platform/audit-logs');
      return res.data?.data || [];
    },
    staleTime: 15000,
  });
}

export function usePlatformTenants(params?: { status?: string; search?: string }) {
  return useQuery({
    queryKey: ['platform', 'tenants', params],
    queryFn: async () => {
      const res = await api.get('/platform/tenants', { params });
      return res.data?.data?.data || res.data?.data || [];
    },
    staleTime: 15000,
  });
}

export function useProvisionTenant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { name: string; domain?: string; plan_id?: number }) => {
      const res = await api.post('/platform/tenants', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform', 'tenants'] });
      queryClient.invalidateQueries({ queryKey: ['platform', 'kpis'] });
    },
  });
}

export function useToggleTenantSuspend() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, isSuspended }: { id: string | number; isSuspended: boolean }) => {
      const endpoint = isSuspended ? `/platform/tenants/${id}/activate` : `/platform/tenants/${id}/suspend`;
      const res = await api.post(endpoint);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform', 'tenants'] });
      queryClient.invalidateQueries({ queryKey: ['platform', 'kpis'] });
    },
  });
}

export function usePlatformPlans() {
  return useQuery({
    queryKey: ['platform', 'plans'],
    queryFn: async () => {
      const res = await api.get('/platform/plans');
      return res.data?.data || [];
    },
    staleTime: 60000,
  });
}
