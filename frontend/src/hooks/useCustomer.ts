import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import type { Address, Wallet, SupportTicket } from '../types/customer';

export const useCustomerAddresses = () => {
  return useQuery<Address[]>({
    queryKey: ['customer-addresses'],
    queryFn: async () => {
      const res = await api.get('/customer/addresses');
      return res.data.data;
    },
  });
};

export const useCreateAddress = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<Address, 'id'>) => {
      const res = await api.post('/customer/addresses', data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-addresses'] });
    },
  });
};

export const useCustomerWallet = () => {
  return useQuery<Wallet>({
    queryKey: ['customer-wallet'],
    queryFn: async () => {
      const res = await api.get('/customer/wallet');
      return res.data.data;
    },
  });
};

export const useToggleWishlist = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (productId: number) => {
      const res = await api.post(`/customer/wishlist/${productId}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-wishlist'] });
    },
  });
};

export const useCustomerTickets = () => {
  return useQuery<SupportTicket[]>({
    queryKey: ['customer-tickets'],
    queryFn: async () => {
      const res = await api.get('/customer/tickets');
      return res.data.data;
    },
  });
};
