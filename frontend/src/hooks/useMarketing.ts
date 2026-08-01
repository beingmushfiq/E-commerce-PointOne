import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../services/api';
import type { FlashSale } from '../types/marketing';

export const useApplyCoupon = () => {
  return useMutation({
    mutationFn: async (payload: { code: string; subtotal: number }) => {
      const res = await api.post('/marketing/apply-coupon', payload);
      return res.data.data;
    },
  });
};

export const useFlashSales = () => {
  return useQuery<FlashSale[]>({
    queryKey: ['flash-sales'],
    queryFn: async () => {
      const res = await api.get('/marketing/flash-sales');
      return res.data.data;
    },
  });
};

export const useNewsletterSubscribe = () => {
  return useMutation({
    mutationFn: async (email: string) => {
      const res = await api.post('/marketing/subscribe', { email });
      return res.data;
    },
  });
};
