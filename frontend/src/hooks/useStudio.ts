import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

export function useStudioAnalytics() {
  return useQuery({
    queryKey: ['studio', 'analytics'],
    queryFn: async () => {
      const res = await api.get('/admin/analytics');
      return res.data?.data;
    },
    staleTime: 30000,
  });
}

export function useStudioOrders(params?: { status?: string; search?: string }) {
  return useQuery({
    queryKey: ['studio', 'orders', params],
    queryFn: async () => {
      const res = await api.get('/admin/orders', { params });
      return res.data?.data || [];
    },
    staleTime: 10000,
  });
}

export function useBookCourier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderId, courier, options }: { orderId: number; courier: string; options?: any }) => {
      const res = await api.post('/fulfillment/book', {
        order_id: orderId,
        courier,
        options,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studio', 'orders'] });
    },
  });
}

export function useStudioInventory() {
  return useQuery({
    queryKey: ['studio', 'inventory'],
    queryFn: async () => {
      const [stocksRes, warehousesRes] = await Promise.all([
        api.get('/inventory/stocks').catch(() => ({ data: { data: [] } })),
        api.get('/inventory/warehouses').catch(() => ({ data: { data: [] } })),
      ]);
      return {
        stocks: stocksRes.data?.data || [],
        warehouses: warehousesRes.data?.data || [],
      };
    },
    staleTime: 15000,
  });
}

export function useStudioFinance() {
  return useQuery({
    queryKey: ['studio', 'finance'],
    queryFn: async () => {
      const [accountsRes, journalsRes] = await Promise.all([
        api.get('/accounting/accounts').catch(() => ({ data: { data: [] } })),
        api.get('/accounting/journal-entries').catch(() => ({ data: { data: [] } })),
      ]);
      return {
        accounts: accountsRes.data?.data || [],
        journals: journalsRes.data?.data || [],
      };
    },
    staleTime: 15000,
  });
}

export function usePostJournalEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post('/accounting/journal-entries', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studio', 'finance'] });
    },
  });
}

export function useStudioSettings() {
  return useQuery({
    queryKey: ['studio', 'settings'],
    queryFn: async () => {
      const res = await api.get('/admin/store-settings');
      return res.data?.data;
    },
    staleTime: 60000,
  });
}

export function useUpdateStudioSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.put('/admin/store-settings', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studio', 'settings'] });
    },
  });
}
