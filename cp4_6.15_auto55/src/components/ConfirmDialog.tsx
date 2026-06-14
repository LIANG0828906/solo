import React from 'react';
import { Check, X } from 'lucide-react';

interface ConfirmDialogProps {
  show: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = React.memo(({
  show,
  message,
  onConfirm,
  onCancel,
}) => {
  if (!show) return null;

  return (
    <div style={overlayStyle}>
      <div className="shimmer-border" style={modalStyle}>
        <p style={messageStyle}>{message}</p>
        <div style={buttonContainerStyle}>
          <button className="btn-hover" onClick={onConfirm} style={confirmBtnStyle}>
            <Check size={16} />
            确认
          </button>
          <button className="btn-hover" onClick={onCancel} style={cancelBtnStyle}>
            <X size={16} />
            取消
          </button>
        </div>
      </div>
    </div>
  );
});

ConfirmDialog.displayName = 'ConfirmDialog';

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0, 0, 0, 0.45)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  animation: 'fadeIn 0.25s ease',
};

const modalStyle: React.CSSProperties = {
  background: '#fff',
  borderRadius: 12,
  padding: '28px 32px',
  minWidth: 320,
  maxWidth: 420,
  animation: 'fadeIn 0.3s ease',
};

const messageStyle: React.CSSProperties = {
  fontSize: 16,
  lineHeight: 1.6,
  color: '#333',
  marginBottom: 24,
  textAlign: 'center',
};

const buttonContainerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  gap: 16,
};

const confirmBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '8px 24px',
  border: 'none',
  borderRadius: 8,
  background: '#2C5F3B',
  color: '#fff',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
};

const cancelBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '8px 24px',
  border: 'none',
  borderRadius: 8,
  background: '#e8e8e8',
  color: '#555',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
};

export default ConfirmDialog;
