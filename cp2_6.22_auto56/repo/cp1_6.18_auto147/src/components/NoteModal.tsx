import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (content: string) => void;
  recordTitle: string;
}

export default function NoteModal({ isOpen, onClose, onSubmit, recordTitle }: NoteModalProps) {
  const [content, setContent] = useState('');

  useEffect(() => {
    if (isOpen) {
      setContent('');
    }
  }, [isOpen]);

  const handleSubmit = () => {
    if (content.trim()) {
      onSubmit(content.trim());
      onClose();
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={handleOverlayClick}
    >
      <div
        className="rounded-2xl p-6 w-[420px] shadow-2xl"
        style={{ backgroundColor: '#16213E' }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white text-lg font-semibold">记录心情 - {recordTitle}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="写下此刻的心情..."
          className={cn(
            'w-full p-3 text-white placeholder-gray-500 resize-none outline-none',
            'focus:ring-2 focus:ring-pink-400/50'
          )}
          style={{
            backgroundColor: '#1A1A2E',
            border: '1px solid #E94560',
            borderRadius: '8px',
            height: '120px',
          }}
        />

        <div className="flex justify-end mt-4">
          <button
            onClick={handleSubmit}
            disabled={!content.trim()}
            className={cn(
              'px-6 py-2 text-white rounded-lg font-medium transition-colors',
              'hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed'
            )}
            style={{
              backgroundColor: '#E94560',
            }}
            onMouseEnter={(e) => {
              if (!e.currentTarget.disabled) {
                e.currentTarget.style.backgroundColor = '#FF6B6B';
              }
            }}
            onMouseLeave={(e) => {
              if (!e.currentTarget.disabled) {
                e.currentTarget.style.backgroundColor = '#E94560';
              }
            }}
          >
            提交
          </button>
        </div>
      </div>
    </div>
  );
}
