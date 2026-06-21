import { useEffect } from 'react';
import { X, Heart, Users } from 'lucide-react';
import { useToastStore, ToastItem } from '@/stores/toastStore';

function Toast({ toast, onRemove }: { toast: ToastItem; onRemove: (id: string) => void }) {
  useEffect(() => {
    const duration = toast.duration ?? 3000;
    if (duration > 0) {
      const timer = setTimeout(() => {
        onRemove(toast.id);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [toast.id, toast.duration, onRemove]);

  const bgColor = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
    invite: 'bg-gradient-to-r from-[#1a73e8] to-[#34a853]',
  }[toast.type];

  const Icon = toast.type === 'invite' ? Users : Heart;

  const handleClick = () => {
    if (toast.onClick) {
      toast.onClick();
      onRemove(toast.id);
    }
  };

  return (
    <div
      className={`${bgColor} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 min-w-[280px] max-w-[380px] animate-slide-in-right cursor-pointer`}
      onClick={handleClick}
      style={{
        animation: 'slideInRight 0.3s ease-out',
      }}
    >
      <div className="flex-shrink-0">
        <Icon size={20} />
      </div>
      <div className="flex-1 text-sm font-medium">
        {toast.message}
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove(toast.id);
        }}
        className="flex-shrink-0 p-1 hover:bg-white/20 rounded transition-colors"
      >
        <X size={16} />
      </button>
    </div>
  );
}

export default function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  );
}
