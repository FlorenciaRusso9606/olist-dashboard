import { KpiResult } from '../entities/KpiResult';
import { ProductRanking } from '../entities/ProductRanking';
import { RevenueTrend, TrendGrain } from '../entities/RevenueTrend';
import { SalesFilters } from '../filters/SalesFilters';

export interface SalesRepository {
  getKpis(filters: SalesFilters): Promise<KpiResult>;

  getRevenueTrend(
    filters: SalesFilters,
    grain: TrendGrain
  ): Promise<RevenueTrend>;

  getTopProducts(
    filters: SalesFilters,
    metric: 'gmv' | 'revenue',
    limit: number
  ): Promise<ProductRanking[]>;
}