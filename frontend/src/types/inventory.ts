export interface Warehouse {
  id: number;
  name: string;
  code: string;
  address: string;
  city: string;
  country: string;
  is_active: boolean;
  stocks_count?: number;
}

export interface Stock {
  id: number;
  warehouse_id: number;
  product_id: number;
  product_variant_id?: number | null;
  quantity: number;
  reserved_quantity: number;
  low_stock_threshold: number;
  warehouse?: Warehouse;
  product?: { name: string; sku: string };
}

export interface Supplier {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  company_name?: string;
}

export interface PurchaseOrder {
  id: number;
  po_number: string;
  status: 'draft' | 'ordered' | 'received' | 'cancelled';
  total_cost: number;
  supplier?: Supplier;
  warehouse?: Warehouse;
}
