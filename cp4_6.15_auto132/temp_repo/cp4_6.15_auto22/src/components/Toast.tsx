import React from 'react';
import { useCoffeeStore } from '@/store';
import type { ToastMessage } from '@/types';

export default function Toast() {
  const toasts = useCoffeeStore((s) => s.toasts);
  const removeToast = useCoffeeStore((s) => s.removeToast);

  if (toasts.length === 0) return null;

  const iconByType: Record<ToastMessage['type'], string> = {
    success: '✓',
    warning: '⚠',
    error: '✕',
  };

  const bgByType: Record<ToastMessage['type'], string> = {
    success: 'bg-green-600',
    warning: 'bg-amber-500',
    error: 'bg-red-600',
  };

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            ${bgByType[toast.type]} text-white px-4 py-3 rounded-lg shadow-lg
            animate-slide_in_right flex items-center gap-2 min-w-[240px]
          `}
        >
          <span className="text-lg font-bold">{iconByType[toast.type]}</span>
          <span className="text-sm font-medium">{toast.message}</span>
          <button
            onClick={() => removeToast(toast.id)}
            className="ml-auto text-white/70 hover:text-white transition-colors"
            aria-label="关闭"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
