import { useState, useEffect } from 'react';

interface StatsCardProps {
  label: string;
  value: number;
  duration?: number;
}

export function StatsCard({ label, value, duration = 500 }: StatsCardProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.floor(easeProgress * value));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, [value, duration]);

  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{displayValue.toLocaleString()}</div>
    </div>
  );
}
