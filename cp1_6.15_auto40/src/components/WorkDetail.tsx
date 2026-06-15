import { useState, useEffect, useCallback, useRef } from 'react';
import { X, Calendar, Tag, ZoomIn, ZoomOut, Move } from 'lucide-react';
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
  const [zoomLevel, setZoomLevel] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imageContainerRef = useRef<HTMLDivElement>(null);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      setImageLoaded(false);
      setShowZoomed(false);
      setZoomLevel(1);
      setPosition({ x: 0, y: 0 });
      onClose();
    }, 200);
  }, [onClose]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isClosing) {
        if (showZoomed) {
          handleCloseZoomed();
        } else {
          handleClose();
        }
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
  }, [isOpen, isClosing, showZoomed, handleClose]);

  useEffect(() => {
    if (isOpen) {
      setImageLoaded(false);
      setShowZoomed(false);
      setZoomLevel(1);
      setPosition({ x: 0, y: 0 });
      setIsClosing(false);
    }
  }, [isOpen, work?.id]);

  useEffect(() => {
    if (!showZoomed) {
      setZoomLevel(1);
      setPosition({ x: 0, y: 0 });
    }
  }, [showZoomed]);

  const handleCloseZoomed = () => {
    setShowZoomed(false);
  };

  const handleZoomIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoomLevel((prev) => Math.min(prev + 0.5, 4));
  };

  const handleZoomOut = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoomLevel((prev) => {
      const next = Math.max(prev - 0.5, 1);
      if (next === 1) {
        setPosition({ x: 0, y: 0 });
      }
      return next;
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isDragging && zoomLevel > 1) {
        setPosition({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y,
        });
      }
    },
    [isDragging, dragStart, zoomLevel]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      setZoomLevel((prev) => Math.min(prev + 0.2, 4));
    } else {
      setZoomLevel((prev) => {
        const next = Math.max(prev - 0.2, 1);
        if (next === 1) {
          setPosition({ x: 0, y: 0 });
        }
        return next;
      });
    }
  };

  const handleDoubleClick = () => {
    if (zoomLevel === 1) {
      setZoomLevel(2);
    } else {
      setZoomLevel(1);
      setPosition({ x: 0, y: 0 });
    }
  };

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
      <div
        className="modal-overlay"
        onClick={handleClose}
        role="presentation"
      >
        <div
          className="modal-content"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="work-detail-title"
        >
          <div className="relative">
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                color: '#ffffff',
              }}
              aria-label="关闭详情弹窗"
            >
              <X size={20} />
            </button>

            <button
              onClick={() => setShowZoomed(true)}
              className="relative w-full cursor-zoom-in overflow-hidden focus:outline-none group"
              aria-label="点击放大图片"
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
                draggable={false}
                loading="eager"
                decoding="async"
              />
              <div
                className="absolute bottom-4 right-4 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 opacity-0 group-hover:opacity-100"
                style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  color: '#ffffff',
                }}
              >
                <ZoomIn size={20} />
              </div>
            </button>
          </div>

          <div className="p-6 md:p-8">
            <h2
              id="work-detail-title"
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
          className="fixed inset-0 z-[60] flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.95)' }}
          onClick={handleCloseZoomed}
          onWheel={handleWheel}
          onDoubleClick={handleDoubleClick}
          onMouseDown={handleMouseDown}
        >
          <div className="absolute top-4 left-4 z-10 flex gap-2">
            <button
              onClick={handleZoomOut}
              className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 hover:bg-white hover:bg-opacity-20 focus:outline-none focus:ring-2 focus:ring-white"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                color: '#ffffff',
              }}
              aria-label="缩小"
              disabled={zoomLevel <= 1}
            >
              <ZoomOut size={20} />
            </button>
            <button
              onClick={handleZoomIn}
              className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 hover:bg-white hover:bg-opacity-20 focus:outline-none focus:ring-2 focus:ring-white"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                color: '#ffffff',
              }}
              aria-label="放大"
              disabled={zoomLevel >= 4}
            >
              <ZoomIn size={20} />
            </button>
            <div
              className="h-10 px-3 rounded-full flex items-center text-sm font-medium"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                color: '#ffffff',
              }}
            >
              {Math.round(zoomLevel * 100)}%
            </div>
          </div>

          <button
            onClick={handleCloseZoomed}
            className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 hover:bg-white hover:bg-opacity-20 focus:outline-none focus:ring-2 focus:ring-white"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              color: '#ffffff',
            }}
            aria-label="关闭放大视图"
          >
            <X size={20} />
          </button>

          {zoomLevel > 1 && (
            <div
              className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 px-3 py-2 rounded-full text-xs"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                color: '#ffffff',
              }}
            >
              <Move size={14} />
              <span>拖拽移动 · 滚轮缩放 · 双击重置</span>
            </div>
          )}

          <div
            ref={imageContainerRef}
            className={`w-full h-full flex items-center justify-center overflow-hidden ${
              zoomLevel > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-zoom-out'
            }`}
            style={{ touchAction: 'none' }}
            onMouseDown={handleMouseDown}
          >
            <img
              src={work.image}
              alt={work.title}
              className="max-w-full max-h-full object-contain select-none transition-transform duration-150 ease-out"
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${zoomLevel})`,
              }}
              draggable={false}
              loading="eager"
              decoding="async"
            />
          </div>
        </div>
      )}
    </div>
  );
}
