import { useEffect, useCallback, useRef } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Photo } from '../data/photoStore';
import CommentSection from './CommentSection';

interface Props {
  photos: Photo[];
  currentIndex: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}

export default function PhotoModal({ photos, currentIndex, onClose, onPrev, onNext }: Props) {
  const photo = photos[currentIndex];
  const overlayRef = useRef<HTMLDivElement>(null);
  const preloadedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!photo) return;
    const preload = (url: string) => {
      if (!preloadedRef.current.has(url)) {
        const img = new Image();
        img.src = url;
        preloadedRef.current.add(url);
      }
    };
    preload(photo.url);
    if (photos[currentIndex - 1]) preload(photos[currentIndex - 1].url);
    if (photos[currentIndex + 1]) preload(photos[currentIndex + 1].url);
  }, [photo, photos, currentIndex]);

  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'ArrowLeft') onPrev();
    if (e.key === 'ArrowRight') onNext();
  }, [onClose, onPrev, onNext]);

  useEffect(() => {
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [handleKey]);

  if (!photo) return null;

  const categoryLabel: Record<string, string> = {
    portrait: '人像',
    landscape: '风光',
    still_life: '静物'
  };

  return (
    <div
      ref={overlayRef}
      className="modal-overlay"
      onClick={e => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div className="modal-container fade-in">
        <button
          className="modal-close"
          onClick={onClose}
          aria-label="关闭"
        >
          <X size={24} />
        </button>

        {currentIndex > 0 && (
          <button className="modal-nav prev" onClick={onPrev} aria-label="上一张">
            <ChevronLeft size={32} />
          </button>
        )}
        {currentIndex < photos.length - 1 && (
          <button className="modal-nav next" onClick={onNext} aria-label="下一张">
            <ChevronRight size={32} />
          </button>
        )}

        <div className="modal-content">
          <div className="modal-image-wrapper">
            <img
              src={photo.url}
              alt={photo.title}
              className="modal-image"
              key={photo.id}
            />
          </div>
          <div className="modal-info">
            <div className="modal-header">
              <div>
                <span className="modal-category">{categoryLabel[photo.category] || photo.category}</span>
                <h2 className="modal-title">{photo.title}</h2>
              </div>
              <span className="modal-counter">{currentIndex + 1} / {photos.length}</span>
            </div>
            <CommentSection photoId={photo.id} />
          </div>
        </div>
      </div>

      <style>{`
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          animation: fadeInBlur 0.3s ease both;
        }
        .modal-container {
          position: relative;
          width: 100%;
          max-width: 1200px;
          max-height: 90vh;
          background: var(--glass-bg);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        .modal-close {
          position: absolute;
          top: 16px;
          right: 16px;
          z-index: 10;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.9);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-primary);
          transition: all var(--transition);
        }
        .modal-close:hover {
          background: var(--color-accent);
          color: #fff;
          transform: scale(1.05);
        }
        .modal-nav {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          z-index: 10;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.9);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-primary);
          transition: all var(--transition);
        }
        .modal-nav:hover {
          background: var(--color-accent);
          color: #fff;
          transform: translateY(-50%) scale(1.05);
        }
        .modal-nav.prev { left: 16px; }
        .modal-nav.next { right: 16px; }
        .modal-content {
          display: flex;
          height: 100%;
          max-height: 90vh;
          overflow: hidden;
        }
        .modal-image-wrapper {
          flex: 1;
          background: #000;
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 0;
          overflow: auto;
        }
        .modal-image {
          max-width: 100%;
          max-height: 70vh;
          object-fit: contain;
          display: block;
        }
        .modal-info {
          width: 360px;
          background: #fff;
          padding: 24px;
          overflow-y: auto;
          border-left: 1px solid var(--color-border);
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 8px;
        }
        .modal-category {
          display: inline-block;
          padding: 3px 10px;
          background: var(--color-accent);
          color: #fff;
          font-size: 12px;
          font-weight: 600;
          border-radius: 20px;
          margin-bottom: 8px;
        }
        .modal-title {
          font-size: 24px;
          color: var(--color-primary);
        }
        .modal-counter {
          font-size: 13px;
          color: #999;
          font-weight: 600;
        }
        @media (max-width: 768px) {
          .modal-overlay { padding: 0; }
          .modal-container {
            max-height: 100vh;
            border-radius: 0;
          }
          .modal-content {
            flex-direction: column;
          }
          .modal-info {
            width: 100%;
            max-height: 45vh;
            border-left: none;
            border-top: 1px solid var(--color-border);
          }
          .modal-image-wrapper { max-height: 50vh; }
          .modal-nav { width: 40px; height: 40px; }
          .modal-nav.prev { left: 8px; }
          .modal-nav.next { right: 8px; }
        }
      `}</style>
    </div>
  );
}
