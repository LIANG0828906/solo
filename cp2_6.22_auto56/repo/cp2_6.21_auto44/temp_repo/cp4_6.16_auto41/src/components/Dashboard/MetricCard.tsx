import { useEffect, useRef, useState } from 'react';
import { Leaf, Calendar, Target } from 'lucide-react';
import ProgressRing from '@/components/common/ProgressRing';

export type MetricType = 'today' | 'month' | 'progress';

interface MetricCardProps {
  type: MetricType;
  value: number;
  target?: number;
  label: string;
  suffix?: string;
  unit?: string;
}

const useCountUp = (end: number, duration = 1200, decimals = 2) => {
  const [display, setDisplay] = useState(0);
  const startRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (startRef.current !== null && rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    startRef.current = null;

    const easeOutExpo = (t: number) => {
      return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
    };

    const tick = (now: number) => {
      if (startRef.current === null) {
        startRef.current = now;
      }
      const elapsed = now - startRef.current;
      const progress = Math.min(1, elapsed / duration);
      const eased = easeOutExpo(progress);
      const current = end * eased;

      setDisplay(current);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [end, duration]);

  return display;
};

const gradientMap: Record<MetricType, string> = {
  today: 'gradient-card-green',
  month: 'gradient-card-warm',
  progress: 'gradient-card-orange',
};

const iconMap: Record<MetricType, JSX.Element> = {
  today: <Leaf className="w-6 h-6" />,
  month: <Calendar className="w-6 h-6" />,
  progress: <Target className="w-6 h-6" />,
};

const MetricCard = ({
  type,
  value,
  target,
  label,
  suffix = '',
  unit = '',
}: MetricCardProps) => {
  const animated = useCountUp(value, 1400, 2);
  const gradientClass = gradientMap[type];
  const icon = iconMap[type];

  return (
    <div
      className={`relative overflow-hidden rounded-[12px] p-5 sm:p-6 text-white shadow-card transition-all duration-200 hover:shadow-card-hover hover:-translate-y-[2px] ${gradientClass}`}
    >
      <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/10" />
      <div className="absolute -right-16 -bottom-16 w-48 h-48 rounded-full bg-white/5" />

      <div className="relative flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-3 opacity-95">
            <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm">
              {icon}
            </div>
            <span className="text-sm font-medium">{label}</span>
          </div>

          {type === 'progress' ? (
            <div className="flex items-end justify-between">
              <div>
                <div className="text-xs opacity-80 mb-1">
                  本月排放 / 目标
                </div>
                <div className="text-sm font-medium opacity-90">
                  {value.toFixed(0)}%
                  <span className="mx-2 opacity-60">|</span>
                  {target?.toFixed(1)}
                  {unit}
                </div>
              </div>
              <ProgressRing
                progress={value}
                size={88}
                strokeWidth={8}
                fontSize={20}
                animate
              />
            </div>
          ) : (
            <>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl sm:text-4xl font-bold tracking-tight tabular-nums">
                  {animated.toFixed(suffix ? 0 : 1)}
                </span>
                <span className="text-base font-medium opacity-90">
                  {unit}
                </span>
              </div>
              {suffix && (
                <div className="text-sm opacity-85 mt-0.5">{suffix}</div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MetricCard;
