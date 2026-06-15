import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';
import type { ToastMessage } from '@/types';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/lib/utils';

const typeConfig = {
  success: {
    icon: CheckCircle,
    bgColor: 'bg-green-50',
    borderColor: 'border-green-400',
    iconColor: 'text-green-500',
    textColor: 'text-green-800',
  },
  error: {
    icon: XCircle,
    bgColor: 'bg-red-50',
    borderColor: 'border-red-400',
    iconColor: 'text-red-500',
    textColor: 'text-red-800',
  },
  info: {
    icon: Info,
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-400',
    iconColor: 'text-blue-500',
    textColor: 'text-blue-800',
  },
};

interface ToastItemProps {
  message: ToastMessage;
  onClose: (id: string) => void;
}

function ToastItem({ message, onClose }: ToastItemProps) {
  const config = typeConfig[message.type];
  const Icon = config.icon;
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => {
        onClose(message.id);
      }, 300);
    }, 2700);

    return () => clearTimeout(timer);
  }, [message.id, onClose]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose(message.id);
    }, 300);
  };

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border-l-4 min-w-[280px] max-w-md',
        config.bgColor,
        config.borderColor,
        isExiting ? 'animate-slideOutRight' : 'animate-slideInRight'
      )}
      role="alert"
    >
      <Icon className={cn('w-5 h-5 flex-shrink-0', config.iconColor)} />
      <p className={cn('flex-1 text-sm', config.textColor)}>{message.message}</p>
      <button
        onClick={handleClose}
        className={cn(
          'p-1 rounded-full hover:bg-black/5 transition-colors',
          config.textColor
        )}
        aria-label="关闭提示"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function Toast() {
  const { messages, removeMessage } = useToast();

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {messages.map((msg) => (
        <div key={msg.id} className="pointer-events-auto">
          <ToastItem message={msg} onClose={removeMessage} />
        </div>
      ))}
    </div>
  );
}
