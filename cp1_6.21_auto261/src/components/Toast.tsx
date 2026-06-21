import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface ToastProps {
  message: string;
  visible: boolean;
  duration?: number;
}

export default function Toast({ message, visible, duration = 2500 }: ToastProps) {
  const [isShowing, setIsShowing] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    if (visible) {
      setIsMounted(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsShowing(true);
        });
      });

      const timer = setTimeout(() => {
        setIsShowing(false);
        setTimeout(() => setIsMounted(false), 300);
      }, duration);

      return () => clearTimeout(timer);
    } else {
      setIsShowing(false);
      const timer = setTimeout(() => setIsMounted(false), 300);
      return () => clearTimeout(timer);
    }
  }, [visible, duration]);

  if (!isMounted) return null;

  return (
    <div
      className={cn(
        'fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 rounded-md text-white text-sm font-medium z-50 transition-opacity duration-300',
        isShowing ? 'opacity-100' : 'opacity-0'
      )}
      style={{ backgroundColor: 'var(--error-color, #DC2626)' }}
    >
      {message}
    </div>
  );
}
