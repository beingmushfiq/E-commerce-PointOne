import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import type { Cart } from '../types/checkout';

export const useCart = () => {
  return useQuery<Cart>({
    queryKey: ['cart'],
    queryFn: async () => {
      const res = await api.get('/cart');
      return res.data.data;
    },
  });
};

export const useAddToCart = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { product_id: number; product_variant_id?: number; quantity: number }) => {
      const res = await api.post('/cart/add', payload);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
};

export const useProcessCheckout = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      payment_method: string;
      shipping_address: any;
      billing_address?: any;
      notes?: string;
    }) => {
      const res = await api.post('/checkout/process', payload);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
};
