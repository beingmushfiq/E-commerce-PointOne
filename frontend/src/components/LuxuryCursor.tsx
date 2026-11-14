import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

export const LuxuryCursor: React.FC = () => {
  const cursorDotRef = useRef<HTMLDivElement>(null);
  const cursorRingRef = useRef<HTMLDivElement>(null);
  const [cursorText, setCursorText] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check for touch device or reduced motion
    const isTouch = window.matchMedia('(pointer: coarse)').matches;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (isTouch || prefersReducedMotion) {
      return;
    }

    const dot = cursorDotRef.current;
    const ring = cursorRingRef.current;
    if (!dot || !ring) return;

    // Fast quickTo for dot, damped quickTo for ring
    const dotX = gsap.quickTo(dot, 'x', { duration: 0.08, ease: 'power2.out' });
    const dotY = gsap.quickTo(dot, 'y', { duration: 0.08, ease: 'power2.out' });
    const ringX = gsap.quickTo(ring, 'x', { duration: 0.28, ease: 'power3.out' });
    const ringY = gsap.quickTo(ring, 'y', { duration: 0.28, ease: 'power3.out' });

    const handleMouseMove = (e: MouseEvent) => {
      if (!isVisible) setIsVisible(true);

      dotX(e.clientX);
      dotY(e.clientY);
      ringX(e.clientX);
      ringY(e.clientY);

      // Check hovered element
      const target = e.target as HTMLElement | null;
      const interactiveEl = target?.closest('a, button, input, select, [role="button"], [data-cursor]');

      if (interactiveEl) {
        setIsHovered(true);
        const customText = interactiveEl.getAttribute('data-cursor-text');
        setCursorText(customText || null);
      } else {
        setIsHovered(false);
        setCursorText(null);
      }
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [isVisible]);

  // Don't render anything if device is touch or cursor invisible
  if (typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden transition-opacity duration-300" style={{ opacity: isVisible ? 1 : 0 }}>
      {/* Precision Center Dot */}
      <div
        ref={cursorDotRef}
        className="fixed top-0 left-0 -ml-1 -mt-1 w-2 h-2 rounded-full bg-amber-500 shadow-sm pointer-events-none transition-transform duration-100 ease-out"
        style={{ transform: isHovered ? 'scale(0)' : 'scale(1)' }}
      />

      {/* Trailing Aura Ring */}
      <div
        ref={cursorRingRef}
        className={`fixed top-0 left-0 -ml-5 -mt-5 rounded-full border pointer-events-none flex items-center justify-center transition-all duration-300 ease-out backdrop-blur-[1px] ${
          isHovered
            ? 'w-16 h-16 -ml-8 -mt-8 border-amber-400/80 bg-amber-500/15 scale-100 shadow-lg shadow-amber-500/10'
            : 'w-10 h-10 border-amber-500/40 bg-transparent scale-100'
        }`}
      >
        {cursorText && (
          <span className="text-[9px] font-mono font-bold tracking-widest uppercase text-amber-500 dark:text-amber-400 select-none animate-fadeIn">
            {cursorText}
          </span>
        )}
      </div>
    </div>
  );
};
