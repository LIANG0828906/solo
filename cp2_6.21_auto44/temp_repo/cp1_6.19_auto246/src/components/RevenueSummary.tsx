import React, { useMemo } from 'react';
import { useTourStore } from '../store/tourStore';

const RevenueSummary: React.FC<{ tourEventId: string }> = ({ tourEventId }) => {
  const { tourEvents, getEquipmentForTour } = useTourStore();

  const tour = tourEvents.find(t => t.id === tourEventId);
  const orders = getEquipmentForTour(tourEventId);

  const { grossIncome, totalExpense, netIncome, ratio } = useMemo(() => {
    if (!tour) return { grossIncome: 0, totalExpense: 0, netIncome: 0, ratio: 0 };
    const gross = tour.expectedTickets * tour.ticketPrice;
    const expense = orders.reduce((sum, o) => sum + o.days * o.unitPrice, 0);
    const net = gross - expense;
    const r = gross > 0 ? Math.max(0, Math.min(1, net / gross)) : 0;
    return { grossIncome: gross, totalExpense: expense, netIncome: net, ratio: r };
  }, [tour, orders]);

  if (!tour) return null;

  const fillColor = ratio >= 0.7
    ? '#27AE60'
    : ratio >= 0.4
      ? `rgb(${Math.round(39 + (231 - 39) * (0.7 - ratio) / 0.3)}, ${Math.round(174 - 174 * (0.7 - ratio) / 0.3)}, ${Math.round(96 - 96 * (0.7 - ratio) / 0.3)})`
      : '#E74C3C';

  return (
    <div className="revenue-summary">
      <div className="net-income">¥{netIncome.toLocaleString()}</div>
      <div className="progress-bar-container">
        <div
          className="progress-bar-fill"
          style={{
            width: `${ratio * 100}%`,
            background: fillColor,
          }}
        />
      </div>
      <div className="revenue-breakdown">
        <span>售票收入: ¥{grossIncome.toLocaleString()}</span>
        <span>设备支出: ¥{totalExpense.toLocaleString()}</span>
      </div>
    </div>
  );
};

export default RevenueSummary;
