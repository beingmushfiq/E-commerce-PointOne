import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useMotion } from '../contexts/MotionContext';

gsap.registerPlugin(ScrollTrigger);

interface LenisContextType {
  lenis: Lenis | null;
  scrollTo: (target: number | string | HTMLElement, options?: any) => void;
  stop: () => void;
  start: () => void;
}

const LenisContext = createContext<LenisContextType>({
  lenis: null,
  scrollTo: () => {},
  stop: () => {},
  start: () => {},
});

export const useLenis = () => useContext(LenisContext);

export const SmoothScroll: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isSmoothScrollEnabled, motionStyle } = useMotion();
  const [lenisInstance, setLenisInstance] = useState<Lenis | null>(null);
  const lenisRef = useRef<Lenis | null>(null);
  const location = useLocation();

  useEffect(() => {
    // Respect user's system preferences or disabled setting
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!isSmoothScrollEnabled || prefersReducedMotion || motionStyle === 'minimal_precision') {
      lenisRef.current?.destroy();
      lenisRef.current = null;
      setLenisInstance(null);
      return;
    }

    const durationMap: Record<string, number> = {
      velvet_luxury: 1.6,
      cinematic_showcase: 1.4,
      editorial_flow: 1.2,
      kinetic_dynamic: 1.0,
      minimal_precision: 0.6,
    };

    const duration = durationMap[motionStyle] || 1.2;

    const lenis = new Lenis({
      duration,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1.0,
      touchMultiplier: 1.2,
    });

    lenisRef.current = lenis;
    setLenisInstance(lenis);

    // Sync Lenis scroll with GSAP ScrollTrigger
    lenis.on('scroll', ScrollTrigger.update);

    const updateTicker = (time: number) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(updateTicker);
    gsap.ticker.lagSmoothing(0);

    // Refresh ScrollTrigger calculations
    const refreshTimer = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 100);

    return () => {
      clearTimeout(refreshTimer);
      gsap.ticker.remove(updateTicker);
      lenis.destroy();
      lenisRef.current = null;
      setLenisInstance(null);
    };
  }, [isSmoothScrollEnabled, motionStyle]);

  // Reset scroll to top on route change
  useEffect(() => {
    if (lenisRef.current) {
      lenisRef.current.scrollTo(0, { immediate: true });
    } else {
      window.scrollTo(0, 0);
    }
    const timer = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 150);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  const scrollTo = (target: number | string | HTMLElement, options?: any) => {
    if (lenisRef.current) {
      lenisRef.current.scrollTo(target, options);
    } else if (typeof target === 'number') {
      window.scrollTo({ top: target, behavior: 'smooth' });
    }
  };

  const stop = () => lenisRef.current?.stop();
  const start = () => lenisRef.current?.start();

  return (
    <LenisContext.Provider value={{ lenis: lenisInstance, scrollTo, stop, start }}>
      <div className="smooth-scroll-wrapper min-h-screen">
        {children}
      </div>
    </LenisContext.Provider>
  );
};
