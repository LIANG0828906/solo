import React, { useState, useEffect } from 'react';

interface StatCardProps {
  label: string;
  value: number;
  colorClass: 'primary' | 'accent' | 'success';
  duration?: number;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, colorClass, duration = 1500 }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setDisplayValue(Math.floor(easeOutQuart * value));

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
      <p className="stat-label">{label}</p>
      <p className={`stat-value ${colorClass}`}>{displayValue}</p>
    </div>
  );