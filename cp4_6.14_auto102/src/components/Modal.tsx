import React, { useEffect } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  width?: number;
  children: React.ReactNode;
}

export default function Modal({ open, onClose, width = 400, children }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-box" style={{ width }}>
        {children}
      </div>
    </div>
  );
}
