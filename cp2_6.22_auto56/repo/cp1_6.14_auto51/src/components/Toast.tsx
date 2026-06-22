import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export type ToastType = 'success' | 'warning' | 'error';

interface ToastProps {
  message: string;
  type?: ToastType;
  onClose?: () => void;
  duration?: number;
}

const typeStyles: Record<ToastType, string> = {
  success: 'bg-green-500',
  warning: 'bg-yellow-500',
  error: 'bg-red-500',
};

const typeIcons: Record<ToastType, string> = {
  success: '✓',
  warning: '!',
  error: '✕',
};

export default function Toast({
  message,
  type = 'success',
  onClose,
  duration = 3000,
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    const enterTimer = setTimeout(() => {
      setIsVisible(true);
    }, 10);

    const leaveTimer = setTimeout(() => {
      setIsLeaving(true);
    }, duration);

    const closeTimer = setTimeout(() => {
      onClose?.();
    }, duration + 300);

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(leaveTimer);
      clearTimeout(closeTimer);
    };
  }, [duration, onClose]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      onClose?.();
    }, 300);
  };

  return (
    <div
      className={cn(
        'fixed left-1/2 top-4 z-50 -translate-x-1/2 transform',
        'transition-all duration-300 ease-out',
        isVisible && !isLeaving
          ? 'translate-y-0 opacity-100'
          : '-translate-y-full opacity-0'
      )}
    >
      <div
        className={cn(
          'flex items-center gap-3 rounded-lg px-5 py-3 text-white shadow-lg',
          typeStyles[type]
        )}
      >
        <div
          className={cn(
            'flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-sm font-bold'
          )}
        >
          {typeIcons[type]}
        </div>
        <span className="text-sm font-medium">{message}</span>
        <button
          onClick={handleClose}
          className="ml-2 text-white/80 transition-colors hover:text-white"
          aria-label="关闭"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
