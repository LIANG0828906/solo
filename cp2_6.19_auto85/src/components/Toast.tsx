import React from 'react';
import { Icon } from '@iconify/react';
import type { ToastItem } from '../hooks/useToast';

interface ToastProps {
  toasts: ToastItem[];
}

export const Toast: React.FC<ToastProps> = ({ toasts }) => {
  return (
    <div
      style={{
        position: 'fixed',
        top: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        pointerEvents: 'none',
      }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className="toast-enter"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            backgroundColor: '#313244',
            borderRadius: '8px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
            border: '1px solid #45475a',
          }}
        >
          <Icon icon="mdi:check-circle" width={16} height={16} color="#a6e3a1" />
          <span style={{ fontSize: '13px', color: '#cdd6f4' }}>{t.message}</span>
        </div>
      ))}
    </div>
  );
};
