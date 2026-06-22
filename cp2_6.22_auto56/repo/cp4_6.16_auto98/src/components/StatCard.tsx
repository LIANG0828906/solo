import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: number;
  className?: string;
  prefix?: string;
  suffix?: string;
}

export default function StatCard({
  title,
  value,
  className,
  prefix = '',
  suffix = '',
}: StatCardProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const currentValueRef = useRef(0);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const startValue = currentValueRef.current;
    const endValue = value;
    const duration = 1500;
    let startTime: number | null = null;

    const animate = (timestamp: number) => {
      if (startTime === null) {
        startTime = timestamp;
      }

      const progress = Math.min((timestamp - startTime) / duration, 1);
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const newValue = Math.round(startValue + (endValue - startValue) * easeOutQuart);

      currentValueRef.current = newValue;
      setDisplayValue(newValue);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [value]);

  return (
    <div
      className={cn(
        'rounded-2xl bg-gradient-to-r from-blue-50 to-purple-50 p-6 shadow-sm',
        className
      )}
      style={{ borderRadius: '16px' }}
    >
      <p className="text-sm font-medium text-gray-600">{title}</p>
      <p className="mt-2 text-3xl font-bold text-gray-900">
        {prefix}
        {displayValue.toLocaleString()}
        {suffix}
      </p>
    </div>
  );
}
