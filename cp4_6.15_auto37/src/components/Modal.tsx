import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className="relative glass-card w-full max-w-lg max-h-[90vh] overflow-y-auto scrollbar-thin
                   animate-fade-in-up"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-amber-500/20 bg-white/70 backdrop-blur-md">
          <h3 className="text-lg font-display font-semibold text-amber-900">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-amber-500/20 transition-colors"
            aria-label="关闭"
          >
            <X size={20} className="text-amber-800" />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
