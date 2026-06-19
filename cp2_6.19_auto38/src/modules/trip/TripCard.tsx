import React, { useMemo } from 'react';
import type { Trip } from './types';
import { CURRENCY_SYMBOLS } from './types';
import { useTripStore } from './store';
import { formatCurrency } from '@/utils/currency';

interface TripCardProps {
  trip: Trip;
  onSelect: (tripId: string) => void;
  isActive: boolean;
}

export const TripCard: React.FC<TripCardProps> = ({ trip, onSelect, isActive }) => {
  const totalExpenses = useTripStore((state) => state.getTripExpenses(trip.id));
  const getTripBudgetPercentage = useTripStore((state) => state.getTripBudgetPercentage);
  const budgetPercentage = getTripBudgetPercentage(trip.id, trip.budget);

  const progressClass = useMemo(() => {
    if (budgetPercentage >= 100) return 'danger';
    if (budgetPercentage >= 80) return 'warning';
    return 'success';
  }, [budgetPercentage]);

  const cardClass = useMemo(() => {
    let classes = 'card animate-fade-in-up';
    if (budgetPercentage >= 100) classes += ' card-warning-blink';
    if (isActive) classes += ' active';
    return classes;
  }, [budgetPercentage, isActive]);

  const remaining = trip.budget - totalExpenses;
  const symbol = CURRENCY_SYMBOLS[trip.currency];

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  return (
    <div
      className={cardClass}
      onClick={() => onSelect(trip.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onSelect(trip.id)}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold mb-1">{trip.destination}</h3>
          <p className="text-sm text-muted">
            {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm text-muted">总预算</div>
          <div className="text-lg font-semibold text-cyan">
            {symbol}{trip.budget.toLocaleString()}
          </div>
        </div>
      </div>

      <div className="mb-3">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-secondary">已花费</span>
          <span className={budgetPercentage >= 80 ? 'text-orange' : 'text-cyan'}>
            {budgetPercentage}%
          </span>
        </div>
        <div className="progress-bar">
          <div
            className={`progress-fill ${progressClass}`}
            style={{ width: `${Math.min(100, budgetPercentage)}%` }}
          />
        </div>
      </div>

      <div className="flex justify-between items-center">
        <div>
          <div className="text-sm text-muted">已花费</div>
          <div className="font-medium">
            {formatCurrency(totalExpenses, trip.currency)}
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-muted">剩余</div>
          <div className={`font-medium ${remaining < 0 ? 'text-orange' : ''}`}>
            {symbol}{remaining.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
        </div>
      </div>

      {budgetPercentage >= 80 && (
        <div
          className={`mt-4 p-3 rounded-lg text-sm animate-bounce-in ${
            budgetPercentage >= 100
              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
              : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
          }`}
        >
          {budgetPercentage >= 100 ? '🚨 已超出预算！' : '⚠️ 预算使用超过80%'}
        </div>
      )}
    </div>
  );
};

export default TripCard;
