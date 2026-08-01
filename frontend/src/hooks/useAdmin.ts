import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import type { KpiData, SalesChartData, SystemHealth } from '../types/admin';

export const useAdminAnalytics = () => {
  return useQuery<{ kpi: KpiData; recent_orders: any[]; sales_chart: SalesChartData[] }>({
    queryKey: ['admin-analytics'],
    queryFn: async () => {
      const res = await api.get('/admin/analytics');
      return res.data.data;
    },
  });
};

export const useSystemHealth = () => {
  return useQuery<SystemHealth>({
    queryKey: ['system-health'],
    queryFn: async () => {
      const res = await api.get('/admin/health');
      return res.data.data;
    },
  });
};
