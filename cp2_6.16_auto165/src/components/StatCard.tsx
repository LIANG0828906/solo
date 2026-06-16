import { TrendingUp, TrendingDown } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { useAnimatedNumber } from '@/hooks/useAnimatedNumber';

interface StatCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  variant?: 'default' | 'amber-ring' | 'purple-gradient' | 'counter' | 'rank';
}

function RingProgress({ percent }: { percent: number }) {
  const size = 80;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (Math.min(percent, 100) / 100) * circumference;

  return (
    <svg width={size} height={size} className="shrink-0">
      <defs>
        <linearGradient id="amberGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF8F00" />
          <stop offset="100%" stopColor="#FFC107" />
        </linearGradient>
      </defs>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#E0E0E0"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="url(#amberGradient)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        className="transition-all duration-700 ease-out"
      />
    </svg>
  );
}

export default function StatCard({ title, value, subtitle, variant = 'default' }: StatCardProps) {
  const prevValue = useRef(value);
  const [scale, setScale] = useState(false);

  const numericValue = typeof value === 'string' ? parseFloat(value) || 0 : value;
  const animated = useAnimatedNumber(numericValue, 800);

  useEffect(() => {
    if (variant === 'counter' && prevValue.current !== value) {
      prevValue.current = value;
      setScale(true);
      const timer = setTimeout(() => setScale(false), 500);
      return () => clearTimeout(timer);
    }
  }, [value, variant]);

  if (variant === 'purple-gradient') {
    return (
      <div
        className="rounded-card shadow-card p-6 text-white"
        style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}
      >
        <p className="text-sm opacity-90 mb-2">{title}</p>
        <p className="text-3xl font-bold mb-1">{value}</p>
        {subtitle && <p className="text-xs opacity-80">{subtitle}</p>}
      </div>
    );
  }

  if (variant === 'amber-ring') {
    const percent = numericValue;
    return (
      <div className="bg-white rounded-card shadow-card p-6 flex items-center gap-4">
        <RingProgress percent={percent} />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <p className="text-2xl font-bold text-navy-900">
            {typeof value === 'number' ? value.toFixed(0) : value}
          </p>
          {subtitle && <p className="text-xs text-gray-400 mt-1 truncate">{subtitle}</p>}
        </div>
      </div>
    );
  }

  if (variant === 'counter') {
    return (
      <div className="bg-white rounded-card shadow-card p-6">
        <p className="text-sm text-gray-500 mb-2">{title}</p>
        <p
          className={cn(
            'text-3xl font-bold text-navy-900',
            scale && 'animate-scale-up-down inline-block',
          )}
        >
          {typeof value === 'number' ? Math.round(animated) : value}
        </p>
        {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
      </div>
    );
  }

  if (variant === 'rank') {
    const num = numericValue;
    const isPositive = num >= 0;
    return (
      <div className="bg-white rounded-card shadow-card p-6">
        <div className="flex items-start justify-between mb-2">
          <p className="text-sm text-gray-500">{title}</p>
          {isPositive ? (
            <TrendingUp className="w-5 h-5 text-green-600" />
          ) : (
            <TrendingDown className="w-5 h-5 text-red-500" />
          )}
        </div>
        <p
          className={cn(
            'text-3xl font-bold',
            isPositive ? 'text-green-600' : 'text-red-500',
          )}
        >
          {typeof value === 'number' ? `${Math.abs(value)}%` : value}
        </p>
        {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-card shadow-card p-6">
      <p className="text-sm text-gray-500 mb-2">{title}</p>
      <p className="text-3xl font-bold text-navy-900">{value}</p>
      {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
    </div>
  );
}
