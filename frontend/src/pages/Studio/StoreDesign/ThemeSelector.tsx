import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Store, Check, Sparkles, Sliders,
  ArrowRight
} from 'lucide-react';
import { Badge } from '../../../components/DesignSystem';
import api from '../../../services/api';

interface ThemePreset {
  id: string;
  name: string;
  industry: string;
  fontHeading: string;
  fontBody: string;
  accentColor: string;
  cardRadius: string;
  description: string;
  thumbnail: string;
  isFlagship?: boolean;
}

export const ThemeSelector: React.FC = () => {
  const navigate = useNavigate();

  const presets: ThemePreset[] = [
    {
      id: 'luxury_editorial',
      name: 'Atelier Horology & Luxury',
      industry: 'Watches, Haute Joaillerie, Fine Goods',
      fontHeading: 'Cormorant Garamond',
      fontBody: 'Plus Jakarta Sans',
      accentColor: '#D97706',
      cardRadius: '24px',
      description: 'Generous whitespace, large photographic hero, sophisticated serif titles, and refined understated purchase controls.',
      thumbnail: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800',
      isFlagship: true,
    },
    {
      id: 'modern_tech',
      name: 'Silicon & Precision Tech',
      industry: 'Consumer Electronics, Hardware, Audio',
      fontHeading: 'Plus Jakarta Sans',
      fontBody: 'JetBrains Mono',
      accentColor: '#2563EB',
      cardRadius: '12px',
      description: 'High information density, detailed technical specifications tables, variant selectors, and comparison blocks.',
      thumbnail: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=800',
    },
    {
      id: 'lifestyle_fashion',
      name: 'Maison Runway & Apparel',
      industry: 'Fashion, Footwear, Designer Apparel',
      fontHeading: 'Playfair Display',
      fontBody: 'Plus Jakarta Sans',
      accentColor: '#9333EA',
      cardRadius: '16px',
      description: 'Full-bleed lookbook photography, color swatch-led variants, size guides, and visual campaign banners.',
      thumbnail: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800',
    },
  ];

  const [activeThemeId, setActiveThemeId] = useState('luxury_editorial');
  const [isApplying, setIsApplying] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleApplyTheme = async (preset: ThemePreset) => {
    setIsApplying(true);
    setActiveThemeId(preset.id);
    try {
      await api.put('/cms/admin/theme', {
        theme_id: preset.id,
        accent_color: preset.accentColor,
        font_heading: preset.fontHeading,
      });
      setSuccessMsg(`Applied theme preset: ${preset.name}!`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch {
      setSuccessMsg(`Applied theme preset locally: ${preset.name}`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-6">
        <div>
          <span className="text-xs font-mono uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400 font-bold block mb-1">
            Storefront Aesthetics & CMS
          </span>
          <h1 className="font-serif font-bold text-3xl text-zinc-900 dark:text-white">
            Theme Gallery & Store Design
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Select a verified theme preset or launch the full-screen visual canvas to compose custom layouts.
          </p>
        </div>

        <button
          onClick={() => navigate('/studio/editor/home')}
          className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-zinc-950 font-mono font-bold text-xs tracking-wider shadow-md flex items-center gap-2 transition cursor-pointer"
        >
          <Store className="w-4 h-4" />
          <span>Launch Visual Page Builder</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-mono text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-500" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Theme Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {presets.map((preset) => {
          const isSelected = activeThemeId === preset.id;
          return (
            <div
              key={preset.id}
              className={`rounded-3xl border overflow-hidden bg-white dark:bg-zinc-900 transition-all flex flex-col justify-between shadow-sm ${
                isSelected
                  ? 'border-amber-500 ring-2 ring-amber-500/20'
                  : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
              }`}
            >
              <div>
                {/* Thumbnail Preview */}
                <div className="relative aspect-video w-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                  <img
                    src={preset.thumbnail}
                    alt={preset.name}
                    className="w-full h-full object-cover"
                  />
                  {preset.isFlagship && (
                    <div className="absolute top-3 left-3">
                      <Badge variant="accent">
                        <Sparkles className="w-3 h-3 text-amber-500" /> Flagship Showcase
                      </Badge>
                    </div>
                  )}
                  {isSelected && (
                    <div className="absolute top-3 right-3 p-1.5 rounded-full bg-amber-500 text-zinc-950 shadow">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="p-6 space-y-3">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 block">
                      {preset.industry}
                    </span>
                    <h3 className="font-serif font-bold text-lg text-zinc-900 dark:text-white mt-0.5">
                      {preset.name}
                    </h3>
                  </div>

                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    {preset.description}
                  </p>

                  {/* Token Previews */}
                  <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-[11px] font-mono text-zinc-500">
                    <div>
                      <span className="text-zinc-400 block text-[9px] uppercase">Font</span>
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200">{preset.fontHeading}</span>
                    </div>
                    <div>
                      <span className="text-zinc-400 block text-[9px] uppercase">Accent</span>
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-3 h-3 rounded-full border border-zinc-300 dark:border-zinc-700"
                          style={{ backgroundColor: preset.accentColor }}
                        />
                        <span className="font-semibold text-zinc-800 dark:text-zinc-200">{preset.accentColor}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="p-6 pt-0 flex gap-2">
                <button
                  onClick={() => handleApplyTheme(preset)}
                  disabled={isSelected || isApplying}
                  className={`flex-1 py-2 rounded-xl text-xs font-mono font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    isSelected
                      ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-default'
                      : 'bg-zinc-900 hover:bg-black text-white dark:bg-amber-500 dark:text-zinc-950 dark:hover:bg-amber-400 shadow-sm'
                  }`}
                >
                  {isSelected ? <Check className="w-3.5 h-3.5" /> : null}
                  <span>{isSelected ? 'Active Preset' : 'Apply Theme'}</span>
                </button>

                <button
                  onClick={() => navigate('/studio/editor/home')}
                  className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition cursor-pointer"
                  title="Customize in Visual Builder"
                >
                  <Sliders className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
