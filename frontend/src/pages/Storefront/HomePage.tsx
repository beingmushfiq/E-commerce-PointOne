import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles, ArrowRight, ShieldCheck, Truck, Clock, Lock,
  ChevronDown, Sliders
} from 'lucide-react';
import { useProducts, useCategories } from '../../hooks/useCatalog';
import { useAddToCart } from '../../hooks/useCheckout';
import { EditorialButton, EditorialProductCard } from '../../components/DesignSystem';
import { useParallax, useMagnetic, useScrollReveal, useCounterTween } from '../../hooks/useGsapMotion';
import type { ProductItem } from '../../types/ui';

export type StorefrontThemePreset = 'luxury_editorial' | 'modern_tech' | 'lifestyle_fashion';

export const HomePage: React.FC = () => {
  const { data: productsData } = useProducts({ featured: false });
  const { data: categoriesData } = useCategories();
  const addToCartMutation = useAddToCart();
  const navigate = useNavigate();

  // Active Storefront Theme Preset (Showcase capability)
  const [activeTheme, setActiveTheme] = useState<StorefrontThemePreset>('luxury_editorial');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [faqOpenIndex, setFaqOpenIndex] = useState<number | null>(null);

  // GSAP 3 Kinetic Motion Hooks
  const heroParallaxRef = useParallax<HTMLImageElement>({ speed: 20, scale: 1.12 });
  const heroButtonRef1 = useMagnetic<HTMLButtonElement>({ strength: 0.35 });
  const heroButtonRef2 = useMagnetic<HTMLButtonElement>({ strength: 0.25 });
  const productGridRef = useScrollReveal<HTMLDivElement>({ y: 40, stagger: 0.1, duration: 1.0 });
  const countComponentsRef = useCounterTween<HTMLSpanElement>({ endValue: 300, suffix: '+' });
  const countReserveRef = useCounterTween<HTMLSpanElement>({ endValue: 120, suffix: ' hrs' });
  const countAtmRef = useCounterTween<HTMLSpanElement>({ endValue: 10, suffix: ' ATM' });

  const productsList: ProductItem[] = (productsData as any)?.data || productsData || [];
  const categoriesList: any[] = (categoriesData as any)?.data || categoriesData || [];

  const handleAddToCart = (product: ProductItem) => {
    addToCartMutation.mutate({ product_id: product.id, quantity: 1 });
  };

  const filteredProducts = productsList.filter((p) => {
    if (activeCategory === 'all') return true;
    return p.category_id?.toString() === activeCategory || p.category?.name?.toLowerCase() === activeCategory.toLowerCase();
  });

  const faqs = [
    {
      q: 'How does CENTERPOINT ensure product authenticity and warranty?',
      a: 'Every timepiece and artisanal creation is issued with a cryptographically verifiable serial certificate and covered by a comprehensive 5-year Atelier Guarantee.',
    },
    {
      q: 'Which payment options are supported across Bangladesh?',
      a: 'We support instant bKash and Nagad direct checkouts, SSLCommerz gateway (Visa, Mastercard, Amex, City Bank), and Cash on Delivery with delivery inspection across 64 districts.',
    },
    {
      q: 'Can merchants fully brand their storefronts without coding?',
      a: 'Yes. Through CENTERPOINT Store Studio, merchants can choose theme presets, customize color tokens, adjust typographic scales, and compose pages with our 3-panel Visual Page Builder.',
    },
    {
      q: 'What is the estimated delivery timeframe?',
      a: 'Express delivery within Dhaka takes 24 hours. Nationwide delivery across all 64 districts takes 48–72 hours via our integrated logistics network.',
    },
  ];

  return (
    <div className="space-y-24 pb-20">
      {/* MULTI-INDUSTRY THEME PRESET FLOATING DOCK */}
      <div className="fixed bottom-6 left-6 z-40 hidden sm:flex items-center gap-2 p-2 rounded-2xl bg-zinc-950/90 text-white border border-zinc-800 shadow-2xl backdrop-blur-md">
        <div className="flex items-center gap-1.5 px-2 text-[11px] font-mono text-zinc-400">
          <Sliders className="w-3.5 h-3.5 text-amber-400" />
          <span>Theme:</span>
        </div>
        <button
          onClick={() => setActiveTheme('luxury_editorial')}
          className={`px-3 py-1 rounded-xl text-[11px] font-mono transition cursor-pointer ${
            activeTheme === 'luxury_editorial'
              ? 'bg-amber-500 text-zinc-950 font-bold shadow'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
          }`}
        >
          Luxury Editorial
        </button>
        <button
          onClick={() => setActiveTheme('modern_tech')}
          className={`px-3 py-1 rounded-xl text-[11px] font-mono transition cursor-pointer ${
            activeTheme === 'modern_tech'
              ? 'bg-amber-500 text-zinc-950 font-bold shadow'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
          }`}
        >
          Tech
        </button>
        <button
          onClick={() => setActiveTheme('lifestyle_fashion')}
          className={`px-3 py-1 rounded-xl text-[11px] font-mono transition cursor-pointer ${
            activeTheme === 'lifestyle_fashion'
              ? 'bg-amber-500 text-zinc-950 font-bold shadow'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
          }`}
        >
          Fashion
        </button>
      </div>

      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl overflow-hidden bg-zinc-950 text-white min-h-[640px] flex items-center">
            {/* Background Photographic Canvas */}
            <div className="absolute inset-0 z-0 overflow-hidden">
              <img
                ref={heroParallaxRef}
                src={
                  activeTheme === 'modern_tech'
                    ? 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=1600&q=80'
                    : activeTheme === 'lifestyle_fashion'
                    ? 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1600&q=80'
                    : 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=1600&q=85'
                }
                alt="CENTERPOINT Masterpiece"
                className="w-full h-full object-cover object-center opacity-40 scale-105 will-change-transform"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/70 to-transparent" />
            </div>

            {/* Hero Copy & Call to Action */}
            <div className="relative z-10 max-w-2xl p-8 sm:p-14 lg:p-20 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono uppercase tracking-widest animate-fade-in">
                <Sparkles className="w-3.5 h-3.5" />
                <span>
                  {activeTheme === 'modern_tech'
                    ? 'High-Precision Engineering'
                    : activeTheme === 'lifestyle_fashion'
                    ? 'Autumn Winter 2026 Collection'
                    : 'Artisanal Horology & Haute Joaillerie'}
                </span>
              </div>

              <h1 className="font-serif font-bold text-4xl sm:text-6xl lg:text-7xl tracking-tight leading-[1.05]">
                {activeTheme === 'modern_tech'
                  ? 'Engineered for Performance. Built to Endure.'
                  : activeTheme === 'lifestyle_fashion'
                  ? 'Effortless Elegance for Modern Living.'
                  : 'Crafted for Eternity. Curated for You.'}
              </h1>

              <p className="text-zinc-300 text-sm sm:text-base leading-relaxed max-w-lg font-sans">
                {activeTheme === 'modern_tech'
                  ? 'Explore our next-generation catalog of precision audio instruments, studio monitors, and technical hardware.'
                  : activeTheme === 'lifestyle_fashion'
                  ? 'Impeccable silhouettes, artisanal cashmere, and timeless wardrobe staples tailored with generational craft.'
                  : 'Discover bespoke mechanical complications, certified Swiss chronometers, and hand-finished heirloom treasures.'}
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-4">
                <EditorialButton
                  ref={heroButtonRef1}
                  onClick={() => navigate('/collections/all')}
                  size="lg"
                  variant="amber"
                  className="font-bold shadow-xl shadow-amber-500/20 px-8 py-3.5"
                  icon={<ArrowRight className="w-4 h-4" />}
                  data-cursor="pointer"
                  data-cursor-text="DISCOVER"
                >
                  Explore Collection
                </EditorialButton>
                <EditorialButton
                  ref={heroButtonRef2}
                  onClick={() => navigate('/studio')}
                  size="lg"
                  variant="outlineLight"
                  className="px-8 py-3.5 font-semibold"
                  data-cursor="pointer"
                  data-cursor-text="STUDIO"
                >
                  Manage In Studio
                </EditorialButton>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. TRUST PILLARS BAR */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-serif font-bold text-sm text-zinc-900 dark:text-zinc-100">5-Year Guarantee</h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Cryptographically signed authenticity</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 shrink-0">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-serif font-bold text-sm text-zinc-900 dark:text-zinc-100">Nationwide Express</h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">24h Dhaka, 48h 64 Districts</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 shrink-0">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-serif font-bold text-sm text-zinc-900 dark:text-zinc-100">bKash & SSLCommerz</h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Zero-fee instant secure checkout</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-serif font-bold text-sm text-zinc-900 dark:text-zinc-100">Atelier Concierge</h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Private consulting & support</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. CURATED PRODUCT CATALOG */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-mono uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400 font-bold block mb-2">
              Atelier Curations
            </span>
            <h2 className="font-serif font-bold text-3xl sm:text-4xl text-zinc-900 dark:text-white">
              Featured Masterpieces
            </h2>
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold font-mono uppercase tracking-wider transition cursor-pointer ${
                activeCategory === 'all'
                  ? 'bg-zinc-900 text-white dark:bg-amber-500 dark:text-zinc-950'
                  : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400'
              }`}
            >
              All Pieces
            </button>
            {categoriesList.map((cat: any) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id.toString())}
                className={`px-4 py-2 rounded-xl text-xs font-semibold font-mono uppercase tracking-wider transition cursor-pointer ${
                  activeCategory === cat.id.toString()
                    ? 'bg-zinc-900 text-white dark:bg-amber-500 dark:text-zinc-950'
                    : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid with Staggered Scroll Entrance */}
        <div
          ref={productGridRef}
          data-stagger-children="true"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {filteredProducts.map((product) => (
            <div key={product.id} data-cursor="pointer" data-cursor-text="VIEW">
              <EditorialProductCard
                product={product}
                onAddToCart={handleAddToCart}
                onClick={() => navigate(`/products/${product.slug || product.id}`)}
              />
            </div>
          ))}
        </div>
      </section>

      {/* 4. EDITORIAL STORYTELLING SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 grid grid-cols-1 lg:grid-cols-2">
          <div className="p-8 sm:p-14 lg:p-16 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <span className="text-xs font-mono uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400 font-bold block">
                The Horology Workshop
              </span>
              <h3 className="font-serif font-bold text-3xl sm:text-4xl text-zinc-900 dark:text-white leading-tight">
                Where Century-Old Horology Meets Contemporary Precision
              </h3>
              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed font-sans">
                Every CENTERPOINT horological complication is hand-assembled in our Geneva and Dhaka workshops by master watchmakers with over four decades of pedigree. We refuse mass production: every caliber is tested under extreme barometric pressure and timed across six distinct positions.
              </p>
            </div>

            <div className="pt-4 flex items-center gap-6 text-xs font-mono">
              <div>
                <span ref={countComponentsRef} className="text-xl font-bold font-serif text-zinc-900 dark:text-white block">300+</span>
                <span className="text-zinc-500">Individual Components</span>
              </div>
              <div className="h-8 w-px bg-zinc-200 dark:bg-zinc-800" />
              <div>
                <span ref={countReserveRef} className="text-xl font-bold font-serif text-zinc-900 dark:text-white block">120 hrs</span>
                <span className="text-zinc-500">Power Reserve</span>
              </div>
              <div className="h-8 w-px bg-zinc-200 dark:bg-zinc-800" />
              <div>
                <span ref={countAtmRef} className="text-xl font-bold font-serif text-zinc-900 dark:text-white block">10 ATM</span>
                <span className="text-zinc-500">Water Resistance</span>
              </div>
            </div>
          </div>

          <div className="relative min-h-[360px] bg-zinc-100 dark:bg-zinc-950">
            <img
              src="https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=1000&q=80"
              alt="Artisanal Workshop Craft"
              className="w-full h-full object-cover object-center"
            />
          </div>
        </div>
      </section>

      {/* 5. FAQ ACCORDION */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="text-center space-y-2">
          <span className="text-xs font-mono uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400 font-bold">
            Frequently Inquired
          </span>
          <h2 className="font-serif font-bold text-3xl text-zinc-900 dark:text-white">
            Client Inquiries & Guarantees
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = faqOpenIndex === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden transition"
              >
                <button
                  onClick={() => setFaqOpenIndex(isOpen ? null : idx)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 cursor-pointer"
                >
                  <span className="font-serif font-bold text-base text-zinc-900 dark:text-zinc-100">
                    {faq.q}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-zinc-400 transition-transform duration-200 shrink-0 ${
                      isOpen ? 'rotate-180 text-amber-500' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-sans border-t border-zinc-100 dark:border-zinc-800/60 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
