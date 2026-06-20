import { useState } from 'react';
import { cn } from '@/lib/utils';

export type CoverTemplate = 'fabric' | 'starry' | 'gradient';

interface CoverProps {
  template?: CoverTemplate;
  title?: string;
  date?: string;
  onFlip?: () => void;
  className?: string;
}

const FabricPattern = () => (
  <svg className="absolute inset-0 h-full w-full" aria-hidden>
    <defs>
      <pattern
        id="fabric-pattern"
        x="0"
        y="0"
        width="12"
        height="12"
        patternUnits="userSpaceOnUse"
      >
        <path
          d="M0 6 L12 6 M6 0 L6 12"
          stroke="rgba(255,255,255,0.15)"
          strokeWidth="1"
        />
        <circle cx="0" cy="0" r="1" fill="rgba(255,255,255,0.2)" />
        <circle cx="12" cy="12" r="1" fill="rgba(255,255,255,0.2)" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#fabric-pattern)" />
  </svg>
);

const StarryPattern = () => (
  <>
    <div
      className="absolute inset-0"
      style={{
        background:
          'radial-gradient(ellipse at 30% 20%, #2d1b69 0%, #1a1040 40%, #0a0a1f 100%)',
      }}
    />
    <svg className="absolute inset-0 h-full w-full" aria-hidden>
      {Array.from({ length: 60 }).map((_, i) => {
        const cx = (i * 53) % 100;
        const cy = (i * 37) % 100;
        const r = ((i % 3) + 1) * 0.4;
        const opacity = 0.4 + ((i % 5) * 0.12);
        return (
          <circle
            key={i}
            cx={`${cx}%`}
            cy={`${cy}%`}
            r={r}
            fill="#fff"
            opacity={opacity}
          />
        );
      })}
    </svg>
  </>
);

const GradientPattern = () => (
  <div
    className="absolute inset-0"
    style={{
      background:
        'linear-gradient(135deg, #d4a5a5 0%, #c29595 30%, #a67c7c 70%, #8b6363 100%)',
    }}
  />
);

export default function Cover({
  template = 'fabric',
  title = '我的手账本',
  date,
  onFlip,
  className,
}: CoverProps) {
  const [flipped, setFlipped] = useState(false);

  const displayDate =
    date ?? new Date().toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  const handleClick = () => {
    setFlipped((v) => !v);
    onFlip?.();
  };

  const bgClass =
    template === 'fabric' ? 'bg-[#6b8e6b]' : '';

  return (
    <div
      className={cn(
        'group relative mx-auto h-[480px] w-full max-w-[360px] cursor-pointer [perspective:1500px]',
        className
      )}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      <div
        className="relative h-full w-full [transform-style:preserve-3d] transition-transform duration-[600ms] ease-out"
        style={{
          transform: flipped ? 'rotateY(-180deg)' : 'rotateY(0deg)',
        }}
      >
        <div
          className={cn(
            'absolute inset-0 flex flex-col items-center justify-center overflow-hidden rounded-lg shadow-2xl [backface-visibility:hidden]',
            bgClass
          )}
        >
          {template === 'fabric' && <FabricPattern />}
          {template === 'starry' && <StarryPattern />}
          {template === 'gradient' && <GradientPattern />}

          <div className="relative z-10 flex flex-col items-center justify-center px-8 text-center">
            <div className="mb-6 h-1 w-16 rounded-full bg-white/40" />
            <h2 className="mb-4 text-3xl font-bold text-white drop-shadow-md">
              {title}
            </h2>
            <p className="text-sm text-white/80">{displayDate}</p>
            <div className="mt-6 h-1 w-16 rounded-full bg-white/40" />
          </div>

          <div className="absolute bottom-4 left-0 right-0 text-center text-xs text-white/50">
            点击翻页
          </div>
        </div>

        <div
          className="absolute inset-0 flex items-center justify-center rounded-lg bg-[#fdf8f0] shadow-2xl [backface-visibility:hidden] [transform:rotateY(180deg)]"
        >
          <p className="text-sm text-[#5a7d5a]/60">手账本内页</p>
        </div>
      </div>
    </div>
  );
}
