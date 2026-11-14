import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ShoppingBag, Truck, ChevronRight
} from 'lucide-react';
import { useProducts } from '../../hooks/useCatalog';
import { useAddToCart } from '../../hooks/useCheckout';
import { useCurrency } from '../../contexts/CurrencyContext';
import { EditorialButton, Badge } from '../../components/DesignSystem';
import { useMagnetic, useParallax } from '../../hooks/useGsapMotion';
import type { ProductItem } from '../../types/ui';

export const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { data: productsData } = useProducts({ featured: false });
  const addToCartMutation = useAddToCart();
  const { formatPrice, currency } = useCurrency();

  const productsList: ProductItem[] = (productsData as any)?.data || productsData || [];
  const product = productsList.find((p) => p.slug === slug || p.id.toString() === slug);

  // GSAP Kinetic Hooks
  const pdpImageRef = useParallax<HTMLImageElement>({ speed: 10, scale: 1.05 });
  const addToBagBtnRef = useMagnetic<HTMLButtonElement>({ strength: 0.3 });
  const instantBuyBtnRef = useMagnetic<HTMLButtonElement>({ strength: 0.3 });

  // Variant selections
  const [selectedMaterial, setSelectedMaterial] = useState('18K Rose Gold');
  const [selectedDial, setSelectedDial] = useState('Obsidian Black');
  const [selectedDistrict, setSelectedDistrict] = useState('Dhaka');
  const [quantity, setQuantity] = useState(1);

  // Scroll to top on load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <h2 className="font-serif text-2xl font-bold mb-4">Masterpiece Not Found</h2>
        <p className="text-xs text-zinc-500 mb-6">The item you are searching for is unavailable or archived.</p>
        <EditorialButton onClick={() => navigate('/collections/all')} variant="primary">
          Back to Collections
        </EditorialButton>
      </div>
    );
  }

  const handleAddToCart = () => {
    addToCartMutation.mutate({ product_id: product.id, quantity });
  };

  const deliveryEstimates: Record<string, string> = {
    Dhaka: 'Guaranteed 24-Hour Express Delivery',
    Chittagong: 'Guaranteed 48-Hour Secure Delivery',
    Sylhet: 'Guaranteed 48-Hour Secure Delivery',
    Rajshahi: 'Guaranteed 48-Hour Secure Delivery',
    Khulna: 'Guaranteed 48-Hour Secure Delivery',
    Barisal: 'Guaranteed 72-Hour Delivery',
    Rangpur: 'Guaranteed 72-Hour Delivery',
    Mymensingh: 'Guaranteed 48-Hour Delivery',
  };

  // Structured Data (JSON-LD) for Programmatic SEO
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: product.image_url,
    description: product.summary || product.description,
    sku: product.sku || `CP-${product.id}`,
    brand: {
      '@type': 'Brand',
      name: 'CENTERPOINT Atelier',
    },
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: currency,
      availability: (product.stock_quantity ?? 0) > 0 ? 'https://schema.org/InStock' : 'https://schema.org/PreOrder',
      seller: {
        '@type': 'Organization',
        name: 'CENTERPOINT Luxury Commerce',
      },
    },
  };

  return (
    <div className="space-y-16 pb-28">
      {/* INJECT SCHEMA.ORG JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Breadcrumb Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <nav className="flex items-center gap-2 text-xs font-mono text-zinc-400">
          <Link to="/" className="hover:text-zinc-700 dark:hover:text-zinc-200">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <Link to="/collections/all" className="hover:text-zinc-700 dark:hover:text-zinc-200">Collections</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-zinc-800 dark:text-zinc-200 font-semibold truncate max-w-xs">{product.name}</span>
        </nav>
      </div>

      {/* Primary PDP Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          {/* Gallery Viewport */}
          <div className="space-y-4">
            <div className="aspect-square rounded-3xl overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-md">
              <img
                ref={pdpImageRef}
                src={product.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1000'}
                alt={product.name}
                className="w-full h-full object-cover object-center will-change-transform"
              />
            </div>
            <div className="grid grid-cols-4 gap-3">
              {[
                product.image_url,
                'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400',
                'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=400',
                'https://images.unsplash.com/photo-1547996160-71dfabbce5fa?w=400',
              ].map((img, idx) => (
                <div
                  key={idx}
                  className="aspect-square rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 cursor-pointer hover:border-amber-500 transition"
                >
                  <img src={img || ''} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>

          {/* Product Purchasing Form & Details */}
          <div className="space-y-8">
            <div className="space-y-2 border-b border-zinc-200 dark:border-zinc-800 pb-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400 font-bold">
                  SKU: {product.sku || 'CP-HORO-092'}
                </span>
                <Badge variant={(product.stock_quantity ?? 0) > 0 ? 'success' : 'warning'}>
                  {(product.stock_quantity ?? 0) > 0 ? 'In Stock — Atelier Verified' : 'Limited Allocation Pre-Order'}
                </Badge>
              </div>

              <h1 className="font-serif font-bold text-3xl sm:text-4xl text-zinc-900 dark:text-white leading-tight">
                {product.name}
              </h1>

              <div className="pt-2 flex items-baseline gap-4">
                <span className="font-mono font-bold text-3xl text-zinc-900 dark:text-white">
                  {formatPrice(product.price)}
                </span>
                {product.sale_price && (
                  <span className="font-mono text-sm text-zinc-400 line-through">
                    {formatPrice(product.sale_price)}
                  </span>
                )}
                <span className="text-xs text-zinc-400 font-mono">Tax & Atelier Certification Included</span>
              </div>
            </div>

            {/* Description */}
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed font-sans">
              {product.description || product.summary}
            </p>

            {/* Variant Selectors */}
            <div className="space-y-4 pt-2">
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-zinc-400 block mb-2">
                  Case Finishing
                </span>
                <div className="flex flex-wrap gap-2">
                  {['18K Rose Gold', 'Grade 5 Titanium', 'Platinum 950'].map((mat) => (
                    <button
                      key={mat}
                      onClick={() => setSelectedMaterial(mat)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-mono transition cursor-pointer border ${
                        selectedMaterial === mat
                          ? 'border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-400 font-bold'
                          : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
                      }`}
                    >
                      {mat}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-zinc-400 block mb-2">
                  Dial Palette
                </span>
                <div className="flex flex-wrap gap-2">
                  {['Obsidian Black', 'Sunburst Silver', 'Champagne Amber'].map((dial) => (
                    <button
                      key={dial}
                      onClick={() => setSelectedDial(dial)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-mono transition cursor-pointer border ${
                        selectedDial === dial
                          ? 'border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-400 font-bold'
                          : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
                      }`}
                    >
                      {dial}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Delivery Estimation Pill (Bangladesh-Native) */}
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                  <Truck className="w-4 h-4 text-amber-500" />
                  <span>Bangladesh Express Delivery</span>
                </span>
                <select
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  className="px-2 py-1 rounded-lg text-xs font-mono bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 cursor-pointer"
                >
                  {Object.keys(deliveryEstimates).map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                {deliveryEstimates[selectedDistrict]} via secure insured logistics.
              </p>
            </div>

            {/* Quantity and Primary Actions */}
            <div className="flex items-center gap-4 pt-2">
              <div className="flex items-center border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 px-3 py-2">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="text-zinc-400 hover:text-zinc-700 dark:hover:text-white px-2 cursor-pointer font-mono font-bold"
                >
                  -
                </button>
                <span className="px-3 text-xs font-mono font-bold text-zinc-900 dark:text-white">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="text-zinc-400 hover:text-zinc-700 dark:hover:text-white px-2 cursor-pointer font-mono font-bold"
                >
                  +
                </button>
              </div>

              <EditorialButton
                ref={addToBagBtnRef}
                onClick={handleAddToCart}
                size="lg"
                variant="primary"
                className="flex-1 bg-zinc-950 text-amber-400 hover:bg-black dark:bg-amber-500 dark:text-zinc-950 dark:hover:bg-amber-400"
                icon={<ShoppingBag className="w-4 h-4" />}
                data-cursor="pointer"
                data-cursor-text="ADD"
              >
                Add To Bag
              </EditorialButton>

              <EditorialButton
                ref={instantBuyBtnRef}
                onClick={() => navigate('/checkout')}
                size="lg"
                variant="amber"
                className="px-6 py-3 font-bold font-mono tracking-wider"
                data-cursor="pointer"
                data-cursor-text="BUY"
              >
                Instant Buy
              </EditorialButton>
            </div>
          </div>
        </div>
      </div>

      {/* MOBILE STICKY PURCHASE BAR (Fitts's Law Ergonomics, < 768px) */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-t border-zinc-200 dark:border-zinc-800 p-4 flex items-center justify-between gap-4 shadow-2xl">
        <div>
          <span className="text-[10px] font-mono text-zinc-400 block uppercase">Total</span>
          <span className="font-mono font-bold text-base text-zinc-950 dark:text-white">
            {formatPrice(product.price * quantity)}
          </span>
        </div>
        <EditorialButton
          onClick={handleAddToCart}
          size="md"
          variant="amber"
          className="flex-1 font-bold shadow-md"
          icon={<ShoppingBag className="w-4 h-4" />}
        >
          Add to Bag
        </EditorialButton>
      </div>
    </div>
  );
};
