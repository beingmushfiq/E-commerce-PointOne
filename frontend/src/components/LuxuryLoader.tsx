import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const LuxuryLoader: React.FC<{ onComplete?: () => void }> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    const startTime = Date.now();
    const duration = 1200; // 1.2s smooth luxury reveal

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const nextProgress = Math.min(100, Math.floor((elapsed / duration) * 100));
      setProgress(nextProgress);

      if (nextProgress >= 100) {
        clearInterval(timer);
        setTimeout(() => {
          setIsFinished(true);
          onComplete?.();
        }, 250);
      }
    }, 16);

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {!isFinished && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#FAFAF9] dark:bg-[#09090B] text-zinc-900 dark:text-zinc-100 transition-colors duration-500 overflow-hidden"
        >
          {/* Subtle Ambient Radial Lighting */}
          <div className="absolute w-[500px] h-[500px] rounded-full bg-amber-500/10 blur-[100px] pointer-events-none" />

          {/* Monogram Drawing Animation */}
          <div className="relative w-24 h-24 mb-8">
            <svg viewBox="0 0 512 512" className="w-full h-full">
              {/* Outer border glow */}
              <rect
                x="8"
                y="8"
                width="496"
                height="496"
                rx="120"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-zinc-200 dark:text-zinc-800"
              />
              {/* Active gold drawing border */}
              <motion.rect
                x="8"
                y="8"
                width="496"
                height="496"
                rx="120"
                fill="none"
                stroke="#D97706"
                strokeWidth="12"
                strokeDasharray="2000"
                initial={{ strokeDashoffset: 2000 }}
                animate={{ strokeDashoffset: 2000 - (2000 * progress) / 100 }}
                transition={{ ease: 'easeOut', duration: 0.1 }}
              />

              {/* Centerpoint Monogram Vector */}
              <motion.path
                d="M 140 140 H 372 C 390 140 400 152 400 170 V 200 H 220 V 312 H 372 C 390 312 400 324 400 342 V 372 H 140 Z"
                fill="none"
                stroke="#D97706"
                strokeWidth="20"
                strokeDasharray="1200"
                initial={{ strokeDashoffset: 1200 }}
                animate={{ strokeDashoffset: 1200 - (1200 * progress) / 100 }}
                transition={{ ease: 'easeOut', duration: 0.1 }}
              />

              {/* Geometric Centerpoint Dot */}
              <motion.circle
                cx="390"
                cy="140"
                r="24"
                fill="#D97706"
                initial={{ scale: 0, opacity: 0 }}
                animate={{
                  scale: progress > 60 ? 1 : 0,
                  opacity: progress > 60 ? 1 : 0,
                }}
                transition={{ duration: 0.3 }}
              />
            </svg>
          </div>

          {/* Typography Brand & Progress Counter */}
          <div className="flex flex-col items-center text-center space-y-2 z-10">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-2"
            >
              <span className="font-bold tracking-widest text-lg font-serif">CENTERPOINT</span>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            </motion.div>

            <div className="font-mono text-xs tracking-widest text-zinc-400 dark:text-zinc-500 uppercase flex items-center gap-2">
              <span>PREPARING CURATION</span>
              <span>·</span>
              <span className="text-amber-600 dark:text-amber-400 font-bold min-w-[3ch]">
                {String(progress).padStart(2, '0')}%
              </span>
            </div>

            {/* Subtle DevCenterPoint Creator Credit */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: progress > 50 ? 1 : 0 }}
              transition={{ duration: 0.4 }}
              className="pt-4 text-[10px] tracking-widest uppercase font-semibold text-zinc-400/80 dark:text-zinc-600"
            >
              Engineered by{' '}
              <a
                href="https://devcenterpoint.com"
                target="_blank"
                rel="noreferrer"
                className="hover:text-amber-600 transition"
              >
                DevCenterPoint
              </a>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

