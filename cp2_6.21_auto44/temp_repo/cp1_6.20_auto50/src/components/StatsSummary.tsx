import React from 'react';
import { Medicine } from '../types';
import { getStats } from '../utils/medicineUtils';

interface StatsSummaryProps {
  medicines: Medicine[];
  currentFilter: string;
  onFilterChange: (filter: 'all' | 'expiringSoon' | 'lowStock' | 'expired') => void;
}

const StatsSummary: React.FC<StatsSummaryProps> = ({
  medicines,
  currentFilter,
  onFilterChange,
}) => {
  const stats = getStats(medicines);

  const StatItem = ({
    label,
    value,
    color,
    filter,
  }: {
    label: string;
    value: number;
    color: string;
    filter: 'all' | 'expiringSoon' | 'lowStock' | 'expired';
  }) => (
    <div
      className={`stat-item ${currentFilter === filter ? 'active' : ''}`}
      onClick={() => onFilterChange(filter)}
    >
      <span className="stat-label">{label}</span>
      <span className={`stat-value ${color}`}>{value}</span>
    </div>
  );

  return (
    <div className="stats-summary">
      <StatItem label="药品总数" value={stats.total} color="total" filter="all" />
      <StatItem label="即将过期" value={stats.expiringSoon + stats.expired} color="warning" filter="expiringSoon" />
      <StatItem label="库存不足" value={stats.lowStock} color="low" filter="lowStock" />
    </div>
  );
};

export default StatsSummary;
