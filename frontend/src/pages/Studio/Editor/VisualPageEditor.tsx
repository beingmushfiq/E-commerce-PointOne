import React, { useState } from 'react';
import { useOutletContext, useParams } from 'react-router-dom';
import {
  Layers, Plus, Eye, EyeOff, ArrowUp, ArrowDown, Sliders
} from 'lucide-react';
import type { DeviceViewport } from '../../../layouts/VisualCmsLayout';

interface SectionBlock {
  id: string;
  type: 'hero' | 'trust_badges' | 'products_grid' | 'editorial' | 'faq' | 'newsletter';
  name: string;
  visible: boolean;
  props: Record<string, any>;
}

export const VisualPageEditor: React.FC = () => {
  const { device = 'desktop' } = useOutletContext<{ device: DeviceViewport }>();
  const { pageId = 'home' } = useParams<{ pageId: string }>();

  // Page Section Tree State
  const [sections, setSections] = useState<SectionBlock[]>([
    {
      id: 'sec-hero',
      type: 'hero',
      name: 'Hero Photographic Banner',
      visible: true,
      props: {
        headline: 'Crafted for Modern Living. Thoughtfully Curated.',
        subtitle: 'Bespoke timepieces, artisanal apparel, and refined modern essentials crafted with generational mastery.',
        ctaText: 'Explore Grand Collection',
        ctaLink: '/collections/all',
        imageUrl: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=1600',
        align: 'left',
      },
    },
    {
      id: 'sec-trust',
      type: 'trust_badges',
      name: 'Atelier Trust & Guarantees',
      visible: true,
      props: {
        badge1: '5-Year Atelier Guarantee',
        badge2: 'Express Insured Delivery',
        badge3: 'bKash & SSLCommerz Settlement',
      },
    },
    {
      id: 'sec-products',
      type: 'products_grid',
      name: 'Curated Masterpieces Grid',
      visible: true,
      props: {
        title: 'Featured Complications',
        category: 'all',
        limit: 4,
      },
    },
    {
      id: 'sec-editorial',
      type: 'editorial',
      name: 'Storytelling Split Section',
      visible: true,
      props: {
        title: 'The Horology Workshop',
        content: 'Every complication is hand-assembled in our Geneva and Dhaka workshops by master watchmakers.',
        stat1: '300+ Parts',
        stat2: '120h Power',
      },
    },
    {
      id: 'sec-faq',
      type: 'faq',
      name: 'Client Inquiries & FAQ',
      visible: true,
      props: {
        heading: 'Frequently Inquired',
      },
    },
  ]);

  const [selectedSectionId, setSelectedSectionId] = useState<string>('sec-hero');

  const selectedSection = sections.find((s) => s.id === selectedSectionId);

  const handleUpdateProps = (key: string, value: any) => {
    setSections((prev) =>
      prev.map((s) => {
        if (s.id !== selectedSectionId) return s;
        return {
          ...s,
          props: { ...s.props, [key]: value },
        };
      })
    );
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === sections.length - 1) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const newSections = [...sections];
    const temp = newSections[index];
    newSections[index] = newSections[targetIndex];
    newSections[targetIndex] = temp;
    setSections(newSections);
  };

  const handleToggleVisibility = (id: string) => {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, visible: !s.visible } : s))
    );
  };

  // Device width wrapper
  const viewportWidthClass = {
    desktop: 'w-full max-w-6xl',
    tablet: 'w-[768px] shadow-2xl',
    mobile: 'w-[375px] shadow-2xl',
  }[device];

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* 1. LEFT PANEL: STRUCTURE & SECTION TREE */}
      <aside className="w-72 bg-zinc-900 border-r border-zinc-800 flex flex-col shrink-0 select-none z-10">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-amber-500" />
            <span>Layout Tree ({pageId})</span>
          </span>
          <button
            onClick={() => {
              const newSec: SectionBlock = {
                id: `sec-${Date.now()}`,
                type: 'editorial',
                name: 'Custom Story Block',
                visible: true,
                props: { title: 'New Editorial', content: 'Describe brand craft...' },
              };
              setSections([...sections, newSec]);
              setSelectedSectionId(newSec.id);
            }}
            className="p-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition cursor-pointer"
            title="Add Section Block"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {sections.map((section, idx) => {
            const isSelected = section.id === selectedSectionId;
            return (
              <div
                key={section.id}
                onClick={() => setSelectedSectionId(section.id)}
                className={`p-3 rounded-xl border text-xs font-mono transition cursor-pointer flex items-center justify-between group ${
                  isSelected
                    ? 'border-amber-500 bg-amber-500/10 text-white font-bold'
                    : 'border-zinc-800 bg-zinc-950/60 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <span className="text-[10px] text-zinc-500">#{idx + 1}</span>
                  <span className="truncate">{section.name}</span>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMove(idx, 'up');
                    }}
                    className="p-1 hover:text-white cursor-pointer"
                    title="Move up"
                  >
                    <ArrowUp className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMove(idx, 'down');
                    }}
                    className="p-1 hover:text-white cursor-pointer"
                    title="Move down"
                  >
                    <ArrowDown className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleVisibility(section.id);
                    }}
                    className="p-1 hover:text-white cursor-pointer"
                    title={section.visible ? 'Hide' : 'Show'}
                  >
                    {section.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3 text-zinc-600" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </aside>

      {/* 2. CENTER CANVAS: LIVE RESPONSIVE PREVIEW */}
      <main className="flex-1 bg-zinc-950 overflow-y-auto p-6 flex justify-center items-start">
        <div
          className={`${viewportWidthClass} transition-all duration-300 bg-white text-zinc-950 rounded-2xl overflow-hidden shadow-2xl min-h-[850px] border border-zinc-800 relative`}
        >
          {sections
            .filter((s) => s.visible)
            .map((section) => {
              const isSelected = section.id === selectedSectionId;

              return (
                <div
                  key={section.id}
                  onClick={() => setSelectedSectionId(section.id)}
                  className={`relative transition cursor-pointer ${
                    isSelected
                      ? 'ring-4 ring-amber-500 ring-inset'
                      : 'hover:outline-dashed hover:outline-2 hover:outline-amber-400'
                  }`}
                >
                  {/* HERO BLOCK */}
                  {section.type === 'hero' && (
                    <div className="relative min-h-[420px] bg-zinc-950 text-white flex items-center p-8 sm:p-14 overflow-hidden">
                      {section.props.imageUrl && (
                        <img
                          src={section.props.imageUrl}
                          alt=""
                          className="absolute inset-0 w-full h-full object-cover opacity-40"
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/60 to-transparent" />
                      <div className="relative z-10 max-w-lg space-y-4">
                        <span className="text-[10px] font-mono tracking-widest text-amber-400 uppercase">
                          Visual Preview
                        </span>
                        <h2 className="font-serif font-bold text-3xl sm:text-5xl leading-tight">
                          {section.props.headline}
                        </h2>
                        <p className="text-xs text-zinc-300 leading-relaxed font-sans">
                          {section.props.subtitle}
                        </p>
                        <div className="pt-2">
                          <span className="inline-block px-5 py-2.5 rounded-xl bg-amber-500 text-zinc-950 text-xs font-bold font-mono">
                            {section.props.ctaText}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TRUST BADGES */}
                  {section.type === 'trust_badges' && (
                    <div className="p-6 bg-zinc-50 border-y border-zinc-200 grid grid-cols-3 gap-4 text-center text-xs font-mono text-zinc-700">
                      <div>🛡️ {section.props.badge1}</div>
                      <div>🚚 {section.props.badge2}</div>
                      <div>💳 {section.props.badge3}</div>
                    </div>
                  )}

                  {/* PRODUCTS GRID */}
                  {section.type === 'products_grid' && (
                    <div className="p-8 space-y-4 bg-white">
                      <div className="flex justify-between items-center">
                        <h3 className="font-serif font-bold text-xl text-zinc-900">
                          {section.props.title}
                        </h3>
                        <span className="text-xs font-mono text-zinc-400">Live Catalog Binding</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className="p-3 rounded-xl border border-zinc-200 bg-zinc-50 space-y-2">
                            <div className="aspect-square bg-zinc-200 rounded-lg" />
                            <div className="h-3 bg-zinc-200 rounded w-2/3" />
                            <div className="h-3 bg-amber-200 rounded w-1/3" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* EDITORIAL SPLIT */}
                  {section.type === 'editorial' && (
                    <div className="p-8 bg-zinc-100 grid grid-cols-2 gap-6 items-center">
                      <div className="space-y-3">
                        <h3 className="font-serif font-bold text-2xl text-zinc-900">
                          {section.props.title}
                        </h3>
                        <p className="text-xs text-zinc-600 leading-relaxed">
                          {section.props.content}
                        </p>
                      </div>
                      <div className="aspect-video bg-zinc-300 rounded-2xl" />
                    </div>
                  )}

                  {/* FAQ */}
                  {section.type === 'faq' && (
                    <div className="p-8 bg-white border-t border-zinc-200 text-center">
                      <h4 className="font-serif font-bold text-lg mb-2">{section.props.heading}</h4>
                      <p className="text-xs text-zinc-400">Interactive Accordion Component</p>
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      </main>

      {/* 3. RIGHT PANEL: INSPECTOR */}
      <aside className="w-80 bg-zinc-900 border-l border-zinc-800 flex flex-col shrink-0 select-none z-10">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
            <Sliders className="w-3.5 h-3.5 text-amber-500" />
            <span>Block Inspector</span>
          </span>
          {selectedSection && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-amber-400 uppercase">
              {selectedSection.type}
            </span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs font-mono">
          {selectedSection ? (
            <>
              {selectedSection.props.headline !== undefined && (
                <div>
                  <label className="text-zinc-400 block mb-1">Headline Text</label>
                  <textarea
                    rows={3}
                    value={selectedSection.props.headline}
                    onChange={(e) => handleUpdateProps('headline', e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-sans text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>
              )}

              {selectedSection.props.subtitle !== undefined && (
                <div>
                  <label className="text-zinc-400 block mb-1">Subtitle Description</label>
                  <textarea
                    rows={3}
                    value={selectedSection.props.subtitle}
                    onChange={(e) => handleUpdateProps('subtitle', e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-sans text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>
              )}

              {selectedSection.props.ctaText !== undefined && (
                <div>
                  <label className="text-zinc-400 block mb-1">Button Call-to-Action</label>
                  <input
                    type="text"
                    value={selectedSection.props.ctaText}
                    onChange={(e) => handleUpdateProps('ctaText', e.target.value)}
                    className="w-full p-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>
              )}

              {selectedSection.props.imageUrl !== undefined && (
                <div>
                  <label className="text-zinc-400 block mb-1">Background Photographic URL</label>
                  <input
                    type="text"
                    value={selectedSection.props.imageUrl}
                    onChange={(e) => handleUpdateProps('imageUrl', e.target.value)}
                    className="w-full p-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs focus:border-amber-500 focus:outline-none truncate"
                  />
                </div>
              )}

              {selectedSection.props.title !== undefined && (
                <div>
                  <label className="text-zinc-400 block mb-1">Section Title</label>
                  <input
                    type="text"
                    value={selectedSection.props.title}
                    onChange={(e) => handleUpdateProps('title', e.target.value)}
                    className="w-full p-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>
              )}

              {/* Responsive Visibility Controls */}
              <div className="pt-4 border-t border-zinc-800 space-y-2">
                <span className="text-zinc-400 uppercase text-[10px] block font-bold">
                  Responsive Breakpoint Toggles
                </span>
                <div className="flex justify-between items-center text-zinc-300">
                  <span>Show on Mobile (&lt; 640px)</span>
                  <input type="checkbox" defaultChecked className="accent-amber-500" />
                </div>
                <div className="flex justify-between items-center text-zinc-300">
                  <span>Show on Tablet (640-1024px)</span>
                  <input type="checkbox" defaultChecked className="accent-amber-500" />
                </div>
                <div className="flex justify-between items-center text-zinc-300">
                  <span>Show on Desktop (&gt; 1024px)</span>
                  <input type="checkbox" defaultChecked className="accent-amber-500" />
                </div>
              </div>
            </>
          ) : (
            <div className="text-center text-zinc-500 pt-12">
              Select a section on the canvas to configure properties.
            </div>
          )}
        </div>
      </aside>
    </div>
  );
};
