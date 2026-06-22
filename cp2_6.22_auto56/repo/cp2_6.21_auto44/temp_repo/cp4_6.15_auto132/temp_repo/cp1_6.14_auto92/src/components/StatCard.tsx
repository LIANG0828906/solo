import { useState, useEffect, useRef } from 'react';

interface StatCardProps {
  title: string;
  value: number;
  gradientType: 'pending' | 'paid' | 'overdue' | 'customer';
  prefix?: string;
  suffix?: string;
}

export default function StatCard({ title, value, gradientType, prefix = '', suffix = '' }: StatCardProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const [animationKey, setAnimationKey] = useState(0);
  const valueRef = useRef(value);

  useEffect(() => {
    if (valueRef.current !== value) {
      valueRef.current = value;
      setAnimationKey((prev) => prev + 1);
    }

    const duration = 1500;
    const steps = duration / 100;
    const increment = value / steps;
    let current = 0;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      current = Math.min(Math.round(increment * step), value);
      setDisplayValue(current);

      if (step >= steps) {
        clearInterval(timer);
        setDisplayValue(value);
      }
    }, 100);

    return () => clearInterval(timer);
  }, [value]);

  const gradientClass = `stat-${gradientType}`;
  const isOverdue = gradientType === 'overdue';

  const formatValue = (val: number) => {
    if (val >= 10000) {
      return (val / 10000).toFixed(1) + '万';
    }
    return val.toLocaleString();
  };

  return (
    <div className={`card p-6 text-white ${gradientClass} ${isOverdue ? 'overdue-card' : ''}`}>
      <h3 className="text-white/80 text-sm font-medium mb-2">{title}</h3>
      <p key={animationKey} className="number-roll text-3xl font-bold">
        {prefix}
        {formatValue(displayValue)}
        {suffix}
      </p>
    </div>
  );
}
