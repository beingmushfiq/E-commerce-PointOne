import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Laptop, Tablet, Smartphone, Undo2, Redo2,
  Eye, CloudUpload, ShieldCheck
} from 'lucide-react';

export type DeviceViewport = 'desktop' | 'tablet' | 'mobile';

export const VisualCmsLayout: React.FC = () => {
  const navigate = useNavigate();
  const { pageId = 'home' } = useParams<{ pageId: string }>();

  const [device, setDevice] = useState<DeviceViewport>('desktop');
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);

  return (
    <div className="h-screen flex flex-col bg-zinc-950 text-white overflow-hidden select-none font-sans">
      {/* 1. TOP BUILDER COMMAND STRIP */}
      <header className="h-14 px-4 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between z-30 shrink-0">
        {/* Left: Exit & Page Identity */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/studio/store-design')}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition flex items-center gap-1.5 text-xs font-mono cursor-pointer"
            title="Exit to Store Studio"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Exit</span>
          </button>

          <div className="h-4 w-px bg-zinc-800" />

          <div className="flex items-center gap-2">
            <span className="font-serif font-bold text-sm tracking-tight text-white">
              Visual Canvas:
            </span>
            <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-amber-400 text-xs font-mono font-semibold uppercase">
              {pageId}
            </span>
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-400 pl-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Autosaved</span>
            </div>
          </div>
        </div>

        {/* Center: Responsive Device Switcher */}
        <div className="flex items-center bg-zinc-950 rounded-xl p-1 border border-zinc-800">
          <button
            onClick={() => setDevice('desktop')}
            className={`p-1.5 rounded-lg transition text-xs flex items-center gap-1.5 cursor-pointer ${
              device === 'desktop'
                ? 'bg-amber-500 text-zinc-950 font-bold'
                : 'text-zinc-400 hover:text-white'
            }`}
            title="Desktop View (1440px)"
          >
            <Laptop className="w-3.5 h-3.5" />
            <span className="text-[10px] font-mono hidden md:inline">1440px</span>
          </button>
          <button
            onClick={() => setDevice('tablet')}
            className={`p-1.5 rounded-lg transition text-xs flex items-center gap-1.5 cursor-pointer ${
              device === 'tablet'
                ? 'bg-amber-500 text-zinc-950 font-bold'
                : 'text-zinc-400 hover:text-white'
            }`}
            title="Tablet View (768px)"
          >
            <Tablet className="w-3.5 h-3.5" />
            <span className="text-[10px] font-mono hidden md:inline">768px</span>
          </button>
          <button
            onClick={() => setDevice('mobile')}
            className={`p-1.5 rounded-lg transition text-xs flex items-center gap-1.5 cursor-pointer ${
              device === 'mobile'
                ? 'bg-amber-500 text-zinc-950 font-bold'
                : 'text-zinc-400 hover:text-white'
            }`}
            title="Mobile View (375px)"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="text-[10px] font-mono hidden md:inline">375px</span>
          </button>
        </div>

        {/* Right: Actions (Undo/Redo, Preview, Publish) */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-zinc-400">
            <button className="p-1.5 rounded-lg hover:bg-zinc-800 hover:text-white transition cursor-pointer" title="Undo (Ctrl+Z)">
              <Undo2 className="w-4 h-4" />
            </button>
            <button className="p-1.5 rounded-lg hover:bg-zinc-800 hover:text-white transition cursor-pointer" title="Redo (Ctrl+Y)">
              <Redo2 className="w-4 h-4" />
            </button>
          </div>

          <div className="h-4 w-px bg-zinc-800" />

          <Link
            to="/"
            target="_blank"
            className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-mono flex items-center gap-1.5 transition"
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Preview Draft</span>
          </Link>

          <button
            onClick={() => setIsPublishModalOpen(true)}
            className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold font-mono tracking-wider shadow flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
          >
            <CloudUpload className="w-3.5 h-3.5" />
            <span>Publish Page</span>
          </button>
        </div>
      </header>

      {/* 2. THREE-PANEL VISUAL WORKSPACE VIEWPORT */}
      <div className="flex-1 flex overflow-hidden">
        <Outlet context={{ device }} />
      </div>

      {/* Publish Modal */}
      {isPublishModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl text-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="font-serif font-bold text-lg">
                Publish Page: {pageId.toUpperCase()}
              </h4>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed mb-4">
              This will compile and publish the latest draft to your live customer storefront. All section changes, image focal points, and typography adjustments will take effect immediately.
            </p>
            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 text-xs font-mono text-zinc-300 space-y-1.5 mb-6">
              <div className="flex justify-between">
                <span className="text-zinc-500">Target Channel:</span>
                <span className="text-white">Storefront Live</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Security Check:</span>
                <span className="text-emerald-400">Passed (No Unsafe CSP)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Rollback Available:</span>
                <span className="text-amber-400">Yes (Auto-Revision #12)</span>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsPublishModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setIsPublishModalOpen(false);
                  alert('Page successfully published to live storefront!');
                }}
                className="px-4 py-2 text-xs font-bold font-mono rounded-xl bg-amber-500 text-zinc-950 hover:bg-amber-400 transition cursor-pointer shadow"
              >
                Confirm & Publish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
