export interface SalesFilters {
  from: Date;
  to: Date;
  customerState?: string;          
  productCategory?: string;        
  orderStatus?: string;            
}