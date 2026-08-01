import { useState } from 'react';
import { useSliders, useMenus } from './hooks/useCms';
import { useProducts, useCategories } from './hooks/useCatalog';
import { useCart, useAddToCart, useProcessCheckout } from './hooks/useCheckout';
import {
  ShoppingBag, Search, Sparkles, ArrowRight,
  CheckCircle2, Package
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import {
  EditorialButton,
  CommandPalette,
  EditorialProductCard,
  CartDrawer
} from './components/DesignSystem';
import type { ProductItem } from './types/ui';
import { StudioCMS } from './components/StudioCMS';

export default function App() {
  const { data: _sliders } = useSliders();
  const { data: _menus } = useMenus();
  const { data: categories } = useCategories();
  const { data: productsData } = useProducts({ featured: false });
  const { data: cart } = useCart();
  const addToCartMutation = useAddToCart();
  const processCheckoutMutation = useProcessCheckout();

  // Mode Switcher: 'storefront' vs 'cms'
  const [viewMode, setViewMode] = useState<'storefront' | 'cms'>('storefront');

  // Interactive UI States
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [inspectProduct, setInspectProduct] = useState<ProductItem | null>(null);

  // Checkout modal state
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutSuccessOrder, setCheckoutSuccessOrder] = useState<any>(null);
  const [shippingAddress, setShippingAddress] = useState({
    full_name: 'Alexander Wright',
    phone: '+1 (555) 019-2834',
    address_line_1: '742 Evergreen Terrace',
    city: 'San Francisco',
    country: 'United States',
  });
  const [paymentMethod] = useState('cod');

  const productsList: ProductItem[] = (productsData as any)?.data || productsData || [];
  const cartItems = cart?.items || [];
  const cartCount = cartItems.reduce((acc: number, item: any) => acc + item.quantity, 0);

  const handleAddToCart = (product: ProductItem) => {
    addToCartMutation.mutate({ product_id: product.id, quantity: 1 });
    setIsCartOpen(true);
  };

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    processCheckoutMutation.mutate(
      {
        payment_method: paymentMethod,
        shipping_address: shippingAddress,
      },
      {
        onSuccess: (data) => {
          setCheckoutSuccessOrder(data.order);
        },
      }
    );
  };

  const filteredProducts = productsList.filter(p => {
    if (activeCategory === 'all') return true;
    return p.category_id?.toString() === activeCategory || p.category?.name === activeCategory;
  });

  // Render Admin Studio CMS Mode
  if (viewMode === 'cms') {
    return (
      <StudioCMS
        products={productsList}
        categories={categories || []}
        onOpenStorefront={() => setViewMode('storefront')}
      />
    );
  }

  // Render Crisp Light Storefront
  return (
    <div className="min-h-screen bg-[#fafafa] text-[#18181b] font-sans antialiased selection:bg-amber-100">
      {/* 1. TOP TICKER BAR */}
      <div className="bg-zinc-900 text-white text-xs font-medium py-2.5 px-6 flex items-center justify-between shadow-inner">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> FREE GLOBAL EXPRESS SHIPPING
          </span>
          <span className="hidden md:inline text-zinc-600">|</span>
          <span className="hidden md:inline text-zinc-300">Complimentary 30-Day Returns</span>
        </div>

        <div className="flex items-center gap-5 text-xs">
          <button
            onClick={() => setIsCommandOpen(true)}
            className="hover:text-amber-400 transition flex items-center gap-1.5"
          >
            <kbd className="px-1.5 py-0.5 text-[10px] bg-zinc-800 rounded border border-zinc-700 text-zinc-200">⌘K</kbd>
            <span>Search & Actions</span>
          </button>
        </div>
      </div>

      {/* 2. HEADER NAVIGATION */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-zinc-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between gap-6">
          {/* Logo Insignia */}
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setActiveCategory('all')}>
            <div className="w-10 h-10 rounded-xl bg-zinc-900 text-amber-400 p-2 flex items-center justify-center shadow-md group-hover:scale-105 transition duration-300 border border-zinc-800">
              <svg viewBox="0 0 512 512" className="w-full h-full fill-current">
                <path d="M 140 140 H 372 C 390 140 400 152 400 170 V 200 H 220 V 312 H 372 C 390 312 400 324 400 342 V 372 H 140 Z" />
                <circle cx="390" cy="140" r="28" fill="#fbbf24" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-xl tracking-tight text-zinc-900 leading-none font-sans">
                CENTERPOINT<span className="text-amber-600">.</span>
              </span>
              <span className="text-[10px] tracking-widest uppercase font-semibold text-zinc-400 mt-0.5">
                CURATED LUXURY STOREFRONT
              </span>
            </div>
          </div>

          {/* Category Navigation Bar */}
          <nav className="hidden lg:flex items-center gap-8 text-xs font-semibold text-zinc-600 uppercase tracking-wider">
            <button
              onClick={() => setActiveCategory('all')}
              className={`hover:text-zinc-900 transition ${activeCategory === 'all' ? 'text-zinc-900 border-b-2 border-zinc-900 pb-1' : ''}`}
            >
              All Collections
            </button>
            {categories?.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id.toString())}
                className={`hover:text-zinc-900 transition ${activeCategory === cat.id.toString() ? 'text-zinc-900 border-b-2 border-zinc-900 pb-1' : ''}`}
              >
                {cat.name}
              </button>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsCommandOpen(true)}
              className="p-2.5 text-zinc-600 hover:text-zinc-900 rounded-xl hover:bg-zinc-100 transition"
              title="Search Products"
            >
              <Search className="w-5 h-5" />
            </button>

            <button
              onClick={() => setIsCartOpen(true)}
              className="relative px-4 py-2 bg-zinc-900 hover:bg-black text-white rounded-xl transition flex items-center gap-2.5 shadow-md"
            >
              <ShoppingBag className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold font-sans">Bag ({cartCount})</span>
            </button>
          </div>
        </div>
      </header>

      {/* 3. HERO SECTION */}
      <section className="relative py-20 md:py-28 px-6 border-b border-zinc-200 bg-white">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-800">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" /> New Seasonal Arrivals 2026
            </div>

            <h1 className="text-4xl sm:text-6xl font-normal tracking-tight text-zinc-900 leading-[1.1] font-editorial">
              Crafted for Modern Living. <br />
              <span className="text-zinc-500 italic">Thoughtfully Designed.</span>
            </h1>

            <p className="text-base text-zinc-600 max-w-xl leading-relaxed font-sans">
              Explore our handpicked collection of apparel, home essentials, luxury accessories, and audio gear built with timeless craftsmanship.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-4">
              <EditorialButton
                variant="primary"
                size="lg"
                onClick={() => setActiveCategory('all')}
                icon={<ArrowRight className="w-4 h-4" />}
              >
                Shop All Products
              </EditorialButton>

              <EditorialButton
                variant="secondary"
                size="lg"
                onClick={() => setViewMode('cms')}
              >
                Open Admin Studio
              </EditorialButton>
            </div>
          </div>

          <div className="lg:col-span-5 relative">
            <div className="aspect-[4/5] bg-zinc-100 border border-zinc-200 rounded-3xl overflow-hidden shadow-2xl relative group">
              <img
                src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1000&q=80"
                alt="Featured Collection"
                className="w-full h-full object-cover group-hover:scale-105 transition duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-end p-8 text-white">
                <span className="text-xs uppercase font-mono tracking-widest text-amber-300">Featured Spotlight</span>
                <h3 className="text-xl font-bold mt-1">Botanical & Apparel Edition</h3>
                <p className="text-xs text-zinc-200 mt-1">Discover organic textures and sustainable materials.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. PRODUCT CATALOG MATRIX */}
      <section className="py-16 px-6 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10 border-b border-zinc-200 pb-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-amber-700">Explore Catalog</span>
            <h2 className="text-2xl font-bold text-zinc-900 mt-1">Curated Products</h2>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
                activeCategory === 'all'
                  ? 'bg-zinc-900 text-white shadow-sm'
                  : 'bg-white text-zinc-600 hover:text-zinc-900 border border-zinc-200'
              }`}
            >
              All Items ({productsList.length})
            </button>
            {categories?.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id.toString())}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
                  activeCategory === cat.id.toString()
                    ? 'bg-zinc-900 text-white shadow-sm'
                    : 'bg-white text-zinc-600 hover:text-zinc-900 border border-zinc-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProducts.length > 0 ? (
            filteredProducts.map((product) => (
              <EditorialProductCard
                key={product.id}
                product={product}
                onQuickView={(p) => setInspectProduct(p)}
                onAddToCart={(p) => handleAddToCart(p)}
              />
            ))
          ) : (
            <div className="col-span-full py-20 text-center text-xs text-zinc-500 bg-white border border-zinc-200 rounded-2xl">
              No products found in this category.
            </div>
          )}
        </div>
      </section>

      {/* 5. FOOTER */}
      <footer className="border-t border-zinc-200 bg-white py-12 px-6 text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <span className="font-bold text-sm text-zinc-900">CENTERPOINT</span>
            <span>© 2026 Centerpoint Storefront. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-6 font-medium">
            <a href="#" className="hover:text-zinc-900 transition">Privacy Policy</a>
            <a href="#" className="hover:text-zinc-900 transition">Shipping & Returns</a>
            <a href="#" className="hover:text-zinc-900 transition">Contact Support</a>
          </div>
        </div>
      </footer>

      {/* OVERLAYS & MODALS */}
      <CommandPalette
        isOpen={isCommandOpen}
        onClose={() => setIsCommandOpen(false)}
        products={productsList}
        onSelectProduct={(p) => setInspectProduct(p)}
        onToggleViewMode={(mode) => setViewMode(mode)}
      />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onCheckout={() => setIsCheckoutOpen(true)}
      />

      {/* Product Inspect Modal */}
      <AnimatePresence>
        {inspectProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setInspectProduct(null)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-3xl bg-white border border-zinc-200 rounded-2xl overflow-hidden z-10 p-8 grid grid-cols-1 md:grid-cols-2 gap-8 shadow-2xl"
            >
              <div className="aspect-square bg-zinc-50 rounded-xl overflow-hidden flex items-center justify-center p-4 border border-zinc-200">
                {inspectProduct.image_url ? (
                  <img src={inspectProduct.image_url} alt="" className="w-full h-full object-cover rounded-lg" />
                ) : (
                  <Package className="w-16 h-16 text-zinc-300" />
                )}
              </div>

              <div className="flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-amber-700">
                      {inspectProduct.category?.name || 'Store'}
                    </span>
                    <button onClick={() => setInspectProduct(null)} className="text-zinc-400 hover:text-zinc-900">✕</button>
                  </div>

                  <h2 className="text-xl font-bold text-zinc-900 mt-2">{inspectProduct.name}</h2>

                  <div className="text-2xl font-bold text-zinc-900 mt-4">
                    ${Number(inspectProduct.price).toFixed(2)}
                  </div>

                  <p className="text-xs text-zinc-600 mt-4 leading-relaxed">
                    {inspectProduct.description || inspectProduct.summary || 'Premium quality handcrafted goods.'}
                  </p>
                </div>

                <div className="pt-6 border-t border-zinc-100 flex gap-4">
                  <EditorialButton
                    variant="bronze"
                    size="md"
                    className="flex-1"
                    onClick={() => {
                      handleAddToCart(inspectProduct);
                      setInspectProduct(null);
                    }}
                    icon={<ShoppingBag className="w-4 h-4" />}
                  >
                    Add to Bag
                  </EditorialButton>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FOOTER */}
      <footer className="bg-zinc-900 text-zinc-400 text-xs py-12 px-6 border-t border-zinc-800 mt-20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <span className="font-bold text-white tracking-wider text-sm">CENTERPOINT.</span>
            <p className="mt-1 text-zinc-500">© 2026 Centerpoint Inc. All rights reserved. Curated luxury e-commerce.</p>
          </div>

          <div className="flex items-center gap-6">
            <button
              onClick={() => setViewMode('cms')}
              className="text-zinc-500 hover:text-amber-400 transition text-[11px]"
            >
              Admin Portal
            </button>
          </div>
        </div>
      </footer>

      {/* Checkout Dialog Modal */}
      <AnimatePresence>
        {isCheckoutOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCheckoutOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg bg-white border border-zinc-200 rounded-2xl overflow-hidden z-10 p-8 shadow-2xl"
            >
              {checkoutSuccessOrder ? (
                <div className="text-center py-8 space-y-4">
                  <CheckCircle2 className="w-16 h-16 text-emerald-600 mx-auto" />
                  <h3 className="text-xl font-bold text-zinc-900">Order Confirmed!</h3>
                  <p className="text-xs font-mono text-zinc-500">Order #{checkoutSuccessOrder.order_number || checkoutSuccessOrder.id}</p>
                  <p className="text-xs text-zinc-600">Thank you for your order. We have sent a confirmation email with your delivery details.</p>
                  <EditorialButton variant="secondary" size="md" onClick={() => { setIsCheckoutOpen(false); setCheckoutSuccessOrder(null); }}>
                    Back to Store
                  </EditorialButton>
                </div>
              ) : (
                <form onSubmit={handleCheckoutSubmit} className="space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-900">Shipping Details</h3>
                    <button type="button" onClick={() => setIsCheckoutOpen(false)} className="text-zinc-400 hover:text-zinc-900">✕</button>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="text-xs font-semibold text-zinc-700">Full Name</label>
                      <input
                        type="text"
                        required
                        value={shippingAddress.full_name}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, full_name: e.target.value })}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-2.5 text-zinc-900 mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-zinc-700">Shipping Address</label>
                      <input
                        type="text"
                        required
                        value={shippingAddress.address_line_1}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, address_line_1: e.target.value })}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-2.5 text-zinc-900 mt-1"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-zinc-700">City</label>
                        <input
                          type="text"
                          required
                          value={shippingAddress.city}
                          onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                          className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-2.5 text-zinc-900 mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-zinc-700">Country</label>
                        <input
                          type="text"
                          required
                          value={shippingAddress.country}
                          onChange={(e) => setShippingAddress({ ...shippingAddress, country: e.target.value })}
                          className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-2.5 text-zinc-900 mt-1"
                        />
                      </div>
                    </div>
                  </div>

                  <EditorialButton variant="bronze" size="lg" className="w-full" type="submit">
                    Complete Order
                  </EditorialButton>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
