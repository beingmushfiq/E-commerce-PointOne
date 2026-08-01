import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import type { Warehouse, Stock, Supplier, PurchaseOrder } from '../types/inventory';

export const useWarehouses = () => {
  return useQuery<Warehouse[]>({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const res = await api.get('/inventory/warehouses');
      return res.data.data;
    },
  });
};

export const useStocks = (params?: { low_stock?: boolean }) => {
  return useQuery<{ data: Stock[]; meta: any }>({
    queryKey: ['stocks', params],
    queryFn: async () => {
      const res = await api.get('/inventory/stocks', { params });
      return res.data;
    },
  });
};

export const useSuppliers = () => {
  return useQuery<Supplier[]>({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const res = await api.get('/inventory/suppliers');
      return res.data.data;
    },
  });
};

export const usePurchaseOrders = () => {
  return useQuery<PurchaseOrder[]>({
    queryKey: ['purchase-orders'],
    queryFn: async () => {
      const res = await api.get('/inventory/purchase-orders');
      return res.data.data;
    },
  });
};
