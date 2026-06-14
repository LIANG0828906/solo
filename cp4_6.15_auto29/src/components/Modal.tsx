import { useEffect, ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md bg-morandi-white rounded-card shadow-card animate-scale-in">
        {title && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-morandi-gray">
            <h3 className="text-lg font-medium text-gray-700">{title}</h3>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center text-morandi-brown hover:text-morandi-red transition-colors duration-300 rounded-full hover:bg-morandi-gray"
              aria-label="关闭"
            >
              <X size={18} />
            </button>
          </div>
        )}
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
