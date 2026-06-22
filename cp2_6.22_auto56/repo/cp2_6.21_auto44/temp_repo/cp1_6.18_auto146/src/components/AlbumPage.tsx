import { memo, useState, useRef, useEffect, useCallback } from 'react';
import type { Photo } from '../types';
import { usePhotoStore } from '../data/photoStore';

interface AlbumPageProps {
  photo: Photo;
  side: 'left' | 'right';
  pageNumber: number;
  isNew?: boolean;
  onDragStart: (photo: Photo, e: React.DragEvent) => void;
  onDragEnd: () => void;
  onFlip?: (direction: 'next' | 'prev') => void;
  flipStyle?: React.CSSProperties;
  showFlipHotspots?: boolean;
}

const CalendarIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const MapPinIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const StarIcon = ({ filled }: { filled: boolean }) => (
  <svg viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const ChevronIcon = ({ direction }: { direction: 'left' | 'right' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    {direction === 'left' ? (
      <polyline points="15 18 9 12 15 6" />
    ) : (
      <polyline points="9 18 15 12 9 6" />
    )}
  </svg>
);

const formatDate = (dateStr: string): string => {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return dateStr;
  }
};

const AlbumPage = memo(function AlbumPage({
  photo,
  side,
  pageNumber,
  isNew,
  onDragStart,
  onDragEnd,
  onFlip,
  flipStyle,
  showFlipHotspots = true
}: AlbumPageProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [noteDraft, setNoteDraft] = useState(photo.note);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const updateNote = usePhotoStore((s) => s.updateNote);

  useEffect(() => {
    setNoteDraft(photo.note);
  }, [photo.note]);

  useEffect(() => {
    if (!imgRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            if (img.dataset.src) {
              img.src = img.dataset.src;
              observer.disconnect();
            }
          }
        });
      },
      { rootMargin: '100px' }
    );
    observer.observe(imgRef.current);
    return () => observer.disconnect();
  }, [photo.url]);

  const handleSaveNote = useCallback(() => {
    updateNote(photo.id, noteDraft);
    setIsEditing(false);
  }, [photo.id, noteDraft, updateNote]);

  const handleCancelEdit = useCallback(() => {
    setNoteDraft(photo.note);
    setIsEditing(false);
  }, [photo.note]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') handleCancelEdit();
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') handleSaveNote();
    },
    [handleCancelEdit, handleSaveNote]
  );

  const handleDragStart = useCallback(
    (e: React.DragEvent) => {
      setIsDragging(true);
      onDragStart(photo, e);
    },
    [photo, onDragStart]
  );

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    onDragEnd();
  }, [onDragEnd]);

  return (
    <div
      ref={pageRef}
      className={`album-page ${side}`}
      style={flipStyle}
    >
      {showFlipHotspots && onFlip && (
        <>
          {side === 'left' && (
            <div
              className="flip-hotspot prev"
              onClick={() => onFlip('prev')}
              role="button"
              aria-label="上一页"
            >
              <div className="flip-hint-icon">
                <ChevronIcon direction="left" />
              </div>
            </div>
          )}
          {side === 'right' && (
            <div
              className="flip-hotspot next"
              onClick={() => onFlip('next')}
              role="button"
              aria-label="下一页"
            >
              <div className="flip-hint-icon">
                <ChevronIcon direction="right" />
              </div>
            </div>
          )}
          <div
            className="flip-corner"
            onMouseDown={(e) => {
              e.preventDefault();
              onFlip(side === 'left' ? 'prev' : 'next');
            }}
            role="button"
            aria-label={side === 'left' ? '从左下角翻页' : '从右下角翻页'}
          />
        </>
      )}

      <div
        className={`photo-container ${isDragging ? 'dragging' : ''}`}
        draggable
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {isNew && <div className="photo-new-badge">NEW</div>}
        {photo.isFavorite && (
          <div className="photo-favorite-badge">
            <StarIcon filled={true} />
          </div>
        )}
        <img
          ref={imgRef}
          data-src={photo.url}
          src={photo.thumbnail || photo.url}
          alt={photo.note || `照片 ${pageNumber}`}
          className={`photo-image ${imageLoaded ? '' : 'loading'}`}
          onLoad={() => setImageLoaded(true)}
          loading="lazy"
          draggable={false}
        />
      </div>

      <div className="photo-info">
        <div className="photo-meta">
          <span className="photo-date">
            <CalendarIcon />
            {formatDate(photo.takenAt)}
          </span>
          {photo.location && (
            <span className="photo-location">
              <MapPinIcon />
              {photo.location}
            </span>
          )}
        </div>

        <div className="photo-note">
          {isEditing ? (
            <div className="note-editor">
              <textarea
                className="note-textarea"
                value={noteDraft}
                onChange={(e) => setNoteDraft(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="写下关于这张照片的回忆..."
                autoFocus
              />
              <div className="note-actions">
                <button className="note-btn cancel" onClick={handleCancelEdit}>
                  取消
                </button>
                <button className="note-btn save" onClick={handleSaveNote}>
                  保存
                </button>
              </div>
            </div>
          ) : (
            <div
              className="note-display"
              onClick={() => setIsEditing(true)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setIsEditing(true);
                }
              }}
            >
              {photo.note}
            </div>
          )}
        </div>
      </div>

      <div className="page-page-number">— {pageNumber} —</div>
    </div>
  );
});

export default AlbumPage;
