import React, { useState } from 'react';
import { ShieldCheck, Loader2 } from 'lucide-react';

interface SandboxedEmbedProps {
  token: string;
  title?: string;
  height?: number | string;
  className?: string;
}

/**
 * Sandboxed Embed Component (Remediating SEC-04)
 * Loads tenant-supplied custom HTML/CSS/JS in an isolated iframe with strict CSP
 * and opaque origin isolation, preventing session/token hijacking.
 */
export const SandboxedEmbed: React.FC<SandboxedEmbedProps> = ({
  token,
  title = 'Storefront Embed',
  height = 400,
  className = '',
}) => {
  const [loaded, setLoaded] = useState(false);
  const embedUrl = `/api/v1/cms/embeds/${encodeURIComponent(token)}/render`;

  return (
    <div className={`relative w-full rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950 ${className}`}>
      {/* Security boundary badge */}
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800 text-xs text-zinc-400 font-mono">
        <div className="flex items-center gap-1.5 text-emerald-400">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span className="text-[11px] font-medium tracking-wide">SANDBOXED SECURE ISOLATION</span>
        </div>
        <span className="text-[10px] text-zinc-500">CSP: STRICT</span>
      </div>

      {!loaded && (
        <div className="absolute inset-0 top-8 flex items-center justify-center bg-zinc-950/80 z-10">
          <Loader2 className="w-5 h-5 text-amber-500 animate-spin" />
        </div>
      )}

      <iframe
        src={embedUrl}
        title={title}
        style={{ height: typeof height === 'number' ? `${height}px` : height }}
        className="w-full border-0 bg-transparent transition-opacity duration-300"
        // SEC-04: Notice 'allow-same-origin' is intentionally omitted to isolate parent cookies and storage!
        sandbox="allow-scripts allow-forms"
        onLoad={() => setLoaded(true)}
      />
    </div>
  );
};

