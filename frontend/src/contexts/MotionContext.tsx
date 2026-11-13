import React, { createContext, useContext, useState } from 'react';

export type MotionStyle =
  | 'editorial_flow'      // Subtle, high-velocity, smooth inertia, delicate fade-up, magnetic buttons
  | 'cinematic_showcase'   // 3D perspective tilt, mouse-tracking spotlight, parallax hero, pinned scrolls
  | 'minimal_precision'    // Zero parallax, snappy 120ms transitions, clean micro-damping
  | 'velvet_luxury'        // Slow graceful liquid easing, delayed stagger, deep blur shifts
  | 'kinetic_dynamic';     // Spring physics, playful hover attraction, scale popovers

export interface MotionConfig {
  id: MotionStyle;
  name: string;
  description: string;
  durationMultiplier: number;
  enable3dTilt: boolean;
  enableSpotlight: boolean;
  enableMagnetic: boolean;
  enableParallax: boolean;
  easing: string;
}

export const MOTION_STYLES: Record<MotionStyle, MotionConfig> = {
  editorial_flow: {
    id: 'editorial_flow',
    name: 'Editorial Flow',
    description: 'Subtle, high-velocity smooth inertia with delicate fade-up and magnetic buttons.',
    durationMultiplier: 1.0,
    enable3dTilt: false,
    enableSpotlight: true,
    enableMagnetic: true,
    enableParallax: false,
    easing: 'power3.out',
  },
  cinematic_showcase: {
    id: 'cinematic_showcase',
    name: 'Cinematic Showcase',
    description: 'Interactive 3D tilt, mouse-tracking spotlights, and multi-layer parallax hero depth.',
    durationMultiplier: 1.3,
    enable3dTilt: true,
    enableSpotlight: true,
    enableMagnetic: true,
    enableParallax: true,
    easing: 'power4.out',
  },
  minimal_precision: {
    id: 'minimal_precision',
    name: 'Minimal Precision',
    description: 'Instant 120ms transitions with micro-damping, zero parallax, maximum shopping focus.',
    durationMultiplier: 0.5,
    enable3dTilt: false,
    enableSpotlight: false,
    enableMagnetic: false,
    enableParallax: false,
    easing: 'linear',
  },
  velvet_luxury: {
    id: 'velvet_luxury',
    name: 'Velvet Luxury',
    description: 'Slow graceful liquid curves, delayed staggers, deep blur shifts, and couture pacing.',
    durationMultiplier: 1.6,
    enable3dTilt: true,
    enableSpotlight: true,
    enableMagnetic: true,
    enableParallax: true,
    easing: 'expo.out',
  },
  kinetic_dynamic: {
    id: 'kinetic_dynamic',
    name: 'Kinetic Dynamic',
    description: 'Snappy spring physics, scale popovers, and animated micro-reactions for product drops.',
    durationMultiplier: 0.9,
    enable3dTilt: true,
    enableSpotlight: true,
    enableMagnetic: true,
    enableParallax: false,
    easing: 'elastic.out(1, 0.75)',
  },
};

interface MotionContextType {
  motionStyle: MotionStyle;
  setMotionStyle: (style: MotionStyle) => void;
  config: MotionConfig;
  isSmoothScrollEnabled: boolean;
  setSmoothScrollEnabled: (enabled: boolean) => void;
}

const MotionContext = createContext<MotionContextType>({
  motionStyle: 'editorial_flow',
  setMotionStyle: () => {},
  config: MOTION_STYLES.editorial_flow,
  isSmoothScrollEnabled: true,
  setSmoothScrollEnabled: () => {},
});

export const MotionProvider: React.FC<{
  children: React.ReactNode;
  initialStyle?: MotionStyle;
}> = ({ children, initialStyle }) => {
  const [motionStyle, setMotionStyleState] = useState<MotionStyle>(() => {
    const saved = localStorage.getItem('centerpoint_motion_style') as MotionStyle;
    return saved && MOTION_STYLES[saved] ? saved : (initialStyle || 'editorial_flow');
  });

  const [isSmoothScrollEnabled, setSmoothScrollEnabledState] = useState<boolean>(() => {
    const saved = localStorage.getItem('centerpoint_smooth_scroll');
    return saved !== null ? saved === 'true' : true;
  });

  const setMotionStyle = (style: MotionStyle) => {
    setMotionStyleState(style);
    localStorage.setItem('centerpoint_motion_style', style);
  };

  const setSmoothScrollEnabled = (enabled: boolean) => {
    setSmoothScrollEnabledState(enabled);
    localStorage.setItem('centerpoint_smooth_scroll', String(enabled));
  };

  return (
    <MotionContext.Provider
      value={{
        motionStyle,
        setMotionStyle,
        config: MOTION_STYLES[motionStyle],
        isSmoothScrollEnabled,
        setSmoothScrollEnabled,
      }}
    >
      {children}
    </MotionContext.Provider>
  );
};

export const useMotion = () => useContext(MotionContext);
