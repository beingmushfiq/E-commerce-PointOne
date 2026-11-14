import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * 1. useScrollReveal
 * Reveals elements with silky upward translation, opacity fade, and blur dissipation.
 */
interface ScrollRevealOptions {
  y?: number;
  duration?: number;
  delay?: number;
  stagger?: number;
  triggerHook?: string;
  once?: boolean;
}

export function useScrollReveal<T extends HTMLElement = HTMLDivElement>(
  options: ScrollRevealOptions = {}
) {
  const elementRef = useRef<T>(null);
  const {
    y = 35,
    duration = 0.9,
    delay = 0,
    stagger = 0.12,
    triggerHook = 'top 85%',
    once = true,
  } = options;

  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      const targets = el.children.length > 0 && el.dataset.staggerChildren !== undefined
        ? el.children
        : el;

      gsap.fromTo(
        targets,
        {
          opacity: 0,
          y,
          filter: 'blur(6px)',
        },
        {
          opacity: 1,
          y: 0,
          filter: 'blur(0px)',
          duration,
          delay,
          stagger: el.children.length > 0 && el.dataset.staggerChildren !== undefined ? stagger : 0,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: el,
            start: triggerHook,
            once,
          },
        }
      );
    }, el);

    return () => ctx.revert();
  }, [y, duration, delay, stagger, triggerHook, once]);

  return elementRef;
}

/**
 * 2. useParallax
 * ScrollTrigger-driven parallax scrub for photography and hero layers.
 */
interface ParallaxOptions {
  speed?: number; // e.g. -20 to 20 percent translation
  scale?: number; // e.g. 1.08 to 1.0
  direction?: 'vertical' | 'horizontal';
}

export function useParallax<T extends HTMLElement = HTMLDivElement>(
  options: ParallaxOptions = {}
) {
  const elementRef = useRef<T>(null);
  const { speed = 15, scale = 1.08, direction = 'vertical' } = options;

  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      const animProps: gsap.TweenVars = {
        ease: 'none',
        scrollTrigger: {
          trigger: el,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1.2,
        },
      };

      if (direction === 'vertical') {
        animProps.yPercent = speed;
      } else {
        animProps.xPercent = speed;
      }

      if (scale) {
        animProps.scale = 1.0;
        gsap.set(el, { scale });
      }

      gsap.to(el, animProps);
    }, el);

    return () => ctx.revert();
  }, [speed, scale, direction]);

  return elementRef;
}

/**
 * 3. useMagnetic
 * Smooth cursor-proximity attraction for luxury buttons and interactive badges.
 */
interface MagneticOptions {
  strength?: number; // 0.1 to 0.5
  proximity?: number; // radius in px
}

export function useMagnetic<T extends HTMLElement = HTMLButtonElement>(
  options: MagneticOptions = {}
) {
  const elementRef = useRef<T>(null);
  const { strength = 0.35, proximity = 70 } = options;

  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;

    // Skip on touch devices or reduced motion
    if (window.matchMedia('(pointer: coarse)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const xTo = gsap.quickTo(el, 'x', { duration: 0.4, ease: 'power4.out' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.4, ease: 'power4.out' });

    const handleMouseMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const distX = e.clientX - centerX;
      const distY = e.clientY - centerY;
      const distance = Math.hypot(distX, distY);

      if (distance < proximity + rect.width / 2) {
        xTo(distX * strength);
        yTo(distY * strength);
      } else {
        xTo(0);
        yTo(0);
      }
    };

    const handleMouseLeave = () => {
      xTo(0);
      yTo(0);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    el.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      el.removeEventListener('mouseleave', handleMouseLeave);
      gsap.killTweensOf(el);
    };
  }, [strength, proximity]);

  return elementRef;
}

/**
 * 4. useCounterTween
 * Animates numeric stat displays on scroll entrance.
 */
interface CounterOptions {
  endValue: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}

export function useCounterTween<T extends HTMLElement = any>(
  options: CounterOptions
): React.RefObject<T | null> {
  const elementRef = useRef<T>(null);
  const { endValue, duration = 1.6, prefix = '', suffix = '', decimals = 0 } = options;

  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      el.innerText = `${prefix}${endValue.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}${suffix}`;
      return;
    }

    const state = { val: 0 };

    const ctx = gsap.context(() => {
      gsap.to(state, {
        val: endValue,
        duration,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 90%',
          once: true,
        },
        onUpdate: () => {
          if (el) {
            const formatted = state.val.toLocaleString(undefined, {
              minimumFractionDigits: decimals,
              maximumFractionDigits: decimals,
            });
            el.innerText = `${prefix}${formatted}${suffix}`;
          }
        },
      });
    }, el);

    return () => ctx.revert();
  }, [endValue, duration, prefix, suffix, decimals]);

  return elementRef;
}
