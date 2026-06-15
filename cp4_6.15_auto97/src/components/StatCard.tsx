import { useState, useEffect, useRef } from 'react';

interface StatCardProps {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  maxValue?: number;
  gradient?: string;
}

export default function StatCard({ 
  label, 
  value, 
  prefix = '', 
  suffix = '', 
  maxValue = 100,
  gradient = 'linear-gradient(135deg, #C67B3D, #5A7D3C)'
}: StatCardProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const [progress, setProgress] = useState(0);
  const animationRef = useRef<number | null>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (hasAnimated.current) return;
    hasAnimated.current = true;

    const duration = 2000;
    const startTime = performance.now();
    const targetProgress = Math.min((value / maxValue) * 100, 100);

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      
      setDisplayValue(Math.floor(value * easeOutQuart));
      setProgress(targetProgress * easeOutQuart);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(value);
        setProgress(targetProgress);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [value, maxValue]);

  const formatValue = (num: number) => {
    if (num >= 10000) {
      return (num / 10000).toFixed(1) + '万';
    }
    return num.toLocaleString();
  };

  return (
    <div className="stat-card">
      <div className="stat-circle" style={{ '--progress': `${progress}%` } as React.CSSProperties}>
        <div className="stat-circle-inner" style={{ background: gradient, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>
          <i className="fas fa-chart-line"></i>
        </div>
      </div>
      <div className="stat-info">
        <div className="stat-label">{label}</div>
        <div className="stat-value">
          {prefix}{formatValue(displayValue)}{suffix}
        </div>
      </div>
    </div>
  );
}
