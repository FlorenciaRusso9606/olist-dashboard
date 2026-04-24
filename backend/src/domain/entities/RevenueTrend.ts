export type TrendGrain = 'day' | 'week';

export interface RevenueTrendPoint {
  period: string;    // '2018-07-04' for day, '2018-W27' for week
  revenue: number;
  orders: number;
  gmv: number;
}

export interface RevenueTrend {
  grain: TrendGrain;
  data: RevenueTrendPoint[];
}