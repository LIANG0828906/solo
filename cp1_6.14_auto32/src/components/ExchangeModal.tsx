import { useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExchangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (message: string) => void;
  itemTitle: string;
}

export default function ExchangeModal({
  isOpen,
  onClose,
  onSubmit,
  itemTitle,
}: ExchangeModalProps) {
  const [message, setMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = () => {
    onSubmit(message);
    setMessage('');
  };

  const handleClose = () => {
    setMessage('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={handleClose}
      />
      <div
        className={cn(
          'relative z-10 mx-4 w-full max-w-md rounded-2xl bg-white p-6',
          'animate-fade-slide'
        )}
      >
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="text-lg font-semibold text-gray-900">请求交换</h2>
        <p className="mt-1 text-sm text-gray-500">
          物品：{itemTitle}
        </p>

        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="给物品主人留言…"
          rows={4}
          className={cn(
            'mt-4 w-full resize-none rounded-lg border border-gray-200 p-3',
            'text-sm text-gray-700 placeholder:text-gray-400',
            'focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary'
          )}
        />

        <div className="mt-4 flex gap-3 justify-end">
          <button
            onClick={handleClose}
            className={cn(
              'rounded-lg px-4 py-2 text-sm font-medium',
              'text-gray-600 hover:bg-gray-100 transition-colors'
            )}
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            className={cn(
              'rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white',
              'hover:bg-primary-600 transition-colors'
            )}
          >
            发送请求
          </button>
        </div>
      </div>
    </div>
  );
}
