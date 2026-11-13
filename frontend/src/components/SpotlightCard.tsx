import React, { useRef, useState } from 'react';
import { useMotion } from '../contexts/MotionContext';

interface SpotlightCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  spotlightColor?: string;
}

export const SpotlightCard: React.FC<SpotlightCardProps> = ({
  children,
  className = '',
  spotlightColor = 'rgba(217, 119, 6, 0.12)', // Subtle Champagne Amber
  ...props
}) => {
  const { config } = useMotion();
  const cardRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [tilt, setTilt] = useState<{ rx: number; ry: number }>({ rx: 0, ry: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setCoords({ x, y });

    if (config.enable3dTilt) {
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const tiltFactor = 8; // Max 8 degrees tilt
      const rx = -((y - centerY) / centerY) * tiltFactor;
      const ry = ((x - centerX) / centerX) * tiltFactor;
      setTilt({ rx, ry });
    }
  };

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => {
    setIsHovered(false);
    setTilt({ rx: 0, ry: 0 });
  };

  const transformStyle = config.enable3dTilt && isHovered
    ? `perspective(1000px) rotateX(${tilt.rx.toFixed(2)}deg) rotateY(${tilt.ry.toFixed(2)}deg) translateY(-4px)`
    : 'none';

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: transformStyle,
        transition: isHovered ? 'transform 0.1s ease-out' : 'transform 0.5s ease-out',
      }}
      className={`relative rounded-2xl overflow-hidden bg-white/90 dark:bg-[#121215]/80 backdrop-blur-xl border border-zinc-200/90 dark:border-zinc-800/80 shadow-sm hover:shadow-xl transition-shadow duration-300 ${className}`}
      {...props}
    >
      {/* Ambient Spotlight Layer */}
      {config.enableSpotlight && isHovered && (
        <div
          className="pointer-events-none absolute -inset-px opacity-100 transition-opacity duration-300"
          style={{
            background: `radial-gradient(400px circle at ${coords.x}px ${coords.y}px, ${spotlightColor}, transparent 70%)`,
          }}
        />
      )}

      {/* Card Content Container */}
      <div className="relative z-10 w-full h-full">{children}</div>
    </div>
  );
};
