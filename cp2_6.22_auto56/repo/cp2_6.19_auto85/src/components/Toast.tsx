import React from 'react';
import { Icon } from '@iconify/react';
import type { ToastItem, ToastType } from '../hooks/useToast';

interface ToastProps {
  toasts: ToastItem[];
}

const TOAST_STYLES: Record<
  ToastType,
  { icon: string; iconColor: string; borderColor: string; bg: string }
> = {
  success: {
    icon: 'mdi:check-circle',
    iconColor: '#a6e3a1',
    borderColor: 'rgba(166, 227, 161, 0.3)',
    bg: '#313244',
  },
  info: {
    icon: 'mdi:information',
    iconColor: '#89b4fa',
    borderColor: 'rgba(137, 180, 250, 0.3)',
    bg: '#313244',
  },
  warning: {
    icon: 'mdi:alert-outline',
    iconColor: '#f9e2af',
    borderColor: 'rgba(249, 226, 175, 0.3)',
    bg: '#313244',
  },
  error: {
    icon: 'mdi:close-circle',
    iconColor: '#f38ba8',
    borderColor: 'rgba(243, 139, 168, 0.3)',
    bg: '#313244',
  },
};

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
      {toasts.map((t) => {
        const style = TOAST_STYLES[t.type];
        return (
          <div
            key={t.id}
            className="toast-enter"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 18px',
              backgroundColor: style.bg,
              borderRadius: '10px',
              boxShadow: '0 4px 24px rgba(0, 0, 0, 0.45)',
              border: `1px solid ${style.borderColor}`,
              minWidth: '180px',
            }}
          >
            <Icon icon={style.icon} width={18} height={18} color={style.iconColor} />
            <span
              style={{
                fontSize: '13px',
                color: '#cdd6f4',
                fontWeight: t.type === 'error' || t.type === 'warning' ? 500 : 400,
              }}
            >
              {t.message}
            </span>
          </div>
        );
      })}
    </div>
  );
};
