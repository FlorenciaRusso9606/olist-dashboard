'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { DashboardFilters } from '../types/api';
import { queryKeys } from '../lib/queryKeys';

export function useTrend(filters: DashboardFilters, grain: 'day' | 'week' = 'week') {
  return useQuery({
    queryKey: queryKeys.trend(filters, grain),
    queryFn: () => api.getTrend(filters, grain).then(res => res.data.data),
  });
}