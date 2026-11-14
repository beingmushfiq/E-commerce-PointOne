import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SlidersHorizontal, Check } from 'lucide-react';
import { useProducts, useCategories } from '../../hooks/useCatalog';
import { useAddToCart } from '../../hooks/useCheckout';
import { useCurrency } from '../../contexts/CurrencyContext';
import { EditorialProductCard, EmptyStateCard, SkeletonCard } from '../../components/DesignSystem';
import type { ProductItem } from '../../types/ui';

export const CollectionPage: React.FC = () => {
  const { slug = 'all' } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { data: productsData, isLoading } = useProducts({ featured: false });
  const { data: categoriesData } = useCategories();
  const addToCartMutation = useAddToCart();
  const { formatPrice } = useCurrency();

  const [sortBy, setSortBy] = useState<'featured' | 'price_asc' | 'price_desc' | 'name'>('featured');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [priceRange, setPriceRange] = useState<number>(100000);

  const productsList: ProductItem[] = (productsData as any)?.data || productsData || [];
  const categoriesList: any[] = (categoriesData as any)?.data || categoriesData || [];

  const handleAddToCart = (product: ProductItem) => {
    addToCartMutation.mutate({ product_id: product.id, quantity: 1 });
  };

  // Filter products by collection slug
  const filtered = productsList.filter((p) => {
    if (slug !== 'all') {
      const matchSlug = p.category?.slug === slug || p.category_id?.toString() === slug;
      if (!matchSlug) return false;
    }
    if (inStockOnly && (p.stock_quantity ?? 0) <= 0) return false;
    if (p.price > priceRange) return false;
    return true;
  });

  // Sort products
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'price_asc') return a.price - b.price;
    if (sortBy === 'price_desc') return b.price - a.price;
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    return 0;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page Header */}
      <div className="border-b border-zinc-200 dark:border-zinc-800 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-mono uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400 font-bold block mb-1">
            Collection Registry
          </span>
          <h1 className="font-serif font-bold text-3xl sm:text-4xl text-zinc-900 dark:text-white capitalize">
            {slug === 'all' ? 'All Atelier Creations' : `${slug} Collection`}
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Showing {sorted.length} certified masterpieces
          </p>
        </div>

        {/* Sorting Dropdown */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-mono text-zinc-500">Sort by:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-1.5 rounded-xl text-xs font-mono font-semibold bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-200 focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="featured">Featured Curations</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="name">Alphabetical</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Filter Sidebar */}
        <div className="space-y-6 lg:col-span-1">
          <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <h3 className="font-serif font-bold text-sm text-zinc-900 dark:text-white flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-amber-500" />
                <span>Filters</span>
              </h3>
              {(slug !== 'all' || inStockOnly || priceRange < 100000) && (
                <button
                  onClick={() => {
                    navigate('/collections/all');
                    setInStockOnly(false);
                    setPriceRange(100000);
                  }}
                  className="text-[10px] font-mono text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                >
                  Reset All
                </button>
              )}
            </div>

            {/* Category Filter */}
            <div className="space-y-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 block font-bold">
                Categories
              </span>
              <div className="space-y-1">
                <button
                  onClick={() => navigate('/collections/all')}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition cursor-pointer flex items-center justify-between ${
                    slug === 'all'
                      ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 font-bold'
                      : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  <span>All Curations</span>
                  {slug === 'all' && <Check className="w-3.5 h-3.5 text-amber-500" />}
                </button>
                {categoriesList.map((cat: any) => (
                  <button
                    key={cat.id}
                    onClick={() => navigate(`/collections/${cat.slug || cat.id}`)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition cursor-pointer flex items-center justify-between ${
                      slug === (cat.slug || cat.id.toString())
                        ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 font-bold'
                        : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <span>{cat.name}</span>
                    {slug === (cat.slug || cat.id.toString()) && <Check className="w-3.5 h-3.5 text-amber-500" />}
                  </button>
                ))}
              </div>
            </div>

            {/* In-Stock Only Toggle */}
            <div className="space-y-2 border-t border-zinc-100 dark:border-zinc-800 pt-4">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-xs text-zinc-700 dark:text-zinc-300 font-medium">In-Stock Only</span>
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500 h-4 w-4"
                />
              </label>
            </div>

            {/* Price Max Slider */}
            <div className="space-y-2 border-t border-zinc-100 dark:border-zinc-800 pt-4">
              <div className="flex justify-between items-center text-xs">
                <span className="font-mono text-zinc-500">Max Price:</span>
                <span className="font-mono font-bold text-zinc-900 dark:text-white">
                  {formatPrice(priceRange)}
                </span>
              </div>
              <input
                type="range"
                min="1000"
                max="100000"
                step="5000"
                value={priceRange}
                onChange={(e) => setPriceRange(Number(e.target.value))}
                className="w-full accent-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Product Grid Area */}
        <div className="lg:col-span-3">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : sorted.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {sorted.map((product) => (
                <EditorialProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={handleAddToCart}
                  onClick={() => navigate(`/products/${product.slug || product.id}`)}
                />
              ))}
            </div>
          ) : (
            <EmptyStateCard
              title="No Creations Found"
              description="No products matched your active filters. Try resetting the filters or exploring other collections."
              actionText="Reset Filters"
              onAction={() => {
                navigate('/collections/all');
                setInStockOnly(false);
                setPriceRange(100000);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};
