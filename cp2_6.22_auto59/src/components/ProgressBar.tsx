import { cn } from '@/lib/utils';

interface ProgressBarProps {
  current: number;
  goal: number;
  label: string;
  unit?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const GREEN = { r: 76, g: 175, b: 80 };
const ORANGE = { r: 255, g: 152, b: 0 };
const RED = { r: 229, g: 57, b: 53 };

function lerpColor(
  c1: { r: number; g: number; b: number },
  c2: { r: number; g: number; b: number },
  t: number,
) {
  const r = Math.round(c1.r + (c2.r - c1.r) * t);
  const g = Math.round(c1.g + (c2.g - c1.g) * t);
  const b = Math.round(c1.b + (c2.b - c1.b) * t);
  return `rgb(${r}, ${g}, ${b})`;
}

export default function ProgressBar({
  current,
  goal,
  label,
  unit = '',
  showLabel = true,
  size = 'md',
}: ProgressBarProps) {
  const rawPercent = goal > 0 ? (current / goal) * 100 : 0;
  const displayPercent = Math.max(0, Math.min(rawPercent, 999));
  const visualWidth = Math.min(rawPercent, 100);

  let fillStyle: React.CSSProperties = {};
  let fillTailwind = '';
  let trackGlowClass = '';
  let trackGlowStyle: React.CSSProperties = {};
  let isOverLimit = false;
  let pulseKey = '';

  if (displayPercent >= 100) {
    isOverLimit = true;
    pulseKey = 'fast-red';
    fillStyle = { backgroundColor: `rgb(${RED.r}, ${RED.g}, ${RED.b})` };
    trackGlowStyle = {
      boxShadow: '0 0 12px rgba(229, 57, 53, 0.45), inset 0 0 6px rgba(229, 57, 53, 0.15)',
    };
  } else if (displayPercent >= 90) {
    fillStyle = { backgroundColor: `rgb(${ORANGE.r}, ${ORANGE.g}, ${ORANGE.b})` };
  } else if (displayPercent >= 80) {
    const t = (displayPercent - 80) / 10;
    fillStyle = { backgroundColor: lerpColor(GREEN, ORANGE, t) };
  } else {
    fillStyle = { backgroundColor: `rgb(${GREEN.r}, ${GREEN.g}, ${GREEN.b})` };
  }

  const heightStyle =
    size === 'sm' ? '6px' : size === 'lg' ? '12px' : '10px';

  return (
    <div className="w-full group">
      <style>{`
        @keyframes pulseFlashFastRed {
          0%, 100% { opacity: 1; filter: brightness(1); }
          45% { opacity: 0.45; filter: brightness(1.2); }
          55% { opacity: 0.55; filter: brightness(1.1); }
        }
        @keyframes haloPulseFast {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.55; }
        }
      `}</style>

      {showLabel && (
        <div className="flex items-baseline justify-between mb-2 select-none">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-sm font-semibold text-gray-800">{label}</span>
            <span className="text-sm text-gray-600 tabular-nums">
              <span className="font-bold text-gray-900">
                {Math.round(current).toLocaleString()}
              </span>
              <span className="text-gray-400 mx-0.5">/</span>
              <span>{Math.round(goal).toLocaleString()}</span>
              {unit && (
                <span className="text-gray-400 text-xs ml-1">{unit}</span>
              )}
            </span>
          </div>
          <span
            className={cn(
              'text-xs font-bold tabular-nums tracking-tight',
              isOverLimit
                ? 'text-red-600'
                : displayPercent >= 80
                  ? 'text-amber-600'
                  : 'text-primary-700',
            )}
          >
            {displayPercent.toFixed(1)}%
          </span>
        </div>
      )}

      <div
        className={cn(
          'w-full rounded-full bg-gray-100 overflow-hidden relative transition-all duration-200',
          'group-hover:bg-gray-200/70',
          trackGlowClass,
        )}
        style={{
          height: heightStyle,
          ...trackGlowStyle,
          animation: isOverLimit ? 'haloPulseFast 0.6s ease-in-out infinite' : undefined,
        }}
      >
        <div
          className={cn(
            'h-full rounded-full relative',
            fillTailwind,
          )}
          style={{
            width: `${visualWidth}%`,
            transition: 'width 0.4s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.35s ease-out',
            animation: isOverLimit
              ? 'pulseFlashFastRed 0.6s ease-in-out infinite'
              : undefined,
            ...fillStyle,
          }}
        >
          <div
            className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-40 transition-opacity duration-200"
            style={{
              background:
                'linear-gradient(180deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0) 60%)',
            }}
          />
        </div>

        {isOverLimit && (
          <div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse at center, rgba(229, 57, 53, 0.0) 40%, rgba(229, 57, 53, 0.25) 100%)',
              animation: 'haloPulseFast 0.6s ease-in-out infinite',
            }}
          />
        )}
      </div>
    </div>
  );
}
