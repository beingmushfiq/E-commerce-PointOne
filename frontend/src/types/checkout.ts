export interface CartItem {
  id: number;
  product_id: number;
  product_variant_id?: number | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  product: {
    name: string;
    slug: string;
    images?: { image_path: string }[];
  };
  variant?: {
    name: string;
    sku: string;
  };
}

export interface Cart {
  id: number;
  total_amount: number;
  items: CartItem[];
}

export interface OrderItem {
  id: number;
  product_name: string;
  variant_name?: string;
  unit_price: number;
  quantity: number;
  total_price: number;
}

export interface Order {
  id: number;
  order_number: string;
  status: string;
  payment_status: string;
  payment_method: string;
  subtotal: number;
  shipping_cost: number;
  tax_amount: number;
  grand_total: number;
  items: OrderItem[];
}
