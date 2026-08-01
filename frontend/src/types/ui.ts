export interface ProductItem {
  id: number;
  name: string;
  sku: string;
  price: number;
  sale_price?: number;
  stock_quantity: number;
  is_featured: boolean;
  category?: { id: number; name: string };
  category_id?: number;
  image_url?: string;
  summary?: string;
  description?: string;
}
