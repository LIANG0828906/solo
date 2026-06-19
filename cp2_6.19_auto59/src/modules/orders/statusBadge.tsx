import React, { memo } from 'react';
import type { OrderStatus } from '@/types';
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/types';

interface StatusBadgeProps {
  status: OrderStatus;
}

export const StatusBadge: React.FC<StatusBadgeProps> = memo(function StatusBadge({ status }) {
  const color = ORDER_STATUS_COLORS[status];
  const label = ORDER_STATUS_LABELS[status];

  return (
    <span
      className="badge"
      style={{
        backgroundColor: `${color}20`,
        color: color,
      }}
    >
      {label}
    </span>
  );
});
