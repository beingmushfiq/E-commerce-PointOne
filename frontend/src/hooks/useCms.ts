import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import type { Slider, MenuItem, Page, FaqItem } from '../types/cms';

export const useSliders = () => {
  return useQuery<Slider[]>({
    queryKey: ['sliders'],
    queryFn: async () => {
      const res = await api.get('/cms/sliders');
      return res.data.data;
    },
  });
};

export const useMenus = () => {
  return useQuery<MenuItem[]>({
    queryKey: ['menus'],
    queryFn: async () => {
      const res = await api.get('/cms/menus');
      return res.data.data;
    },
  });
};

export const usePage = (slug: string) => {
  return useQuery<Page>({
    queryKey: ['page', slug],
    queryFn: async () => {
      const res = await api.get(`/cms/pages/${slug}`);
      return res.data.data;
    },
    enabled: !!slug,
  });
};

export const useFaqs = () => {
  return useQuery<Record<string, FaqItem[]>>({
    queryKey: ['faqs'],
    queryFn: async () => {
      const res = await api.get('/cms/faqs');
      return res.data.data;
    },
  });
};
