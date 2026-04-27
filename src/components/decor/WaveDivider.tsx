import React from 'react';

export interface WaveDividerProps {
  variant?: 'light' | 'dark';
  height?: number;
  fade?: boolean; // adds gradient fade
  className?: string;
  animate?: boolean; // apply horizontal wave animation
}

/**
 * Reusable SVG wave divider. Place at the top (negative margin) of a section or bottom as a transition.
 */
export const WaveDivider: React.FC<WaveDividerProps> = ({
  variant = 'light',
  height = 120,
  fade = true,
  animate = false,
  className = ''
}) => {
  const id = React.useId();
  const gradientId = `waveGrad-${id}`;
  const isLight = variant === 'light';
  return (
    <div
      className={[
        'relative w-full pointer-events-none select-none overflow-hidden',
        animate ? 'animate-wave-horizontal' : '',
        className
      ].join(' ')}
      style={{ height }}
      aria-hidden="true"
    >
      <svg
        className="absolute inset-0 w-[200%] h-full"
        viewBox="0 0 1440 160"
        preserveAspectRatio="none"
        role="img"
        aria-label="Decorative wave"
      >
        {fade && (
          <defs>
            <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={isLight ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.18)'} />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </linearGradient>
          </defs>
        )}
        <path
          fill={fade ? `url(#${gradientId})` : isLight ? '#fff' : 'rgba(255,255,255,0.25)'}
          d="M0 80L60 74.7C120 69 240 58 360 69.3C480 80 600 112 720 117.3C840 122 960 101 1080 85.3C1200 69 1320 58 1380 53.3L1440 48V160H1380C1320 160 1200 160 1080 160C960 160 840 160 720 160C600 160 480 160 360 160C240 160 120 160 60 160H0V80Z"
        />
      </svg>
    </div>
  );
};

export default WaveDivider;
