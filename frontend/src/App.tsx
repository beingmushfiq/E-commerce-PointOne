import { useState, useEffect } from 'react';
import { useSliders, useMenus } from './hooks/useCms';
import { useProducts, useCategories } from './hooks/useCatalog';
import { useCart, useAddToCart, useProcessCheckout } from './hooks/useCheckout';
import {
  ShoppingBag, Search, Sparkles, ArrowRight, Sun, Moon,
  CheckCircle2, ShieldCheck, Truck, Clock, Lock, ChevronDown
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
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { CurrencyProvider, useCurrency, type CurrencyCode } from './contexts/CurrencyContext';
import { MotionProvider, useMotion } from './contexts/MotionContext';
import { SmoothScroll } from './components/SmoothScroll';
import { LuxuryLoader } from './components/LuxuryLoader';
import { FloatingAiWidget } from './components/FloatingAiWidget';
import { McpLogin } from './pages/MasterControlPanel/McpLogin';
import { MasterControlCenter } from './pages/MasterControlPanel/MasterControlCenter';
import api from './services/api';

/* -------------------------------------------------------------------------- */
/* MAIN STOREFRONT INNER COMPONENT                                            */
/* -------------------------------------------------------------------------- */
function StorefrontContent() {
  const { theme, toggleTheme } = useTheme();
  const { currency, setCurrency, formatPrice, currencies } = useCurrency();
  const { config: _motionConfig } = useMotion();

  const { data: _sliders } = useSliders();
  const { data: _menus } = useMenus();
  const { data: categories } = useCategories();
  const { data: productsData } = useProducts({ featured: false });
  const { data: cart } = useCart();
  const addToCartMutation = useAddToCart();
  const processCheckoutMutation = useProcessCheckout();

  // Mode Switcher: 'storefront' | 'cms' | 'mcp_login' | 'mcp'
  const [viewMode, setViewMode] = useState<'storefront' | 'cms' | 'mcp_login' | 'mcp'>('storefront');

  // Interactive UI States
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [inspectProduct, setInspectProduct] = useState<ProductItem | null>(null);
  const [isCurrencyDropdownOpen, setIsCurrencyDropdownOpen] = useState(false);

  // Checkout modal state
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutSuccessOrder, setCheckoutSuccessOrder] = useState<any>(null);
  const [shippingAddress, setShippingAddress] = useState({
    full_name: 'Mushfiqur Rahman',
    phone: '+880 1712-345678',
    address_line_1: 'House 42, Road 11, Banani',
    city: 'Dhaka',
    country: 'Bangladesh',
  });
  const [paymentMethod, setPaymentMethod] = useState('bkash');

  // Load public config for ticker & branding
  const [storeConfig, setStoreConfig] = useState<any>(null);

  useEffect(() => {
    api.get('/storefront/config').then(res => {
      setStoreConfig(res.data?.data);
    }).catch(() => {});

    // Listen for hash navigation e.g. #mcp-login
    const handleHash = () => {
      if (window.location.hash === '#mcp-login') {
        setViewMode('mcp_login');
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

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

  // 1. RENDER SECRET MASTER CONTROL PANEL LOGIN
  if (viewMode === 'mcp_login') {
    return (
      <McpLogin
        onLoginSuccess={() => setViewMode('mcp')}
        onBackToStore={() => {
          window.location.hash = '';
          setViewMode('storefront');
        }}
      />
    );
  }

  // 2. RENDER MASTER CONTROL CENTER (OMNIPOTENT OWNER DECK)
  if (viewMode === 'mcp') {
    return (
      <MasterControlCenter
        onBackToStorefront={() => {
          window.location.hash = '';
          setViewMode('storefront');
        }}
        onLogout={() => {
          localStorage.removeItem('mcp_token');
          window.location.hash = '';
          setViewMode('storefront');
        }}
      />
    );
  }

  // 3. RENDER ADMIN STUDIO CMS
  if (viewMode === 'cms') {
    return (
      <StudioCMS
        products={productsList}
        categories={categories || []}
        onOpenStorefront={() => setViewMode('storefront')}
      />
    );
  }

  // 4. RENDER LUXURY STOREFRONT
  return (
    <div className="min-h-screen bg-[#FAFAF9] dark:bg-[#09090B] text-zinc-900 dark:text-zinc-100 font-sans antialiased selection:bg-amber-500 selection:text-black transition-colors duration-300">
      {/* 1. TOP TICKER BAR */}
      <div className="bg-zinc-950 text-white text-[11px] font-medium py-2.5 px-6 flex items-center justify-between border-b border-zinc-900">
        <div className="flex items-center gap-3 overflow-hidden whitespace-nowrap">
          <span className="flex items-center gap-1.5 text-amber-400 font-mono font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            {storeConfig?.header?.ticker_announcement || 'COMPLIMENTARY EXPRESS DELIVERY ON ORDERS OVER ৳ 50,000 | WORLDWIDE CONCIERGE'}
          </span>
        </div>

        {/* Right Action Tools: Currency Switcher & Theme Toggle & ⌘K */}
        <div className="flex items-center gap-4 text-xs shrink-0">
          {/* Currency Switcher */}
          <div className="relative">
            <button
              onClick={() => setIsCurrencyDropdownOpen(!isCurrencyDropdownOpen)}
              className="flex items-center gap-1 text-zinc-300 hover:text-amber-400 transition font-mono font-semibold"
            >
              <span>{currency} ({currencies[currency]?.symbol})</span>
              <ChevronDown className="w-3 h-3" />
            </button>

            {isCurrencyDropdownOpen && (
              <div className="absolute right-0 mt-2 w-32 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl py-1 z-50">
                {(['BDT', 'USD', 'EUR'] as CurrencyCode[]).map((code) => (
                  <button
                    key={code}
                    onClick={() => {
                      setCurrency(code);
                      setIsCurrencyDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs font-mono flex items-center justify-between hover:bg-zinc-800 ${
                      currency === code ? 'text-amber-400 font-bold' : 'text-zinc-300'
                    }`}
                  >
                    <span>{code}</span>
                    <span>{currencies[code]?.symbol}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <span className="text-zinc-700">|</span>

          {/* Circular Dark/Light Toggle */}
          <button
            onClick={toggleTheme}
            className="p-1 rounded-lg text-zinc-400 hover:text-amber-400 hover:bg-zinc-900 transition flex items-center gap-1.5"
            title={`Switch to ${theme === 'light' ? 'Dark Mode' : 'Light Mode'}`}
          >
            {theme === 'light' ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5 text-amber-400" />}
            <span className="hidden sm:inline capitalize text-[10px] font-mono">{theme}</span>
          </button>

          <span className="text-zinc-700">|</span>

          {/* ⌘K Palette */}
          <button
            onClick={() => setIsCommandOpen(true)}
            className="hover:text-amber-400 transition flex items-center gap-1.5 text-[11px] font-mono"
          >
            <kbd className="px-1.5 py-0.5 text-[9px] bg-zinc-900 rounded border border-zinc-800 text-zinc-300">⌘K</kbd>
            <span className="hidden sm:inline">Search</span>
          </button>

          <span className="text-zinc-700">|</span>

          {/* Discreet Owner Ingress */}
          <button
            onClick={() => setViewMode('mcp_login')}
            className="text-zinc-500 hover:text-amber-400 transition flex items-center gap-1 text-[10px] font-mono"
            title="Owner Master Control Panel (/mcp-login)"
          >
            <Lock className="w-3 h-3" />
            <span className="hidden md:inline">MCP</span>
          </button>
        </div>
      </div>

      {/* 2. HEADER NAVIGATION */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#09090B]/80 backdrop-blur-xl border-b border-zinc-200/80 dark:border-zinc-800/80 shadow-sm transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between gap-6">
          {/* Logo Insignia */}
          <div
            className="flex items-center gap-3.5 cursor-pointer group select-none"
            onClick={() => setActiveCategory('all')}
          >
            <div className="w-10 h-10 rounded-xl bg-zinc-900 text-amber-400 p-2 flex items-center justify-center shadow-md group-hover:scale-105 transition duration-300 border border-zinc-800">
              <svg viewBox="0 0 512 512" className="w-full h-full fill-current">
                <path d="M 140 140 H 372 C 390 140 400 152 400 170 V 200 H 220 V 312 H 372 C 390 312 400 324 400 342 V 372 H 140 Z" />
                <circle cx="390" cy="140" r="28" fill="#D97706" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-xl tracking-tight text-zinc-900 dark:text-white leading-none font-serif">
                CENTERPOINT<span className="text-amber-600 dark:text-amber-400">.</span>
              </span>
              <span className="text-[10px] tracking-widest uppercase font-semibold text-zinc-400 mt-1 font-mono">
                FLAGSHIP COMMERCE ATELIER
              </span>
            </div>
          </div>

          {/* Category Navigation Bar */}
          <nav className="hidden lg:flex items-center gap-8 text-xs font-semibold text-zinc-600 dark:text-zinc-300 uppercase tracking-wider font-sans">
            <button
              onClick={() => setActiveCategory('all')}
              className={`hover:text-amber-600 dark:hover:text-amber-400 transition cursor-pointer ${
                activeCategory === 'all' ? 'text-amber-600 dark:text-amber-400 border-b-2 border-amber-600 dark:border-amber-400 pb-1' : ''
              }`}
            >
              All Curations
            </button>
            {categories?.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id.toString())}
                className={`hover:text-amber-600 dark:hover:text-amber-400 transition cursor-pointer ${
                  activeCategory === cat.id.toString()
                    ? 'text-amber-600 dark:text-amber-400 border-b-2 border-amber-600 dark:border-amber-400 pb-1'
                    : ''
                }`}
              >
                {cat.name}
              </button>
            ))}
          </nav>

          {/* Right Action Icons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsCommandOpen(true)}
              className="p-2.5 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
              title="Search Catalog (⌘K)"
            >
              <Search className="w-5 h-5" />
            </button>

            <button
              onClick={() => setIsCartOpen(true)}
              className="relative px-4 py-2.5 bg-zinc-900 hover:bg-black dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-zinc-950 rounded-xl transition flex items-center gap-2.5 shadow-md active:scale-95"
            >
              <ShoppingBag className="w-4 h-4 text-amber-400 dark:text-zinc-950" />
              <span className="text-xs font-bold font-sans">Bag ({cartCount})</span>
            </button>

            <button
              onClick={() => setViewMode('cms')}
              className="hidden sm:inline-flex px-3.5 py-2 text-xs font-semibold text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
            >
              Staff Studio
            </button>
          </div>
        </div>
      </header>

      {/* 3. HERO SHOWCASE SECTION */}
      <section className="relative py-20 md:py-28 px-6 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/40 dark:bg-zinc-950/40 overflow-hidden">
        {/* Background Ambient Glow */}
        <div className="absolute top-1/2 left-1/3 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/5 dark:bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs font-semibold text-amber-800 dark:text-amber-400">
              <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Autumn/Winter 2026 Grand Haute Horlogerie</span>
            </div>

            <h1 className="text-4xl sm:text-6xl md:text-7xl font-serif tracking-tight text-zinc-900 dark:text-white leading-[1.08]">
              {storeConfig?.sections?.hero_title || 'Crafted for Modern Living.'} <br />
              <span className="italic text-zinc-500 dark:text-zinc-400 font-normal">Thoughtfully Curated.</span>
            </h1>

            <p className="text-base text-zinc-600 dark:text-zinc-300 max-w-xl leading-relaxed font-sans">
              {storeConfig?.sections?.hero_subtitle || 'Bespoke timepieces, artisanal apparel, and refined modern essentials crafted with generational mastery.'}
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-4">
              <EditorialButton
                variant="primary"
                size="lg"
                onClick={() => setActiveCategory('all')}
                icon={<ArrowRight className="w-4 h-4" />}
              >
                {storeConfig?.sections?.hero_cta_primary || 'Explore Grand Collection'}
              </EditorialButton>

              <EditorialButton
                variant="secondary"
                size="lg"
                onClick={() => setIsCommandOpen(true)}
              >
                Instant Search (⌘K)
              </EditorialButton>
            </div>
          </div>

          {/* Featured Spotlight Card */}
          <div className="lg:col-span-5 relative">
            <div className="aspect-[4/5] bg-zinc-100 dark:bg-zinc-900 rounded-3xl overflow-hidden shadow-2xl relative group border border-zinc-200 dark:border-zinc-800">
              <img
                src="https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=1000&q=80"
                alt="Featured Luxury Chronograph"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-8 text-white">
                <span className="text-[11px] uppercase font-mono tracking-widest text-amber-400">Atelier Spotlight</span>
                <h3 className="text-2xl font-serif font-bold mt-1">Royal Chronograph Titanium</h3>
                <p className="text-xs text-zinc-300 mt-1 line-clamp-2">Automatic mechanical caliber with 70-hour power reserve and exhibition sapphire caseback.</p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="font-mono text-lg font-bold text-amber-400">{formatPrice(250000)}</span>
                  <button
                    onClick={() => {
                      if (productsList[0]) handleAddToCart(productsList[0]);
                    }}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-xl text-xs transition"
                  >
                    Quick Add
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. PRODUCT CATALOG MATRIX */}
      <section className="py-20 px-6 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12 border-b border-zinc-200 dark:border-zinc-800 pb-6">
          <div>
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">
              Curated Matrix
            </span>
            <h2 className="text-3xl font-serif font-bold text-zinc-900 dark:text-white mt-1">
              Permanent & Seasonal Collections
            </h2>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
                activeCategory === 'all'
                  ? 'bg-zinc-900 dark:bg-amber-500 text-white dark:text-zinc-950 shadow-md'
                  : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white border border-zinc-200 dark:border-zinc-800'
              }`}
            >
              All Items ({productsList.length})
            </button>
            {categories?.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id.toString())}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
                  activeCategory === cat.id.toString()
                    ? 'bg-zinc-900 dark:bg-amber-500 text-white dark:text-zinc-950 shadow-md'
                    : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white border border-zinc-200 dark:border-zinc-800'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredProducts.map((product) => (
            <EditorialProductCard
              key={product.id}
              product={product}
              onAddToCart={handleAddToCart}
              onClick={() => setInspectProduct(product)}
            />
          ))}
        </div>
      </section>

      {/* 5. EDITORIAL CRAFTSMANSHIP STORY */}
      <section className="py-24 px-6 bg-zinc-900 text-white relative overflow-hidden">
        <div className="max-w-5xl mx-auto text-center space-y-8 relative z-10">
          <span className="text-xs uppercase font-mono tracking-widest text-amber-400">Haute Horlogerie & Artisanal Heritage</span>
          <h2 className="text-3xl sm:text-5xl font-serif leading-tight">
            "We do not design objects simply to be consumed. <br />
            We engineer artifacts intended to endure for generations."
          </h2>
          <p className="text-sm text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Every movement calibrated to chronometer precision. Every textile sourced from sustainable organic mills. Every line item protected by immutable ledger verification.
          </p>
          <div className="pt-4 flex items-center justify-center gap-8 text-xs font-mono text-zinc-400">
            <div>
              <span className="block text-2xl font-serif font-bold text-amber-400">100%</span>
              <span>Authenticity Certified</span>
            </div>
            <div className="w-px h-8 bg-zinc-800" />
            <div>
              <span className="block text-2xl font-serif font-bold text-amber-400">30-Day</span>
              <span>Complimentary Returns</span>
            </div>
            <div className="w-px h-8 bg-zinc-800" />
            <div>
              <span className="block text-2xl font-serif font-bold text-amber-400">24/7</span>
              <span>Concierge Client Care</span>
            </div>
          </div>
        </div>
      </section>

      {/* 6. TRUST & CONCIERGE BAR */}
      <section className="py-12 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-serif font-bold text-sm">Swift Express Dispatch</h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Automated Steadfast & Pathao integration across all 64 districts.</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-serif font-bold text-sm">Escrow & Secure Gateway</h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Encrypted bKash Direct, SSLCommerz, and verified Cash on Delivery.</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-serif font-bold text-sm">Double-Entry Ledger Invariant</h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Exact cent financial reconciliation: debits equal credits on all orders.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. FOOTER & DEVCENTERPOINT ATTRIBUTION */}
      <footer className="bg-zinc-950 text-white pt-16 pb-12 px-6 border-t border-zinc-900">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-zinc-900">
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500 text-zinc-950 flex items-center justify-center font-bold text-xs">
                CP
              </div>
              <span className="font-serif font-bold text-lg tracking-wider">CENTERPOINT</span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed max-w-sm">
              Flagship commerce ecosystem engineered for dual-edition deployment: independent standalone commercial installations and cloud multi-tenant SaaS operations.
            </p>
          </div>

          <div className="md:col-span-2 space-y-3">
            <h4 className="font-mono text-xs uppercase tracking-wider text-amber-400">Departments</h4>
            <ul className="space-y-2 text-xs text-zinc-400">
              <li><button onClick={() => setActiveCategory('all')} className="hover:text-white transition">All Items</button></li>
              <li><button onClick={() => setActiveCategory('1')} className="hover:text-white transition">Fashion & Apparel</button></li>
              <li><button onClick={() => setActiveCategory('2')} className="hover:text-white transition">Home & Living</button></li>
              <li><button onClick={() => setActiveCategory('3')} className="hover:text-white transition">Tech & Audio</button></li>
            </ul>
          </div>

          <div className="md:col-span-2 space-y-3">
            <h4 className="font-mono text-xs uppercase tracking-wider text-amber-400">Governance</h4>
            <ul className="space-y-2 text-xs text-zinc-400">
              <li><a href="#privacy" className="hover:text-white transition">Privacy Policy</a></li>
              <li><a href="#terms" className="hover:text-white transition">Terms of Service</a></li>
              <li><a href="#security" className="hover:text-white transition">Security Audit</a></li>
              <li><a href="#api" className="hover:text-white transition">REST API Docs</a></li>
            </ul>
          </div>

          <div className="md:col-span-3 space-y-3">
            <h4 className="font-mono text-xs uppercase tracking-wider text-amber-400">Platform Control</h4>
            <div className="space-y-2">
              <button
                onClick={() => setViewMode('mcp_login')}
                className="w-full py-2.5 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-amber-400 border border-zinc-800 text-xs font-mono flex items-center justify-center gap-2 transition"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Owner Master Control Panel</span>
              </button>
              <button
                onClick={() => setViewMode('cms')}
                className="w-full py-2.5 px-3 rounded-xl bg-zinc-900/60 hover:bg-zinc-800/80 text-zinc-300 border border-zinc-800/60 text-xs font-mono flex items-center justify-center gap-2 transition"
              >
                <span>Staff Management Studio</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Credits & Official DevCenterPoint Integration */}
        <div className="max-w-7xl mx-auto pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 gap-4">
          <p>© 2026 CENTERPOINT. All rights reserved.</p>

          <div className="flex items-center gap-2 text-zinc-400">
            <span>Designed, Developed &amp; Engineered by</span>
            <a
              href="https://devcenterpoint.com"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 font-semibold text-amber-400 hover:text-amber-300 transition"
            >
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span>DevCenterPoint</span>
            </a>
          </div>
        </div>
      </footer>

      {/* 8. MODALS & OVERLAYS */}
      {/* A. Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onProceedCheckout={() => setIsCheckoutOpen(true)}
      />

      {/* B. Global Command Palette (⌘K) */}
      <CommandPalette
        isOpen={isCommandOpen}
        onClose={() => setIsCommandOpen(false)}
        products={productsList}
        onSelectProduct={(p) => setInspectProduct(p)}
      />

      {/* C. Floating AI Assistant Widget */}
      <FloatingAiWidget onAddToCart={handleAddToCart} />

      {/* D. Product Detail Inspection Modal */}
      <AnimatePresence>
        {inspectProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setInspectProduct(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-2xl bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden z-10 grid grid-cols-1 sm:grid-cols-2"
            >
              <div className="aspect-square bg-zinc-100 dark:bg-zinc-900">
                <img
                  src={inspectProduct.image_url || 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600'}
                  alt={inspectProduct.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
                    <span>{inspectProduct.sku}</span>
                    <span className="text-emerald-500 font-semibold">{(inspectProduct.stock_quantity ?? 0) > 0 ? 'In Stock' : 'Pre-order'}</span>
                  </div>
                  <h3 className="font-serif font-bold text-xl text-zinc-900 dark:text-white mt-2">
                    {inspectProduct.name}
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 leading-relaxed">
                    {inspectProduct.summary || inspectProduct.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-400">Price:</span>
                    <span className="font-mono text-xl font-bold text-amber-600 dark:text-amber-400">
                      {formatPrice(inspectProduct.price)}
                    </span>
                  </div>
                  <EditorialButton
                    variant="primary"
                    size="md"
                    className="w-full"
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

      {/* E. Checkout Modal */}
      <AnimatePresence>
        {isCheckoutOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCheckoutOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl p-6 sm:p-8 z-10 space-y-6"
            >
              {checkoutSuccessOrder ? (
                <div className="text-center space-y-4 py-6">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="font-serif font-bold text-2xl text-zinc-900 dark:text-white">Order Confirmed!</h3>
                  <p className="text-xs text-zinc-500 max-w-xs mx-auto">
                    Thank you, {shippingAddress.full_name}. Order #{checkoutSuccessOrder.id} has been recorded in our immutable ledger.
                  </p>
                  <EditorialButton
                    variant="primary"
                    size="md"
                    onClick={() => {
                      setCheckoutSuccessOrder(null);
                      setIsCheckoutOpen(false);
                      setIsCartOpen(false);
                    }}
                  >
                    Continue Curation
                  </EditorialButton>
                </div>
              ) : (
                <form onSubmit={handleCheckoutSubmit} className="space-y-4">
                  <h3 className="font-serif font-bold text-xl text-zinc-900 dark:text-white">Express Checkout</h3>
                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="text-zinc-500 block mb-1">Full Name</label>
                      <input
                        type="text"
                        value={shippingAddress.full_name}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, full_name: e.target.value })}
                        required
                        className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-xl px-3.5 py-2 text-zinc-900 dark:text-zinc-100 border-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="text-zinc-500 block mb-1">Phone Number</label>
                      <input
                        type="text"
                        value={shippingAddress.phone}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, phone: e.target.value })}
                        required
                        className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-xl px-3.5 py-2 text-zinc-900 dark:text-zinc-100 border-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="text-zinc-500 block mb-1">Delivery Address</label>
                      <input
                        type="text"
                        value={shippingAddress.address_line_1}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, address_line_1: e.target.value })}
                        required
                        className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-xl px-3.5 py-2 text-zinc-900 dark:text-zinc-100 border-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-zinc-500 block mb-1">City</label>
                        <input
                          type="text"
                          value={shippingAddress.city}
                          onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                          required
                          className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-xl px-3.5 py-2 text-zinc-900 dark:text-zinc-100 border-none focus:ring-1 focus:ring-amber-500"
                        />
                      </div>
                      <div>
                        <label className="text-zinc-500 block mb-1">Country</label>
                        <input
                          type="text"
                          value={shippingAddress.country}
                          onChange={(e) => setShippingAddress({ ...shippingAddress, country: e.target.value })}
                          required
                          className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-xl px-3.5 py-2 text-zinc-900 dark:text-zinc-100 border-none focus:ring-1 focus:ring-amber-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-zinc-500 block mb-1">Payment Method</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: 'bkash', label: 'bKash Direct' },
                          { id: 'sslcommerz', label: 'Cards / SSL' },
                          { id: 'cod', label: 'Cash on Deliv' },
                        ].map((m) => (
                          <button
                            type="button"
                            key={m.id}
                            onClick={() => setPaymentMethod(m.id)}
                            className={`p-2.5 rounded-xl border text-[11px] font-semibold text-center transition ${
                              paymentMethod === m.id
                                ? 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
                            }`}
                          >
                            {m.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <EditorialButton
                      type="submit"
                      variant="primary"
                      size="lg"
                      className="w-full"
                      disabled={processCheckoutMutation.isPending}
                    >
                      {processCheckoutMutation.isPending ? 'Securing Stock & Placing Order...' : 'Confirm Order'}
                    </EditorialButton>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* ROOT WRAPPER COMPONENT WITH PROVIDERS & LUXURY PRELOADER                   */
/* -------------------------------------------------------------------------- */
export default function App() {
  const [_loaderComplete, setLoaderComplete] = useState(false);

  return (
    <ThemeProvider initialTheme="light">
      <CurrencyProvider>
        <MotionProvider initialStyle="editorial_flow">
          <LuxuryLoader onComplete={() => setLoaderComplete(true)} />
          <SmoothScroll>
            <StorefrontContent />
          </SmoothScroll>
        </MotionProvider>
      </CurrencyProvider>
    </ThemeProvider>
  );
}
