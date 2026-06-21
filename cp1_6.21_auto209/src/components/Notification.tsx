import React from 'react';
import { useLending } from '../LendingModule/LendingContext';

export default function Notification() {
  const { notification } = useLending();

  if (!notification) return null;

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return (
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#22C55E"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        );
      case 'error':
        return (
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#EF4444"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        );
      default:
        return (
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#6366F1"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
        );
    }
  };

  const getBgColor = () => {
    switch (notification.type) {
      case 'success':
        return 'rgba(34, 197, 94, 0.1)';
      case 'error':
        return 'rgba(239, 68, 68, 0.1)';
      default:
        return 'rgba(99, 102, 241, 0.1)';
    }
  };

  const getBorderColor = () => {
    switch (notification.type) {
      case 'success':
        return '#22C55E';
      case 'error':
        return '#EF4444';
      default:
        return '#6366F1';
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: '80px',
        right: '24px',
        zIndex: 9999,
        animation: 'slideUp 0.3s ease-out',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '14px 20px',
          backgroundColor: '#1E293B',
          borderRadius: '12px',
          border: `1px solid ${getBorderColor()}`,
          borderLeft: `4px solid ${getBorderColor()}`,
          backgroundColor: '#1E293B',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
          minWidth: '280px',
          maxWidth: '420px',
        }}
      >
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: getBgColor(),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {getIcon()}
        </div>
        <p
          style={{
            fontSize: '14px',
            color: '#F8FAFC',
            margin: 0,
            lineHeight: 1.4,
            flex: 1,
          }}
        >
          {notification.message}
        </p>
      </div>
    </div>
  );
}
