import { useEffect, useState } from 'react';
import { X, Download, Loader2 } from 'lucide-react';
import { generateCalendarImage, downloadImage } from '../utils/calendarRenderer';
import { useRecipeStore } from '../stores/recipeStore';

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CalendarModal({ isOpen, onClose }: CalendarModalProps) {
  const recipes = useRecipeStore((state) => state.recipes);
  const favorites = useRecipeStore((state) => state.favorites);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsGenerating(true);
      setImageUrl('');

      const timer = setTimeout(() => {
        try {
          const solarTermOrder = recipes.map((r) => r.solarTerm);
          const today = new Date();
          const dateStr = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`;

          const url = generateCalendarImage({
            favorites,
            solarTermOrder,
            userName: '节气美食家',
            generatedDate: dateStr,
          });
          setImageUrl(url);
        } catch (error) {
          console.error('Failed to generate calendar:', error);
        }
        setIsGenerating(false);
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [isOpen, favorites, recipes]);

  const handleDownload = () => {
    if (imageUrl) {
      const today = new Date();
      const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
      downloadImage(imageUrl, `节气食单_${dateStr}.png`);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        backgroundColor: 'rgba(60, 40, 20, 0.6)',
        backdropFilter: 'blur(8px)',
        animation: 'fadeIn 0.3s ease',
      }}
    >
      <div
        className="relative max-w-md w-full"
        style={{
          animation: 'scaleIn 0.3s ease',
        }}
      >
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 p-2 rounded-full transition-colors"
          style={{ color: '#FFF7ED' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
          aria-label="关闭"
        >
          <X size={28} />
        </button>

        <div
          className="rounded-3xl overflow-hidden shadow-2xl"
          style={{ backgroundColor: '#FFFAF5' }}
        >
          <div className="p-5 pb-0">
            <h3
              className="text-2xl font-bold text-center"
              style={{
                color: '#3D2914',
                fontFamily: '"Ma Shan Zheng", cursive',
                letterSpacing: '2px',
              }}
            >
              我的节气美食日历
            </h3>
            <p className="text-center text-sm mt-1" style={{ color: '#8B7355' }}>
              共收藏 {favorites.length} 道节气美食
            </p>
          </div>

          <div
            className="m-5 rounded-2xl overflow-hidden"
            style={{
              backgroundColor: '#F5EDE3',
              aspectRatio: '9/16',
              maxHeight: '60vh',
            }}
          >
            {isGenerating ? (
              <div className="w-full h-full flex flex-col items-center justify-center">
                <Loader2
                  size={40}
                  className="animate-spin mb-3"
                  style={{ color: '#E56B5D' }}
                />
                <p className="text-sm" style={{ color: '#B8A48C' }}>
                  正在绘制美食日历...
                </p>
              </div>
            ) : imageUrl ? (
              <img
                src={imageUrl}
                alt="节气美食日历"
                className="w-full h-full object-cover"
                style={{ imageRendering: 'auto' }}
              />
            ) : null}
          </div>

          <div className="p-5 pt-0">
            <button
              onClick={handleDownload}
              disabled={!imageUrl || isGenerating}
              className="w-full py-3.5 rounded-2xl font-medium text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: '#C0392B',
                boxShadow: '0 4px 12px rgba(192,57,43,0.3)',
              }}
              onMouseEnter={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.backgroundColor = '#A93226';
                }
              }}
              onMouseLeave={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.backgroundColor = '#C0392B';
                }
              }}
            >
              <Download size={20} />
              下载美食日历
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}
