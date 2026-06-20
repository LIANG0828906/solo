import { useEffect, useState, useRef } from 'react';
import { Stats } from '@/api';

interface StatsCardsProps {
  stats: Stats;
  activeFilter: 'all' | 'healthy' | 'warning' | 'expired' | 'today';
  onFilterChange: (
    filter: 'all' | 'healthy' | 'warning' | 'expired' | 'today'
  ) => void;
}

const AnimatedNumber = ({
  value,
  duration = 1000,
}: {
  value: number;
  duration?: number;
}) => {
  const [display, setDisplay] = useState(0);
  const startTime = useRef<number | null>(null);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    startTime.current = null;
    const animate = (timestamp: number) => {
      if (!startTime.current) startTime.current = timestamp;
      const progress = Math.min((timestamp - startTime.current) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.floor(eased * value));
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [value, duration]);

  return <span>{display}</span>;
};

const ProgressRing = ({
  value,
  max,
  color,
}: {
  value: number;
  max: number;
  color: string;
}) => {
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const percent = max === 0 ? 0 : Math.min(value / max, 1);
  const offset = circumference - percent * circumference;

  return (
    <div className="progress-ring">
      <svg width="56" height="56">
        <circle
          cx="28"
          cy="28"
          r={radius}
          fill="none"
          stroke="#F3F4F6"
          strokeWidth="5"
        />
        <circle
          cx="28"
          cy="28"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
    </div>
  );
};

const StatsCards = ({ stats, activeFilter, onFilterChange }: StatsCardsProps) => {
  const cardData = [
    {
      key: 'all' as const,
      label: '总数',
      value: stats.total,
      icon: '📦',
      color: '#FF8C00',
      max: Math.max(stats.total, 1),
    },
    {
      key: 'warning' as const,
      label: '即将过期',
      value: stats.expiringSoon,
      icon: '⚠️',
      color: '#F59E0B',
      max: Math.max(stats.total, 1),
    },
    {
      key: 'expired' as const,
      label: '已过期',
      value: stats.expired,
      icon: '❗',
      color: '#EF4444',
      max: Math.max(stats.total, 1),
    },
    {
      key: 'today' as const,
      label: '今日新加',
      value: stats.todayAdded,
      icon: '✨',
      color: '#10B981',
      max: Math.max(stats.total, 1),
    },
  ];

  return (
    <div className="stats-section">
      <div className="stats-grid">
        {cardData.map((card) => (
          <div
            key={card.key}
            className={`stat-card ${activeFilter === card.key ? 'active' : ''}`}
            onClick={() => onFilterChange(card.key)}
          >
            <ProgressRing value={card.value} max={card.max} color={card.color} />
            <div className="stat-info">
              <div className="stat-number">
                <AnimatedNumber value={card.value} />
              </div>
              <div className="stat-label">
                {card.icon} {card.label}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StatsCards;
