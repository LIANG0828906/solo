import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import type { DataPointInteraction } from '@/types';

interface DataPointModalProps {
  interaction: DataPointInteraction | null;
  onClose: () => void;
}

const DataPointModal: React.FC<DataPointModalProps> = ({ interaction, onClose }) => {
  useEffect(() => {
    if (!interaction) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [interaction, onClose]);

  if (!interaction) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      style={{
        animation: 'fadeIn 0.2s ease-out',
      }}
    >
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modalIn {
          from { 
            transform: scale(0.9);
            opacity: 0;
          }
          to { 
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>

      <div
        className="relative bg-white rounded-lg max-w-md w-full mx-4 overflow-hidden"
        style={{
          animation: 'modalIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
          boxShadow: '0 12px 48px rgba(0,0,0,0.4)',
        }}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 p-1 rounded-full hover:bg-gray-100 transition-colors"
        >
          <X size={20} className="text-gray-500" />
        </button>

        <div className="p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-2 pr-8">
            {interaction.eventName}
          </h3>

          {interaction.imageUrl && (
            <div className="mb-4 rounded-lg overflow-hidden">
              <img
                src={interaction.imageUrl}
                alt={interaction.eventName}
                className="w-full h-48 object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          )}

          <div className="text-gray-600 leading-relaxed whitespace-pre-wrap">
            {interaction.description}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100">
            <span className="text-xs text-gray-400">
              数据点索引: {interaction.dataIndex}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataPointModal;
