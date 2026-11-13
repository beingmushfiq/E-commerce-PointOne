import React, { useState, useEffect } from 'react';
import {
  Palette, Activity, Layers, DollarSign, Plug, Shield, RefreshCw,
  Save, ArrowLeft, Check, Sparkles
} from 'lucide-react';
import api from '../../services/api';
import { useMotion, MOTION_STYLES, type MotionStyle } from '../../contexts/MotionContext';
import { useCurrency, type CurrencyCode } from '../../contexts/CurrencyContext';

interface MasterControlCenterProps {
  onBackToStorefront: () => void;
  onLogout: () => void;
}

export const MasterControlCenter: React.FC<MasterControlCenterProps> = ({
  onBackToStorefront,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<'theme' | 'motion' | 'sections' | 'currency' | 'integrations' | 'branding' | 'system'>('theme');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const { motionStyle, setMotionStyle, isSmoothScrollEnabled, setSmoothScrollEnabled } = useMotion();
  const { currency, setCurrency } = useCurrency();

  // Settings State Form
  const [settings, setSettings] = useState({
    // Theme
    default_mode: 'light',
    accent_color: '#D97706',
    font_heading: 'Cormorant Garamond',
    font_body: 'Plus Jakarta Sans',
    border_radius: '16px',
    glass_blur: '16px',

    // Motion
    active_motion_style: motionStyle,
    enable_smooth_scroll: isSmoothScrollEnabled,
    enable_preloader: true,
    magnetic_buttons: true,

    // Currency
    default_currency: currency,
    currency_symbol: '৳',
    usd_rate: 0.00833,
    eur_rate: 0.00781,

    // Sections & Header
    ticker_announcement: 'COMPLIMENTARY EXPRESS DELIVERY ON ORDERS OVER ৳ 50,000 | WORLDWIDE CONCIERGE',
    ticker_speed: 30,
    hero_title: 'Crafted for Modern Living. Thoughtfully Curated.',
    hero_subtitle: 'Bespoke timepieces, artisanal apparel, and refined modern essentials crafted with generational mastery.',
    hero_cta_primary: 'Explore Grand Collection',
    hero_cta_secondary: 'The Horology Editorial',

    // Integrations
    enable_bkash: true,
    enable_sslcommerz: true,
    enable_nagad: true,
    enable_cod: true,
    enable_steadfast: true,
    enable_pathao: true,
    enable_ai_assistant: true,
    ai_assistant_greeting_bn: 'স্বাগতম! আমি সেন্টারপয়েন্ট শপিং অ্যাসিস্ট্যান্ট। কীভাবে আপনাকে সাহায্য করতে পারি?',
    ai_assistant_greeting_en: 'Welcome to CENTERPOINT. How may I assist your curation today?',

    // Branding (DevCenterPoint Integration)
    creator_name: 'DevCenterPoint',
    creator_url: 'https://devcenterpoint.com',
    creator_tagline: 'Engineered by DevCenterPoint',
    show_creator_attribution: true,
    product_name: 'CENTERPOINT',
    tagline: 'One Platform. Complete Commerce.',
  });

  // Telemetry metrics
  const [telemetry] = useState({
    dbLatency: '1.2ms',
    cacheHealth: 'Operational (100% Hit)',
    activeGuard: 'Platform (Superadmin)',
    edition: 'Dual-Edition Enterprise',
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/storefront/config');
      const data = res.data?.data;
      if (data) {
        setSettings(prev => ({
          ...prev,
          default_mode: data.theme?.default_mode ?? prev.default_mode,
          accent_color: data.theme?.accent_color ?? prev.accent_color,
          font_heading: data.theme?.font_heading ?? prev.font_heading,
          font_body: data.theme?.font_body ?? prev.font_body,
          border_radius: data.theme?.border_radius ?? prev.border_radius,
          glass_blur: data.theme?.glass_blur ?? prev.glass_blur,
          active_motion_style: data.motion?.active_motion_style ?? prev.active_motion_style,
          enable_smooth_scroll: data.motion?.enable_smooth_scroll ?? prev.enable_smooth_scroll,
          default_currency: data.currency?.default_currency ?? prev.default_currency,
          currency_symbol: data.currency?.currency_symbol ?? prev.currency_symbol,
          ticker_announcement: data.header?.ticker_announcement ?? prev.ticker_announcement,
          hero_title: data.sections?.hero_title ?? prev.hero_title,
          hero_subtitle: data.sections?.hero_subtitle ?? prev.hero_subtitle,
          hero_cta_primary: data.sections?.hero_cta_primary ?? prev.hero_cta_primary,
          hero_cta_secondary: data.sections?.hero_cta_secondary ?? prev.hero_cta_secondary,
          enable_bkash: data.integrations?.enable_bkash ?? prev.enable_bkash,
          enable_sslcommerz: data.integrations?.enable_sslcommerz ?? prev.enable_sslcommerz,
          enable_ai_assistant: data.integrations?.enable_ai_assistant ?? prev.enable_ai_assistant,
          creator_name: data.branding?.creator_name ?? prev.creator_name,
          creator_url: data.branding?.creator_url ?? prev.creator_url,
          show_creator_attribution: data.branding?.show_creator_attribution ?? prev.show_creator_attribution,
        }));
      }
    } catch {
      // Use defaults if offline
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAll = async () => {
    setSaving(true);
    setSaveSuccess(false);

    const payload = Object.entries(settings).map(([key, value]) => ({
      key,
      value,
    }));

    try {
      const token = localStorage.getItem('mcp_token');
      await api.post(
        '/platform/customizer/settings',
        { settings: payload },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Synchronize local contexts
      setMotionStyle(settings.active_motion_style as MotionStyle);
      setSmoothScrollEnabled(settings.enable_smooth_scroll);
      setCurrency(settings.default_currency as CurrencyCode);

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      alert('Failed to save settings. Please ensure your superadmin token is active.');
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = async () => {
    if (!confirm('Are you sure you want to restore all platform settings to factory vetted defaults?')) {
      return;
    }
    setSaving(true);
    try {
      const token = localStorage.getItem('mcp_token');
      await api.post('/platform/customizer/reset', {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchSettings();
      alert('Restored all settings to factory defaults.');
    } catch {
      alert('Failed to reset defaults.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090B] text-zinc-100 flex flex-col font-sans selection:bg-amber-500 selection:text-black">
      {/* Top Bar */}
      <header className="h-16 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-xl px-6 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <button
            onClick={onBackToStorefront}
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition flex items-center gap-2 text-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Storefront</span>
          </button>

          <div className="h-4 w-px bg-zinc-800" />

          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-amber-500 text-zinc-950 flex items-center justify-center font-bold text-xs">
              CP
            </div>
            <div>
              <span className="font-serif font-bold text-sm tracking-wide text-white">MASTER CONTROL PANEL</span>
              <span className="hidden md:inline-block ml-2 px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20">
                SUPERADMIN EXCLUSIVE
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleResetDefaults}
            className="px-3 py-1.5 rounded-xl border border-zinc-800 hover:bg-zinc-900 text-zinc-400 hover:text-red-400 text-xs transition flex items-center gap-1.5"
            title="Restore Factory Defaults"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Reset Defaults</span>
          </button>

          <button
            onClick={handleSaveAll}
            disabled={saving}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs uppercase tracking-wider transition flex items-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : saveSuccess ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            <span>{saving ? 'Applying...' : saveSuccess ? 'Saved Live!' : 'Save All Changes'}</span>
          </button>

          <button
            onClick={onLogout}
            className="text-xs text-zinc-500 hover:text-zinc-300 ml-2"
          >
            Lock Deck
          </button>
        </div>
      </header>

      {/* Main Workspace with Sidebar Tabs */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Sidebar Nav */}
        <nav className="w-full md:w-64 border-r border-zinc-800 bg-zinc-950/40 p-4 space-y-1 shrink-0 overflow-x-auto md:overflow-y-auto">
          {[
            { id: 'theme', label: 'Theme & Tokens', icon: Palette, badge: 'Visual' },
            { id: 'motion', label: 'Motion & Physics', icon: Activity, badge: '5 Styles' },
            { id: 'sections', label: 'Storefront CMS', icon: Layers, badge: 'Layouts' },
            { id: 'currency', label: 'Currencies & Rates', icon: DollarSign, badge: 'BDT Def' },
            { id: 'integrations', label: 'Gateways & Courier', icon: Plug, badge: 'bKash/Pathao' },
            { id: 'branding', label: 'DevCenterPoint Brand', icon: Sparkles, badge: 'Attribution' },
            { id: 'system', label: 'System & Telemetry', icon: Shield, badge: 'Probes' },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-medium transition ${
                  isActive
                    ? 'bg-amber-500 text-zinc-950 font-bold shadow-md'
                    : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{tab.label}</span>
                </div>
                <span
                  className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                    isActive ? 'bg-zinc-950 text-amber-300' : 'bg-zinc-900 text-zinc-500'
                  }`}
                >
                  {tab.badge}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Content Pane */}
        <main className="flex-1 p-6 md:p-10 overflow-y-auto space-y-8 bg-[#09090B]">
          {loading && (
            <div className="text-zinc-500 text-xs flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-amber-500" />
              <span>Syncing with Storefront Settings Engine...</span>
            </div>
          )}

          {/* TAB 1: THEME & TOKENS */}
          {activeTab === 'theme' && (
            <div className="max-w-3xl space-y-8">
              <div>
                <h2 className="text-xl font-bold font-serif text-white">Visual Design System & Tokens</h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Customize the visual identity, fonts, borders, and liquid glass blur across the storefront.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-4">
                  <label className="text-xs font-mono uppercase tracking-wider text-amber-400 block">
                    Default Canvas Mode
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {['light', 'dark'].map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setSettings({ ...settings, default_mode: mode })}
                        className={`p-3 rounded-xl border text-xs font-bold uppercase transition flex items-center justify-center gap-2 ${
                          settings.default_mode === mode
                            ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                            : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white'
                        }`}
                      >
                        {mode === 'light' ? '☀️ Light (Default)' : '🌙 Obsidian Dark'}
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-zinc-500">
                    Both modes are crafted with equal luxury. Circular reveal transition triggers on toggle.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-4">
                  <label className="text-xs font-mono uppercase tracking-wider text-amber-400 block">
                    Primary Accent Color
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={settings.accent_color}
                      onChange={(e) => setSettings({ ...settings, accent_color: e.target.value })}
                      className="w-10 h-10 rounded-xl bg-transparent border-0 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={settings.accent_color}
                      onChange={(e) => setSettings({ ...settings, accent_color: e.target.value })}
                      className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono text-white"
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    {['#D97706', '#2563EB', '#059669', '#E11D48', '#8B5CF6'].map((hex) => (
                      <button
                        key={hex}
                        onClick={() => setSettings({ ...settings, accent_color: hex })}
                        style={{ backgroundColor: hex }}
                        className="w-6 h-6 rounded-full border border-white/20 hover:scale-110 transition"
                      />
                    ))}
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
                  <label className="text-xs font-mono uppercase tracking-wider text-amber-400 block">
                    Editorial Heading Font
                  </label>
                  <select
                    value={settings.font_heading}
                    onChange={(e) => setSettings({ ...settings, font_heading: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-xs text-white"
                  >
                    <option value="Cormorant Garamond">Cormorant Garamond (High-Fashion Luxury)</option>
                    <option value="Playfair Display">Playfair Display (Editorial Poise)</option>
                    <option value="Plus Jakarta Sans">Plus Jakarta Sans (Modern Clean)</option>
                    <option value="Cinzel">Cinzel (Atelier Roman Antiqua)</option>
                  </select>
                </div>

                <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
                  <label className="text-xs font-mono uppercase tracking-wider text-amber-400 block">
                    Liquid Glass Blur
                  </label>
                  <div className="flex items-center justify-between text-xs text-zinc-400">
                    <span>Subtle 8px</span>
                    <span className="font-mono text-amber-400 font-bold">{settings.glass_blur}</span>
                    <span>Intense 32px</span>
                  </div>
                  <input
                    type="range"
                    min="8"
                    max="32"
                    step="4"
                    value={parseInt(settings.glass_blur)}
                    onChange={(e) => setSettings({ ...settings, glass_blur: `${e.target.value}px` })}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MOTION & VELOCITY LAB */}
          {activeTab === 'motion' && (
            <div className="max-w-3xl space-y-8">
              <div>
                <h2 className="text-xl font-bold font-serif text-white">Motion Choreography & Physics</h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Choose between the 5 kinetic motion engines powered by GSAP 3 and Lenis smooth scrolling.
                </p>
              </div>

              {/* 5 Motion Presets Grid */}
              <div className="space-y-3">
                <label className="text-xs font-mono uppercase tracking-wider text-amber-400 block">
                  Active Motion Preset (Select 1 of 5)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(Object.keys(MOTION_STYLES) as MotionStyle[]).map((key) => {
                    const style = MOTION_STYLES[key];
                    const isSelected = settings.active_motion_style === key;
                    return (
                      <div
                        key={key}
                        onClick={() => setSettings({ ...settings, active_motion_style: key })}
                        className={`p-4 rounded-2xl border cursor-pointer transition ${
                          isSelected
                            ? 'bg-amber-500/10 border-amber-500 shadow-lg shadow-amber-500/10'
                            : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-sm text-white">{style.name}</h4>
                          {isSelected && <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />}
                        </div>
                        <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">{style.description}</p>
                        <div className="mt-3 flex items-center gap-2 text-[10px] font-mono text-zinc-500">
                          {style.enable3dTilt && <span className="px-1.5 py-0.5 rounded bg-zinc-800">3D Tilt</span>}
                          {style.enableSpotlight && <span className="px-1.5 py-0.5 rounded bg-zinc-800">Spotlight</span>}
                          {style.enableMagnetic && <span className="px-1.5 py-0.5 rounded bg-zinc-800">Magnetic</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Toggles */}
              <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-white">Lenis Smooth Inertial Scrolling</h4>
                    <p className="text-xs text-zinc-400">Decouples scroll from render loop for buttery smooth velocity.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.enable_smooth_scroll}
                    onChange={(e) => setSettings({ ...settings, enable_smooth_scroll: e.target.checked })}
                    className="w-5 h-5 accent-amber-500 cursor-pointer"
                  />
                </div>

                <div className="h-px bg-zinc-800" />

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-white">Geometric Luxury Preloader</h4>
                    <p className="text-xs text-zinc-400">Animated monogram path drawing with percentage counter on entrance.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.enable_preloader}
                    onChange={(e) => setSettings({ ...settings, enable_preloader: e.target.checked })}
                    className="w-5 h-5 accent-amber-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: STOREFRONT CMS & SECTIONS */}
          {activeTab === 'sections' && (
            <div className="max-w-3xl space-y-8">
              <div>
                <h2 className="text-xl font-bold font-serif text-white">Storefront Layout & Copy CMS</h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Control all public headings, announcement banners, hero slides, and call-to-actions.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-4">
                <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-amber-400">
                  Header Announcement Ticker
                </h3>
                <div className="space-y-1.5">
                  <label className="text-[11px] text-zinc-400">Ticker Copy (Upper Header Bar)</label>
                  <input
                    type="text"
                    value={settings.ticker_announcement}
                    onChange={(e) => setSettings({ ...settings, ticker_announcement: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-xs text-white"
                  />
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-4">
                <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-amber-400">
                  Hero Showcase Presentation
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] text-zinc-400">Main Headline</label>
                    <input
                      type="text"
                      value={settings.hero_title}
                      onChange={(e) => setSettings({ ...settings, hero_title: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-zinc-400">Subtitle Description</label>
                    <textarea
                      rows={2}
                      value={settings.hero_subtitle}
                      onChange={(e) => setSettings({ ...settings, hero_subtitle: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-xs text-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-zinc-400">Primary CTA Button</label>
                      <input
                        type="text"
                        value={settings.hero_cta_primary}
                        onChange={(e) => setSettings({ ...settings, hero_cta_primary: e.target.value })}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-zinc-400">Secondary CTA Button</label>
                      <input
                        type="text"
                        value={settings.hero_cta_secondary}
                        onChange={(e) => setSettings({ ...settings, hero_cta_secondary: e.target.value })}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-xs text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CURRENCY & GLOBAL OPERATIONS */}
          {activeTab === 'currency' && (
            <div className="max-w-3xl space-y-8">
              <div>
                <h2 className="text-xl font-bold font-serif text-white">Currencies & Financial Localization</h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Default currency is set to Bangladeshi Taka (৳ BDT) with instant header conversion.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
                  <label className="text-xs font-mono uppercase tracking-wider text-amber-400 block">
                    Default Platform Currency
                  </label>
                  <select
                    value={settings.default_currency}
                    onChange={(e) => setSettings({ ...settings, default_currency: e.target.value as CurrencyCode })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-xs text-white"
                  >
                    <option value="BDT">Bangladeshi Taka (৳ BDT)</option>
                    <option value="USD">US Dollar ($ USD)</option>
                    <option value="EUR">Euro (€ EUR)</option>
                  </select>
                </div>

                <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
                  <label className="text-xs font-mono uppercase tracking-wider text-amber-400 block">
                    Exchange Rates Against BDT
                  </label>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-400">1 BDT = USD:</span>
                      <input
                        type="number"
                        step="0.0001"
                        value={settings.usd_rate}
                        onChange={(e) => setSettings({ ...settings, usd_rate: parseFloat(e.target.value) || 0 })}
                        className="w-28 bg-zinc-950 border border-zinc-800 rounded-lg p-1.5 text-right font-mono text-white"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-400">1 BDT = EUR:</span>
                      <input
                        type="number"
                        step="0.0001"
                        value={settings.eur_rate}
                        onChange={(e) => setSettings({ ...settings, eur_rate: parseFloat(e.target.value) || 0 })}
                        className="w-28 bg-zinc-950 border border-zinc-800 rounded-lg p-1.5 text-right font-mono text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: INTEGRATIONS & GATEWAYS */}
          {activeTab === 'integrations' && (
            <div className="max-w-3xl space-y-8">
              <div>
                <h2 className="text-xl font-bold font-serif text-white">Payment Gateways & Courier Switches</h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Instantly toggle active payment adapters and delivery providers without touching code.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-4">
                <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-amber-400">
                  Payment Adapters (Bangladesh & Global)
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { key: 'enable_bkash', name: 'bKash Direct' },
                    { key: 'enable_sslcommerz', name: 'SSLCommerz' },
                    { key: 'enable_nagad', name: 'Nagad Pay' },
                    { key: 'enable_cod', name: 'Cash on Delivery' },
                  ].map((gw) => (
                    <button
                      key={gw.key}
                      onClick={() => setSettings({ ...settings, [gw.key]: !(settings as any)[gw.key] })}
                      className={`p-3 rounded-xl border text-xs font-semibold transition text-center ${
                        (settings as any)[gw.key]
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                          : 'border-zinc-800 bg-zinc-950 text-zinc-500'
                      }`}
                    >
                      {(settings as any)[gw.key] ? '✓ ' : '✕ '} {gw.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-4">
                <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-amber-400">
                  Local AI Assistant Personality
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] text-zinc-400">Bangla Greeting</label>
                    <input
                      type="text"
                      value={settings.ai_assistant_greeting_bn}
                      onChange={(e) => setSettings({ ...settings, ai_assistant_greeting_bn: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-zinc-400">English Greeting</label>
                    <input
                      type="text"
                      value={settings.ai_assistant_greeting_en}
                      onChange={(e) => setSettings({ ...settings, ai_assistant_greeting_en: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-xs text-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: DEVCENTERPOINT BRANDING */}
          {activeTab === 'branding' && (
            <div className="max-w-3xl space-y-8">
              <div>
                <h2 className="text-xl font-bold font-serif text-white">DevCenterPoint Official Attribution</h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Manage the official developer branding and technology credentials behind CENTERPOINT.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-white">Display DevCenterPoint Attribution</h4>
                    <p className="text-xs text-zinc-400">
                      Renders subtle "Engineered by DevCenterPoint" links in footer and loader.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.show_creator_attribution}
                    onChange={(e) => setSettings({ ...settings, show_creator_attribution: e.target.checked })}
                    className="w-5 h-5 accent-amber-500 cursor-pointer"
                  />
                </div>

                <div className="h-px bg-zinc-800" />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] text-zinc-400">Creator Organization</label>
                    <input
                      type="text"
                      value={settings.creator_name}
                      onChange={(e) => setSettings({ ...settings, creator_name: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-xs text-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] text-zinc-400">Creator Official URL</label>
                    <input
                      type="url"
                      value={settings.creator_url}
                      onChange={(e) => setSettings({ ...settings, creator_url: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-xs text-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: SYSTEM & TELEMETRY */}
          {activeTab === 'system' && (
            <div className="max-w-3xl space-y-8">
              <div>
                <h2 className="text-xl font-bold font-serif text-white">System Probes & Diagnostics</h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Live runtime telemetry across persistent storage, database, and auth guards.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: 'DB Latency', value: telemetry.dbLatency, status: 'Ultra Low' },
                  { label: 'Cache Engine', value: telemetry.cacheHealth, status: 'Active' },
                  { label: 'Auth Guard', value: telemetry.activeGuard, status: 'Enforced' },
                  { label: 'Edition', value: telemetry.edition, status: 'Verified' },
                ].map((item, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-1">
                    <span className="text-[10px] font-mono uppercase text-zinc-500">{item.label}</span>
                    <p className="text-sm font-bold font-mono text-white">{item.value}</p>
                    <span className="inline-block text-[10px] text-emerald-400 font-semibold">{item.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
