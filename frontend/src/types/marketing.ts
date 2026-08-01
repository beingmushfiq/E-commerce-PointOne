export interface Coupon {
  id: number;
  code: string;
  type: 'fixed' | 'percentage';
  value: number;
  min_order_amount: number;
  max_discount?: number | null;
  starts_at?: string;
  expires_at?: string;
  is_active: boolean;
}

export interface FlashSale {
  id: number;
  title: string;
  slug: string;
  starts_at: string;
  ends_at: string;
  products?: any[];
}
