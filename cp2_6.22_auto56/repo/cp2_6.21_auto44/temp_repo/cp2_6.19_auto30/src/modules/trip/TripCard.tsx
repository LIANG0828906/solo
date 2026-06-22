import React from 'react';
import { Trip } from './types';
import { formatCurrency } from '@/utils/currency';

interface TripCardProps {
  trip: Trip;
  onSelect: (tripId: string) => void;
  totalSpent: number;
}

export const TripCard: React.FC<TripCardProps> = ({ trip, onSelect, totalSpent }) => {
  const percentage = Math.min((totalSpent / trip.budget) * 100, 100);
  const isOverBudget = totalSpent > trip.budget;
  const isWarning = percentage >= 80 && !isOverBudget;

  const progressClass = isOverBudget
    ? 'progress-fill-danger'
    : isWarning
    ? 'progress-fill-warning'
    : 'progress-fill-safe';

  const cardStyle: React.CSSProperties = isOverBudget
    ? {
        borderColor: 'rgba(255, 107, 107, 0.5)',
        animation: 'pulse-orange 2s ease-in-out infinite',
      }
    : {};

  const remaining = trip.budget - totalSpent;
  const days = Math.ceil(
    (new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  return (
    <div
      className="card trip-card"
      style={{ cursor: 'pointer', ...cardStyle }}
      onClick={() => onSelect(trip.id)}
    >
      <div className="flex justify-between items-start mb-md">
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: 4 }}>
            {trip.destination}
          </h3>
          <p className="text-muted" style={{ fontSize: '13px' }}>
            {trip.startDate} ~ {trip.endDate}
          </p>
        </div>
        <span className={`category-tag ${isOverBudget ? 'category-shopping' : isWarning ? 'category-food' : 'category-transport'}`}>
          {days}天
        </span>
      </div>

      <div className="mb-md">
        <div className="flex justify-between items-center mb-sm">
          <span className="text-secondary" style={{ fontSize: '13px' }}>
            已花费
          </span>
          <span style={{ fontWeight: 600, color: isOverBudget ? 'var(--accent-coral)' : 'var(--accent-mint)' }}>
            {formatCurrency(totalSpent, trip.currency)}
          </span>
        </div>
        <div className="progress-bar">
          <div
            className={`progress-fill ${progressClass}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      <div className="flex justify-between items-center">
        <div>
          <p className="text-muted" style={{ fontSize: '12px' }}>总预算</p>
          <p style={{ fontSize: '14px', fontWeight: 500 }}>
            {formatCurrency(trip.budget, trip.currency)}
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p className="text-muted" style={{ fontSize: '12px' }}>剩余</p>
          <p
            style={{
              fontSize: '14px',
              fontWeight: 600,
              color: remaining >= 0 ? 'var(--accent-mint)' : 'var(--accent-coral)',
            }}
          >
            {formatCurrency(Math.max(remaining, 0), trip.currency)}
          </p>
        </div>
      </div>

      {isOverBudget && (
        <div
          style={{
            marginTop: '16px',
            padding: '8px 12px',
            background: 'rgba(255, 107, 107, 0.1)',
            borderRadius: '8px',
            border: '1px solid rgba(255, 107, 107, 0.3)',
            textAlign: 'center',
          }}
        >
          <span style={{ color: 'var(--accent-coral)', fontSize: '13px', fontWeight: 500 }}>
            ⚠️ 已超预算 {formatCurrency(Math.abs(remaining), trip.currency)}
          </span>
        </div>
      )}
    </div>
  );
};
