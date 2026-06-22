import React, { useEffect, useRef } from 'react';
import { Icon } from '@iconify/react';

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  open,
  title,
  message,
  confirmText = '确认',
  cancelText = '取消',
  confirmColor = '#f38ba8',
  onConfirm,
  onCancel,
}) => {
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => confirmBtnRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
      if (e.key === 'Enter') onConfirm();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onConfirm, onCancel]);

  if (!open) return null;

  return (
    <div
      onClick={onCancel}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(4px)',
        zIndex: 9998,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="toast-enter"
        style={{
          width: '380px',
          maxWidth: 'calc(100vw - 48px)',
          backgroundColor: '#1e1e2e',
          borderRadius: '14px',
          border: '1px solid #45475a',
          boxShadow: '0 16px 48px rgba(0, 0, 0, 0.5)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '20px 20px 16px',
            display: 'flex',
            gap: '14px',
            alignItems: 'flex-start',
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: 'rgba(243, 139, 168, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Icon
              icon="mdi:alert-triangle-outline"
              width={22}
              height={22}
              color={confirmColor}
            />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3
              style={{
                fontSize: '16px',
                fontWeight: 600,
                color: '#cdd6f4',
                marginBottom: '6px',
              }}
            >
              {title}
            </h3>
            <p
              style={{
                fontSize: '13px',
                color: '#a6adc8',
                lineHeight: 1.6,
              }}
            >
              {message}
            </p>
          </div>
        </div>

        <div
          style={{
            padding: '14px 20px 20px',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px',
            backgroundColor: 'rgba(49, 50, 68, 0.4)',
          }}
        >
          <button
            onClick={onCancel}
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              borderRadius: '8px',
              border: '1px solid #45475a',
              backgroundColor: '#313244',
              color: '#cdd6f4',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#45475a';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#313244';
            }}
          >
            {cancelText}
          </button>
          <button
            ref={confirmBtnRef}
            onClick={onConfirm}
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: 500,
              borderRadius: '8px',
              border: 'none',
              backgroundColor: confirmColor,
              color: '#1e1e2e',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              boxShadow: `0 2px 8px ${confirmColor}33`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.filter = 'brightness(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.filter = 'brightness(1)';
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
