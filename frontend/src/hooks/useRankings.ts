'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { DashboardFilters } from '../types/api';
import { queryKeys } from '../lib/queryKeys';

export function useRankings(
  filters: DashboardFilters,
  metric: 'gmv' | 'revenue',
  limit: number = 10
) {
  return useQuery({
    queryKey: queryKeys.rankings(filters, metric, limit),
    queryFn: () => api.getRankings(filters, metric, limit).then(res => res.data),
  });
}