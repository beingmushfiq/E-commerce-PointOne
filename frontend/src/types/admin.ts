export interface KpiData {
  total_sales: number;
  total_orders: number;
  total_products: number;
  total_customers: number;
}

export interface SalesChartData {
  month: string;
  total: number;
}

export interface SystemHealth {
  database: string;
  redis: string;
  storage: string;
  mail: string;
  timestamp: string;
}
