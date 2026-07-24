import { useQuery } from '@tanstack/react-query';
import { api } from './api';
import type {
  Article,
  Issue,
  EditorialMember,
  FaqItem,
  CmsPage,
  SiteSettings,
  NewsItem,
  NavItemType,
  PaymentMethodsConfig,
  ApiResponse,
  PaginatedResponse,
  Hero,
  CallForPaper,
} from '@/types';

export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<SiteSettings>>('/settings');
      return data.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useNav() {
  return useQuery({
    queryKey: ['nav'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<NavItemType[]>>('/nav');
      return data.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function usePaymentMethods() {
  return useQuery({
    queryKey: ['payment-methods'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<PaymentMethodsConfig>>('/payments/methods');
      return data.data;
    },
  });
}

export function useCurrentIssue() {
  return useQuery({
    queryKey: ['issues', 'current'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Issue>>('/issues/current');
      return data.data;
    },
  });
}

export function useIssues(params?: { year?: number; volume?: number; page?: number }) {
  return useQuery({
    queryKey: ['issues', params],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Issue>>('/issues', { params });
      return data;
    },
  });
}

export function useIssue(id: string | undefined) {
  return useQuery({
    queryKey: ['issues', id],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Issue>>(`/issues/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}

export function useArticles(params?: {
  search?: string;
  subject?: string;
  year?: number;
  volume?: number;
  issue?: number;
  page?: number;
}) {
  return useQuery({
    queryKey: ['articles', params],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Article>>('/articles', { params });
      return data;
    },
  });
}

export function useFeaturedArticles() {
  return useQuery({
    queryKey: ['articles', 'featured'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Article[]>>('/articles/featured');
      return data.data;
    },
  });
}

export function useArticle(slug: string | undefined) {
  return useQuery({
    queryKey: ['articles', slug],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Article>>(`/articles/${slug}`);
      return data.data;
    },
    enabled: !!slug,
  });
}

export function useEditorialBoard() {
  return useQuery({
    queryKey: ['editorial-board'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<EditorialMember[]>>('/editorial-board');
      return data.data;
    },
  });
}

export function useFaqs() {
  return useQuery({
    queryKey: ['faqs'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<FaqItem[]>>('/faqs');
      return data.data;
    },
  });
}

export function useCmsPage(slug: string) {
  return useQuery({
    queryKey: ['pages', slug],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<CmsPage>>(`/pages/${slug}`);
      return data.data;
    },
  });
}

export function useNews() {
  return useQuery({
    queryKey: ['news'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<NewsItem[]>>('/news');
      return data.data;
    },
  });
}

export function useHeroes() {
  return useQuery({
    queryKey: ['heroes'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Hero[]>>('/heroes');
      return data.data;
    },
  });
}

export function useAdminHeroes() {
  return useQuery({
    queryKey: ['admin-heroes'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Hero[]>>('/admin/heroes');
      return data.data;
    },
  });
}

export function useActiveCfp() {
  return useQuery({
    queryKey: ['cfps', 'active'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<CallForPaper>>('/cfps/active');
      return data.data;
    },
  });
}
