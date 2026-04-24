import {
  KpiResponse,
  TrendResponse,
  RankingsResponse,
  DashboardFilters,
} from '../types/api';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

// Convierte los filtros a query params de URL
function buildParams(filters: DashboardFilters, extra?: Record<string, string | number>): string {
  const params = new URLSearchParams();
  params.set('from', filters.from);
  params.set('to', filters.to);
  if (filters.productCategory) params.set('productCategory', filters.productCategory);
  if (filters.orderStatus)     params.set('orderStatus', filters.orderStatus);
  if (extra) {
    Object.entries(extra).forEach(([k, v]) => params.set(k, String(v)));
  }
  return params.toString();
}

// Función helper para hacer fetch con manejo de errores
async function apiFetch<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Error desconocido' }));
    throw new Error(error.message ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  getKpis: (filters: DashboardFilters): Promise<KpiResponse> =>
    apiFetch(`${BASE_URL}/kpis?${buildParams(filters)}`),

  getTrend: (
    filters: DashboardFilters,
    grain: 'day' | 'week' = 'week'
  ): Promise<TrendResponse> =>
    apiFetch(`${BASE_URL}/trend/revenue?${buildParams(filters, { grain })}`),

  getRankings: (
    filters: DashboardFilters,
    metric: 'gmv' | 'revenue' = 'revenue',
    limit: number = 10
  ): Promise<RankingsResponse> =>
    apiFetch(`${BASE_URL}/rankings/products?${buildParams(filters, { metric, limit })}`),
};