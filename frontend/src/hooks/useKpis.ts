'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { DashboardFilters } from '../types/api';
import { queryKeys } from '../lib/queryKeys';

export function useKpis(filters: DashboardFilters) {
  return useQuery({
    queryKey: queryKeys.kpis(filters),
    queryFn: () => api.getKpis(filters).then(res => res.data),
  });
}