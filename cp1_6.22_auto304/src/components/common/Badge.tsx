import React from 'react';
import type { InvoiceStatus } from '@/types';

interface BadgeProps {
  status: InvoiceStatus;
  label: string;
  color: string;
}

export const Badge: React.FC<BadgeProps> = React.memo(({ status, label, color }) => {
  return (
    <span
      data-status={status}
      style={{
        display: 'inline-block',
        padding: '4px 12px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: 500,
        backgroundColor: `${color}20`,
        color: color,
        border: `1px solid ${color}40`,
      }}
    >
      {label}
    </span>
  );
});

Badge.displayName = 'Badge';
