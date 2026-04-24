export interface ProductRanking {
  productId: string;
  productCategoryName: string | null;
  productCategoryNameEnglish: string | null;
  gmv: number;
  revenue: number;
  itemsSold: number;
  rank: number;
}