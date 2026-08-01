export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  is_featured: boolean;
  children?: Category[];
}

export interface ProductVariant {
  id: number;
  name: string;
  sku: string;
  price: number;
  sale_price?: number | null;
  quantity: number;
  image?: string | null;
}

export interface ProductImage {
  id: number;
  image_path: string;
  is_primary: boolean;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  sku: string;
  type: 'physical' | 'digital' | 'grouped' | 'bundle';
  summary?: string;
  description?: string;
  price: number;
  sale_price?: number | null;
  quantity: number;
  is_featured: boolean;
  has_variants: boolean;
  category?: Category;
  variants?: ProductVariant[];
  images?: ProductImage[];
}
