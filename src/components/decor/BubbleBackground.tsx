import React, { useEffect, useState } from 'react';

export interface BubbleBackgroundProps {
  count?: number;
  /** If true, disables animated bubbles (for prefers-reduced-motion) */
  disableAnimation?: boolean;
  /** Additional tailwind classes */
  className?: string;
  /** Z-index layering control */
  zIndexClass?: string;
  /** Minimum and maximum bubble size in px */
  sizeRange?: [number, number];
}

interface BubbleSeed {
  id: number;
  size: number;
  left: number; // percentage
  delay: number; // seconds
  duration: number; // seconds
  opacity: number;
}

export const BubbleBackground: React.FC<BubbleBackgroundProps> = ({
  count = 14,
  disableAnimation = false,
  className = '',
  zIndexClass = '-z-5',
  sizeRange = [6, 24]
}) => {
  const [bubbles, setBubbles] = useState<BubbleSeed[]>([]);

  useEffect(() => {
    if (disableAnimation) return; // no bubbles if animations off
    const min = sizeRange[0];
    const max = sizeRange[1];
    const seeds: BubbleSeed[] = Array.from({ length: count }, (_, i) => {
      const size = Math.round(min + Math.random() * (max - min));
      const left = Math.random() * 100; // percent
      const delay = Math.random() * 14; // seconds
      const duration = 12 + Math.random() * 16; // 12-28s
      const opacity = 0.12 + Math.random() * 0.25;
      return { id: i, size, left, delay, duration, opacity };
    });
    setBubbles(seeds);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, disableAnimation, sizeRange[0], sizeRange[1]]);

  if (disableAnimation) return null;

  return (
    <div className={`absolute inset-0 overflow-hidden ${zIndexClass} ${className}`} aria-hidden="true">
      {bubbles.map(b => (
        <span
          key={b.id}
          className="absolute bottom-[-140px] rounded-full bg-white/30 backdrop-blur-sm animate-bubble-rise will-change-transform"
          style={{
            left: `${b.left}%`,
            width: b.size,
            height: b.size,
            animationDelay: `${b.delay}s`,
            animationDuration: `${b.duration}s`,
            opacity: b.opacity
          }}
        />
      ))}
    </div>
  );
};

export default BubbleBackground;
