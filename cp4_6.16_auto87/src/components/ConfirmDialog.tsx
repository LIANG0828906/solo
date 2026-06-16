import { useState } from 'react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({ open, title, message, onConfirm, onCancel }: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 glass-overlay z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="card-base max-w-sm w-full space-y-4">
        <h3 className="font-display font-semibold text-lg text-slate-800">{title}</h3>
        <p className="text-sm text-slate-500">{message}</p>
        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onCancel}
            className="btn-press px-4 py-2 rounded-lg bg-slate-100 text-slate-600 text-sm font-medium"
          >
            取消
          </button>
          <button
            onClick={onConfirm}
            className="btn-press px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-medium"
          >
            确认
          </button>
        </div>
      </div>
    </div>
  );
}

export function useConfirmDialog() {
  const [state, setState] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ open: false, title: '', message: '', onConfirm: () => {} });

  const confirm = (title: string, message: string): Promise<void> => {
    return new Promise((resolve) => {
      setState({
        open: true,
        title,
        message,
        onConfirm: () => {
          setState((s) => ({ ...s, open: false }));
          resolve();
        },
      });
    });
  };

  const cancel = () => setState((s) => ({ ...s, open: false }));

  return { dialogState: state, confirm, cancel };
}
