export interface KpiData {
  gmv: number;
  revenue: number;
  orders: number;
  aov: number;
  itemsPerOrder: number;
  cancellationRate: number;
  onTimeDeliveryRate: number;
  totalFreight: number;
  cancellationRatePct: number;
  onTimeDeliveryRatePct: number;
}

export interface KpiResponse {
  success: boolean;
  data: KpiData;
  filters: { from: string; to: string };
}

export interface TrendPoint {
  period: string;
  revenue: number;
  orders: number;
  gmv: number;
}

export interface TrendResponse {
  success: boolean;
  data: {
    grain: 'day' | 'week';
    data: TrendPoint[];
  };
}

export interface ProductRanking {
  productId: string;
  productCategoryName: string | null;
  productCategoryNameEnglish: string | null;
  gmv: number;
  revenue: number;
  itemsSold: number;
  rank: number;
}

export interface RankingsResponse {
  success: boolean;
  data: ProductRanking[];
  meta: {
    metric: 'gmv' | 'revenue';
    limit: number;
    count: number;
  };
}

// General filters
export interface DashboardFilters {
  from: string;         
  to: string;           
  productCategory?: string;
  orderStatus?: string;
}