import { X } from 'lucide-react';
import { useEffect } from 'react';
import { cn } from '@/lib/utils';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  side?: 'right' | 'left';
}

export default function Drawer({ open, onClose, title, children, side = 'right' }: DrawerProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  const sideClasses = side === 'right'
    ? 'top-0 right-0 w-[90%] max-w-[480px]'
    : 'top-0 left-0 w-[90%] max-w-[480px]';

  return (
    <>
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 animate-fade-in"
        onClick={onClose}
      />
      <div
        className={cn(
          'fixed h-full z-50 drawer-glass animate-slide-right',
          sideClasses,
        )}
      >
        <div className="flex items-center justify-between p-4 border-b border-amber-100/60">
          {title && <h2 className="text-lg font-semibold text-navy-900">{title}</h2>}
          <button
            onClick={onClose}
            className="ml-auto p-2 rounded-lg hover:bg-amber-100/60 transition-colors text-navy-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 h-[calc(100%-65px)] overflow-y-auto">
          {children}
        </div>
      </div>
    </>
  );
}
