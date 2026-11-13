import React from 'react';
import { motion } from 'framer-motion';
import { SandboxedEmbed } from './SandboxedEmbed';
import { Sparkles, ArrowRight, Star } from 'lucide-react';
import { EditorialButton } from './DesignSystem';
import type { ProductItem } from '../types/ui';

export interface CmsSection {
  id: string;
  type: 'hero' | 'featured_products' | 'banner_grid' | 'sandboxed_embed' | 'testimonials' | 'faq' | 'rich_text' | 'newsletter';
  settings?: Record<string, any>;
  content?: Record<string, any>;
}

interface SectionRendererProps {
  sections: CmsSection[];
  products?: ProductItem[];
  onProductClick?: (product: ProductItem) => void;
  onCtaClick?: (url: string) => void;
}

export const SectionRenderer: React.FC<SectionRendererProps> = ({
  sections = [],
  products = [],
  onProductClick,
  onCtaClick,
}) => {
  if (!sections || sections.length === 0) {
    return null;
  }

  return (
    <div className="space-y-16 py-8">
      {sections.map((section, idx) => {
        switch (section.type) {
          case 'hero':
            return (
              <motion.section
                key={section.id || idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border border-zinc-800 p-8 sm:p-14 text-center max-w-6xl mx-auto shadow-2xl"
              >
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-mono uppercase tracking-widest mb-6">
                  <Sparkles className="w-3 h-3" />
                  {section.content?.badge || 'Centerpoint Exclusive'}
                </div>
                <h1 className="text-3xl sm:text-5xl font-serif font-light text-white tracking-tight mb-4 max-w-2xl mx-auto leading-tight">
                  {section.content?.headline || 'Timeless Craftsmanship, Uncompromised.'}
                </h1>
                <p className="text-zinc-400 text-sm sm:text-base max-w-xl mx-auto mb-8 font-light">
                  {section.content?.subhead || 'Discover the pinnacle of artisanal luxury and modern silhouette.'}
                </p>
                {section.content?.cta_text && (
                  <EditorialButton
                    variant="primary"
                    onClick={() => onCtaClick?.(section.content?.cta_url || '/')}
                  >
                    <span>{section.content.cta_text}</span>
                    <ArrowRight className="w-4 h-4 ml-2 inline" />
                  </EditorialButton>
                )}
              </motion.section>
            );

          case 'featured_products': {
            const limit = section.settings?.limit || 4;
            const displayProducts = products.slice(0, limit);
            return (
              <section key={section.id || idx} className="max-w-6xl mx-auto px-4">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-2xl font-serif text-white">{section.content?.title || 'Curated Selections'}</h2>
                    <p className="text-sm text-zinc-400 font-light">{section.content?.subtitle || 'Exemplary pieces from our latest drop'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {displayProducts.map((prod) => (
                    <div
                      key={prod.id}
                      onClick={() => onProductClick?.(prod)}
                      className="cursor-pointer group rounded-2xl overflow-hidden border border-zinc-800/80 bg-zinc-900/40 p-4 transition-all hover:border-amber-500/40"
                    >
                      <div className="aspect-square rounded-xl overflow-hidden mb-3 bg-zinc-800">
                        <img
                          src={prod.image_url || 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&q=80&w=600'}
                          alt={prod.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                      <h4 className="text-sm font-medium text-white truncate">{prod.name}</h4>
                      <p className="text-xs text-amber-400 font-mono mt-1">৳{prod.price.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </section>
            );
          }

          case 'sandboxed_embed':
            return (
              <section key={section.id || idx} className="max-w-6xl mx-auto px-4">
                <SandboxedEmbed
                  token={section.content?.token || section.content?.sandbox_token || ''}
                  title={section.content?.title || 'Custom Component'}
                  height={section.settings?.height || 420}
                />
              </section>
            );

          case 'banner_grid':
            return (
              <section key={section.id || idx} className="max-w-6xl mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {(section.content?.banners || []).map((banner: any, bIdx: number) => (
                    <div
                      key={bIdx}
                      className="group relative rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900/60 p-8 transition-all hover:border-zinc-700"
                    >
                      <h3 className="text-xl font-serif text-white mb-2">{banner.title}</h3>
                      <p className="text-sm text-zinc-400 mb-4">{banner.subtitle}</p>
                      {banner.link && (
                        <button
                          onClick={() => onCtaClick?.(banner.link)}
                          className="text-xs font-mono text-amber-400 hover:text-amber-300 flex items-center gap-1"
                        >
                          EXPLORE <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            );

          case 'testimonials':
            return (
              <section key={section.id || idx} className="max-w-5xl mx-auto px-4 text-center">
                <h2 className="text-2xl font-serif text-white mb-8">Client Accolades</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {(section.content?.testimonials || [
                    { author: 'Tahmid K.', quote: 'The attention to fabric density and bespoke finish is unmatched.', role: 'Dhaka' },
                    { author: 'Dr. Sabrina H.', quote: 'Fast delivery with white-glove packaging. A truly elevated standard.', role: 'Chittagong' },
                    { author: 'Farhan A.', quote: 'Seamless payment and immediate order tracking. Pure luxury.', role: 'Sylhet' },
                  ]).map((item: any, tIdx: number) => (
                    <div key={tIdx} className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 text-left">
                      <div className="flex gap-1 text-amber-400 mb-3">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-current" />
                        ))}
                      </div>
                      <p className="text-sm text-zinc-300 italic mb-4 font-light leading-relaxed">"{item.quote}"</p>
                      <div className="text-xs text-white font-medium">{item.author}</div>
                      <div className="text-[10px] text-zinc-500 font-mono">{item.role}</div>
                    </div>
                  ))}
                </div>
              </section>
            );

          case 'rich_text':
            return (
              <section key={section.id || idx} className="max-w-3xl mx-auto px-4 prose prose-invert">
                {section.content?.heading && (
                  <h2 className="text-2xl font-serif text-white mb-4">{section.content.heading}</h2>
                )}
                <div
                  className="text-zinc-300 text-sm leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: section.content?.body || '' }}
                />
              </section>
            );

          default:
            return null;
        }
      })}
    </div>
  );
};
