import React from 'react';
import { X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = '确认',
  cancelText = '取消',
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div className="relative bg-bg-secondary rounded-2xl shadow-2xl w-full max-w-md p-6 animate-scale-in">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-1 text-text-secondary hover:text-text-primary transition-colors"
        >
          <X size={20} />
        </button>

        <h3 className="text-xl font-bold text-text-primary mb-3">{title}</h3>
        <p className="text-text-secondary mb-6">{message}</p>

        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="btn-secondary">
            {cancelText}
          </button>
          <button onClick={onConfirm} className="btn-danger">
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
