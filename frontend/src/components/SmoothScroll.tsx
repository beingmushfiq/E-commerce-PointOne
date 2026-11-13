import React, { useEffect, useRef } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useMotion } from '../contexts/MotionContext';

gsap.registerPlugin(ScrollTrigger);

export const SmoothScroll: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isSmoothScrollEnabled, motionStyle } = useMotion();
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    // Respect user's system preferences or disabled setting
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!isSmoothScrollEnabled || prefersReducedMotion || motionStyle === 'minimal_precision') {
      return;
    }

    const lenis = new Lenis({
      duration: motionStyle === 'velvet_luxury' ? 1.6 : 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1.0,
      touchMultiplier: 1.5,
    });

    lenisRef.current = lenis;

    // Connect Lenis to GSAP ScrollTrigger
    lenis.on('scroll', ScrollTrigger.update);

    const updateTicker = (time: number) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(updateTicker);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(updateTicker);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [isSmoothScrollEnabled, motionStyle]);

  return <div className="smooth-scroll-wrapper">{children}</div>;
};
