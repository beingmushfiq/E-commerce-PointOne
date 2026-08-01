export interface Slider {
  id: number;
  title: string;
  subtitle?: string;
  image: string;
  button_text?: string;
  button_link?: string;
  sort_order: number;
}

export interface MenuItem {
  id: number;
  title: string;
  url: string;
  icon?: string;
  type: string;
  children?: MenuItem[];
}

export interface Page {
  id: number;
  title: string;
  slug: string;
  content: string;
  meta_title?: string;
  meta_description?: string;
}

export interface BlogPost {
  id: number;
  title: string;
  slug: string;
  featured_image?: string;
  excerpt?: string;
  content: string;
  published_at: string;
  category?: { name: string; slug: string };
  author?: { name: string };
}

export interface FaqItem {
  id: number;
  category: string;
  question: string;
  answer: string;
}
