import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import type { Category, Product } from '../types/catalog';

export const useCategories = () => {
  return useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.get('/categories');
      return res.data.data;
    },
  });
};

export const useProducts = (params?: { category?: string; search?: string; featured?: boolean }) => {
  return useQuery<{ data: Product[]; meta: any }>({
    queryKey: ['products', params],
    queryFn: async () => {
      const res = await api.get('/products', { params });
      return res.data;
    },
  });
};

export const useProductDetail = (slug: string) => {
  return useQuery<Product>({
    queryKey: ['product', slug],
    queryFn: async () => {
      const res = await api.get(`/products/${slug}`);
      return res.data.data;
    },
    enabled: !!slug,
  });
};
