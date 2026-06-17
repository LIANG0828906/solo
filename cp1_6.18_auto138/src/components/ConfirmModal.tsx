import React from 'react';

interface ConfirmModalProps {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ title, message, onConfirm, onCancel }) => {
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  return (
    <div
      onClick={handleOverlayClick}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        zIndex: 10000,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: 12,
          padding: 24,
          minWidth: 300,
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
        }}
      >
        <h3
          style={{
            fontSize: 18,
            fontWeight: 700,
            marginBottom: 12,
            marginTop: 0,
            color: '#1A1A1A',
          }}
        >
          {title}
        </h3>
        <p
          style={{
            fontSize: 14,
            color: '#636E72',
            marginBottom: 24,
            marginTop: 0,
            lineHeight: 1.6,
          }}
        >
          {message}
        </p>
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 12,
          }}
        >
          <button
            onClick={onCancel}
            style={{
              width: 80,
              height: 36,
              borderRadius: 8,
              border: 'none',
              background: '#F0F0F0',
              color: '#333333',
              fontSize: 14,
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = '#E0E0E0';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = '#F0F0F0';
            }}
          >
            取消
          </button>
          <button
            onClick={onConfirm}
            style={{
              width: 80,
              height: 36,
              borderRadius: 8,
              border: 'none',
              background: '#E74C3C',
              color: '#FFFFFF',
              fontSize: 14,
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = '#C0392B';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = '#E74C3C';
            }}
          >
            确认
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
