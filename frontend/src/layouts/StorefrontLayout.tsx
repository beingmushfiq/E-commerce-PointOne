import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import {
  ShoppingBag, Search, Sun, Moon,
  ChevronDown, Menu, X, ArrowRight, User
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import { useCurrency, type CurrencyCode } from '../contexts/CurrencyContext';
import { useCart, useAddToCart } from '../hooks/useCheckout';
import { useProducts } from '../hooks/useCatalog';
import { CommandPalette, CartDrawer } from '../components/DesignSystem';
import { FloatingAiWidget } from '../components/FloatingAiWidget';
import { LuxuryCursor } from '../components/LuxuryCursor';
import { useLenis } from '../components/SmoothScroll';
import type { ProductItem } from '../types/ui';
import api from '../services/api';

export const StorefrontLayout: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { currency, setCurrency, currencies } = useCurrency();
  const navigate = useNavigate();

  const { data: cart } = useCart();
  const addToCartMutation = useAddToCart();
  const { data: productsData } = useProducts({ featured: false });

  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCurrencyDropdownOpen, setIsCurrencyDropdownOpen] = useState(false);
  const [storeConfig, setStoreConfig] = useState<any>(null);
  const { stop: stopScroll, start: startScroll } = useLenis();

  // Gracefully pause inertial scroll when cart drawer or command modal is open
  useEffect(() => {
    if (isCartOpen || isCommandOpen) {
      stopScroll();
    } else {
      startScroll();
    }
  }, [isCartOpen, isCommandOpen, stopScroll, startScroll]);

  // Load public storefront config
  useEffect(() => {
    api.get('/storefront/config')
      .then((res) => {
        const data = res.data?.data;
        setStoreConfig(data);
        if (typeof document !== 'undefined' && data?.theme) {
          if (data.theme.accent_color) {
            document.documentElement.style.setProperty('--cp-accent-champagne', data.theme.accent_color);
          }
          if (data.theme.font_heading) {
            document.documentElement.style.setProperty('--font-heading', `'${data.theme.font_heading}', serif`);
          }
        }
      })
      .catch(() => {});
  }, []);

  // Keyboard shortcut for command palette (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const productsList: ProductItem[] = (productsData as any)?.data || productsData || [];
  const cartItems = cart?.items || [];
  const cartCount = cartItems.reduce((acc: number, item: any) => acc + (item.quantity || 1), 0);

  const handleAddToCart = (product: ProductItem) => {
    addToCartMutation.mutate({ product_id: product.id, quantity: 1 });
    setIsCartOpen(true);
  };

  const tickerText =
    storeConfig?.custom?.ticker_announcement ||
    'COMPLIMENTARY EXPRESS DELIVERY ON ORDERS OVER ৳ 50,000 | WORLDWIDE ATELIER CONCIERGE';

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors duration-300">
      {/* 1. TOP ANNOUNCEMENT TICKER */}
      <div className="bg-zinc-900 dark:bg-black text-white text-[11px] font-mono tracking-wider py-2 px-4 border-b border-zinc-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-hidden whitespace-nowrap">
            <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
            <span className="text-zinc-300 uppercase tracking-widest">{tickerText}</span>
          </div>

          <div className="hidden md:flex items-center gap-4 text-zinc-400">
            <Link to="/studio" className="hover:text-amber-400 transition flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest">
              <span>Merchant Studio</span>
              <ArrowRight className="w-2.5 h-2.5" />
            </Link>
            <span className="text-zinc-700">|</span>
            <Link to="/orders/track" className="hover:text-white transition text-[10px]">
              Track Order
            </Link>
          </div>
        </div>
      </div>

      {/* 2. MAIN HEADER */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md border-b border-zinc-200/80 dark:border-zinc-800/80 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition"
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Brand Mark */}
          <Link to="/" className="flex flex-col items-start select-none group">
            <span className="font-serif font-black text-2xl tracking-tighter text-zinc-950 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
              CENTERPOINT
            </span>
            <span className="text-[9px] font-mono tracking-[0.25em] text-zinc-400 uppercase -mt-1">
              Atelier & Horology
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold uppercase tracking-widest text-zinc-600 dark:text-zinc-300">
            <Link to="/collections/all" className="hover:text-amber-600 dark:hover:text-amber-400 transition">
              Collections
            </Link>
            <Link to="/collections/timepieces" className="hover:text-amber-600 dark:hover:text-amber-400 transition">
              Timepieces
            </Link>
            <Link to="/collections/lifestyle" className="hover:text-amber-600 dark:hover:text-amber-400 transition">
              Atelier
            </Link>
            <Link to="/about" className="hover:text-amber-600 dark:hover:text-amber-400 transition">
              Editorial
            </Link>
          </nav>

          {/* Right Action Bar */}
          <div className="flex items-center gap-3">
            {/* Search Trigger */}
            <button
              onClick={() => setIsCommandOpen(true)}
              className="p-2.5 rounded-xl text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition cursor-pointer flex items-center gap-2"
              title="Search catalog (Ctrl+K)"
            >
              <Search className="w-4 h-4" />
              <span className="hidden lg:inline text-[11px] font-mono text-zinc-400">
                Search <kbd className="px-1.5 py-0.5 text-[9px] bg-zinc-100 dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700">⌘K</kbd>
              </span>
            </button>

            {/* Currency Switcher */}
            <div className="relative">
              <button
                onClick={() => setIsCurrencyDropdownOpen(!isCurrencyDropdownOpen)}
                className="px-2.5 py-1.5 rounded-xl text-xs font-mono font-semibold bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:text-amber-600 dark:hover:text-amber-400 transition flex items-center gap-1 cursor-pointer"
              >
                <span>{currency}</span>
                <ChevronDown className="w-3 h-3 text-zinc-400" />
              </button>

              {isCurrencyDropdownOpen && (
                <div className="absolute right-0 mt-2 w-28 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 p-1 z-50">
                  {Object.values(currencies).map((c) => (
                    <button
                      key={c.code}
                      onClick={() => {
                        setCurrency(c.code as CurrencyCode);
                        setIsCurrencyDropdownOpen(false);
                      }}
                      className={`w-full px-3 py-1.5 text-left text-xs font-mono rounded-lg transition flex items-center justify-between cursor-pointer ${
                        currency === c.code
                          ? 'bg-amber-500 text-zinc-950 font-bold'
                          : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                      }`}
                    >
                      <span>{c.code}</span>
                      <span className="text-[10px] opacity-75">{c.symbol}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Dark / Light Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition cursor-pointer"
              aria-label="Toggle theme mode"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-zinc-700" />}
            </button>

            {/* Customer Account */}
            <Link
              to="/account"
              className="p-2.5 rounded-xl text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition"
              title="Customer Account"
            >
              <User className="w-4 h-4" />
            </Link>

            {/* Cart Drawer Trigger */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2.5 rounded-xl bg-zinc-900 text-amber-400 dark:bg-amber-500 dark:text-zinc-950 hover:opacity-95 transition shadow-sm cursor-pointer flex items-center gap-2"
              aria-label="Open cart bag"
            >
              <ShoppingBag className="w-4 h-4" />
              {cartCount > 0 && (
                <span className="text-xs font-mono font-bold">{cartCount}</span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-6 py-5 space-y-4"
            >
              <nav className="flex flex-col space-y-3 text-sm font-semibold uppercase tracking-wider">
                <Link
                  to="/collections/all"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="hover:text-amber-600 dark:hover:text-amber-400 py-1"
                >
                  All Collections
                </Link>
                <Link
                  to="/collections/timepieces"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="hover:text-amber-600 dark:hover:text-amber-400 py-1"
                >
                  Timepieces
                </Link>
                <Link
                  to="/collections/lifestyle"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="hover:text-amber-600 dark:hover:text-amber-400 py-1"
                >
                  Atelier Living
                </Link>
                <Link
                  to="/orders/track"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="hover:text-amber-600 dark:hover:text-amber-400 py-1"
                >
                  Order Tracking
                </Link>
                <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                  <Link
                    to="/studio"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-xs font-mono text-amber-600 dark:text-amber-400 flex items-center gap-1 uppercase"
                  >
                    <span>Store Studio</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                  <Link
                    to="/platform"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-xs font-mono text-zinc-400 flex items-center gap-1 uppercase"
                  >
                    <span>SaaS Platform</span>
                  </Link>
                </div>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* 3. PRIMARY PAGE VIEWPORT */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* 4. GLOBAL FOOTER */}
      <footer className="bg-zinc-950 text-white border-t border-zinc-900 mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            {/* Column 1: Brand & Atelier */}
            <div className="space-y-4">
              <span className="font-serif font-black text-2xl tracking-tighter text-white">
                CENTERPOINT
              </span>
              <p className="text-xs text-zinc-400 leading-relaxed max-w-sm">
                A dual-edition luxury commerce platform delivering bespoke retail experiences, double-entry accounting integrity, and autonomous multi-tenant SaaS architecture.
              </p>
              <div className="pt-2 flex items-center gap-3 text-zinc-400 text-xs font-mono">
                <span>Dhaka</span>
                <span>•</span>
                <span>Singapore</span>
                <span>•</span>
                <span>London</span>
              </div>
            </div>

            {/* Column 2: Collections */}
            <div>
              <h4 className="text-xs font-mono uppercase tracking-[0.2em] text-amber-500 mb-4 font-bold">
                Curations
              </h4>
              <ul className="space-y-2.5 text-xs text-zinc-400 font-sans">
                <li><Link to="/collections/timepieces" className="hover:text-white transition">Mechanical Horology</Link></li>
                <li><Link to="/collections/lifestyle" className="hover:text-white transition">Artisanal Leather & Cashmere</Link></li>
                <li><Link to="/collections/all" className="hover:text-white transition">Limited Edition Complications</Link></li>
                <li><Link to="/about" className="hover:text-white transition">Editorial Journal</Link></li>
              </ul>
            </div>

            {/* Column 3: Trust & Client Services */}
            <div>
              <h4 className="text-xs font-mono uppercase tracking-[0.2em] text-amber-500 mb-4 font-bold">
                Concierge & Trust
              </h4>
              <ul className="space-y-2.5 text-xs text-zinc-400 font-sans">
                <li><Link to="/orders/track" className="hover:text-white transition">Track Consignment</Link></li>
                <li><Link to="/about" className="hover:text-white transition">5-Year Atelier Warranty</Link></li>
                <li><Link to="/about" className="hover:text-white transition">Discreet Returns Policy</Link></li>
                <li><Link to="/about" className="hover:text-white transition">Zero-Knowledge Vault</Link></li>
              </ul>
            </div>

            {/* Column 4: Bangladesh Native Payments */}
            <div>
              <h4 className="text-xs font-mono uppercase tracking-[0.2em] text-amber-500 mb-4 font-bold">
                Trusted Settlement
              </h4>
              <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
                Direct integration with Bangladesh financial infrastructure and global cards:
              </p>
              <div className="flex flex-wrap gap-2 text-[10px] font-mono text-zinc-300">
                <span className="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800">bKash</span>
                <span className="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800">Nagad</span>
                <span className="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800">SSLCommerz</span>
                <span className="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800">Visa / MC</span>
                <span className="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800">COD</span>
              </div>
            </div>
          </div>

          <div className="pt-12 mt-12 border-t border-zinc-900 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 font-mono gap-4">
            <span>© 2026 CENTERPOINT Ecosystem. All rights reserved.</span>
            <div className="flex items-center gap-6">
              <Link to="/studio" className="hover:text-amber-400 transition">Store Studio</Link>
              <Link to="/platform" className="hover:text-zinc-300 transition">Master Control</Link>
            </div>
          </div>
        </div>
      </footer>

      {/* 5. SEARCH COMMAND PALETTE */}
      <CommandPalette
        isOpen={isCommandOpen}
        onClose={() => setIsCommandOpen(false)}
        products={productsList}
        onSelectProduct={(p) => {
          setIsCommandOpen(false);
          navigate(`/products/${p.slug || p.id}`);
        }}
      />

      {/* 6. SLIDE-OVER CART DRAWER */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onProceedCheckout={() => {
          setIsCartOpen(false);
          navigate('/checkout');
        }}
      />

      {/* 7. BILINGUAL AI CONCIERGE WIDGET */}
      <FloatingAiWidget onAddToCart={handleAddToCart} />

      {/* 8. BESPOKE KINETIC LUXURY CURSOR FOLLOWER */}
      <LuxuryCursor />
    </div>
  );
};
