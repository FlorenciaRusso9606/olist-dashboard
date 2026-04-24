import { DashboardFilters } from '../types/api';

export const queryKeys = {
  kpis: (filters: DashboardFilters) =>
    ['kpis', filters] as const,

  trend: (filters: DashboardFilters, grain: 'day' | 'week') =>
    ['trend', filters, grain] as const,

  rankings: (filters: DashboardFilters, metric: 'gmv' | 'revenue', limit: number) =>
    ['rankings', filters, metric, limit] as const,
};