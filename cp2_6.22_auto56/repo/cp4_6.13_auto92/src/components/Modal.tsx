import React, { ReactNode } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
}

const Modal: React.FC<ModalProps> = ({ open, onClose, children, title }) => {
  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: '12px',
          padding: '28px',
          minWidth: '400px',
          maxWidth: '90vw',
          maxHeight: '90vh',
          overflow: 'auto',
          animation: 'fadeInScale 0.2s ease-out',
        }}
      >
        {title && (
          <h3 style={{
            fontSize: '20px',
            fontWeight: '600',
            color: '#E67E22',
            marginBottom: '20px',
            borderBottom: '2px solid #E8DCC8',
            paddingBottom: '12px',
          }}>
            {title}
          </h3>
        )}
        {children}
      </div>
    </div>
  );
};

export default Modal;
