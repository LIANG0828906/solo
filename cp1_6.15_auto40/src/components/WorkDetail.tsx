import { useState, useEffect, useCallback } from 'react';
import { X, Calendar, Tag, ZoomIn } from 'lucide-react';
import type { Work } from '../data/works';

interface WorkDetailProps {
  work: Work | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function WorkDetail({ work, isOpen, onClose }: WorkDetailProps) {
  const [isClosing, setIsClosing] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showZoomed, setShowZoomed] = useState(false);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      setImageLoaded(false);
      setShowZoomed(false);
      onClose();
    }, 200);
  }, [onClose]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isClosing) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, isClosing, handleClose]);

  useEffect(() => {
    if (isOpen) {
      setImageLoaded(false);
      setShowZoomed(false);
      setIsClosing(false);
    }
  }, [isOpen, work?.id]);

  if (!isOpen || !work) return null;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className={isClosing ? 'modal-closing' : ''}>
      <div className="modal-overlay" onClick={handleClose}>
        <div
          className="modal-content"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative">
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                color: '#ffffff',
              }}
              aria-label="关闭"
            >
              <X size={20} />
            </button>

            <div
              className="relative cursor-zoom-in overflow-hidden"
              onClick={() => setShowZoomed(true)}
            >
              {!imageLoaded && (
                <div className="aspect-video skeleton w-full" />
              )}
              <img
                src={work.image}
                alt={work.title}
                className={`w-full h-auto transition-opacity duration-500 ${
                  imageLoaded ? 'opacity-100' : 'opacity-0 absolute inset-0'
                }`}
                onLoad={() => setImageLoaded(true)}
              />
              <div
                className="absolute bottom-4 right-4 w-10 h-10 rounded-full flex items-center justify-center transition-opacity duration-300"
                style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  color: '#ffffff',
                  opacity: imageLoaded ? 1 : 0,
                }}
              >
                <ZoomIn size={20} />
              </div>
            </div>
          </div>

          <div className="p-6 md:p-8">
            <h2
              className="text-2xl md:text-3xl font-bold mb-4"
              style={{ color: 'var(--text-primary)' }}
            >
              {work.title}
            </h2>

            <div className="flex flex-wrap items-center gap-4 mb-6">
              <div
                className="flex items-center gap-2 text-sm"
                style={{ color: 'var(--text-secondary)' }}
              >
                <Calendar size={16} />
                <span>{formatDate(work.date)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Tag size={16} style={{ color: 'var(--text-secondary)' }} />
                <div className="flex flex-wrap gap-2">
                  {work.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-3 py-1 rounded-full transition-all duration-300"
                      style={{
                        backgroundColor: 'var(--bg-secondary)',
                        color: 'var(--accent-color)',
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="prose max-w-none">
              <p
                className="text-base leading-relaxed"
                style={{ color: 'var(--text-secondary)' }}
              >
                {work.description}
              </p>
            </div>
          </div>
        </div>
      </div>

      {showZoomed && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 cursor-zoom-out"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.9)' }}
          onClick={() => setShowZoomed(false)}
        >
          <img
            src={work.image}
            alt={work.title}
            className="max-w-full max-h-full object-contain"
          />
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowZoomed(false);
            }}
            className="absolute top-4 right-4 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              color: '#ffffff',
            }}
            aria-label="关闭放大"
          >
            <X size={24} />
          </button>
        </div>
      )}
    </div>
  );
}
