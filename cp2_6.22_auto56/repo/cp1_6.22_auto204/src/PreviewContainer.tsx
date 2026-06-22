import { useState, useRef, useEffect, useCallback } from 'react';
import { getDeviceTypeName, type Breakpoint } from './AdapterManager';
import './PreviewContainer.css';

interface PreviewContainerProps {
  breakpoint: Breakpoint;
  url: string;
  isHighlighted: boolean;
  onHighlight: () => void;
  onWidthChange: (width: number) => void;
  minWidth: number;
  maxWidth: number;
}

export default function PreviewContainer({
  breakpoint,
  url,
  isHighlighted,
  onHighlight,
  onWidthChange,
  minWidth,
  maxWidth,
}: PreviewContainerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartWidth, setDragStartWidth] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const sliderRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  const handleIframeLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

  useEffect(() => {
    setIsLoading(true);
  }, [url]);

  const handleSliderMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
      setDragStartX(e.clientX);
      setDragStartWidth(breakpoint.width);
    },
    [breakpoint.width]
  );

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      rafRef.current = requestAnimationFrame(() => {
        const deltaX = e.clientX - dragStartX;
        const newWidth = Math.round(dragStartWidth + deltaX);
        const clampedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
        onWidthChange(clampedWidth);
        rafRef.current = null;
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStartX, dragStartWidth, minWidth, maxWidth, onWidthChange]);

  useEffect(() => {
    if (!isDragging) return;

    const handleTouchMove = (e: TouchEvent) => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      rafRef.current = requestAnimationFrame(() => {
        const touch = e.touches[0];
        const deltaX = touch.clientX - dragStartX;
        const newWidth = Math.round(dragStartWidth + deltaX);
        const clampedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
        onWidthChange(clampedWidth);
        rafRef.current = null;
      });
    };

    const handleTouchEnd = () => {
      setIsDragging(false);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };

    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, dragStartX, dragStartWidth, minWidth, maxWidth, onWidthChange]);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0];
      setIsDragging(true);
      setDragStartX(touch.clientX);
      setDragStartWidth(breakpoint.width);
    },
    [breakpoint.width]
  );

  return (
    <div className="preview-card">
      <div className="preview-header">
        <span className="device-label">
          {getDeviceTypeName(breakpoint.deviceType)}
        </span>
        <span className="width-value">{breakpoint.width}px</span>
        <button
          className={`highlight-btn ${isHighlighted ? 'active' : ''}`}
          onClick={onHighlight}
          title="高亮布局问题"
        >
          {isHighlighted ? '✕' : '◉'}
        </button>
      </div>

      <div
        className="preview-frame-container"
        style={{
          width: `${breakpoint.width}px`,
          height: `${breakpoint.height}px`,
        }}
      >
        {isLoading && (
          <div className="loading-overlay">
            <div className="spinner"></div>
          </div>
        )}

        <iframe
          ref={iframeRef}
          src={url}
          className={`preview-iframe ${isLoading ? 'hidden' : 'visible'}`}
          onLoad={handleIframeLoad}
          title={`${breakpoint.width}px 预览`}
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
        />

        {isHighlighted && !isLoading && (
          <div className="highlight-overlay">
            <div className="highlight-scroll-indicator left">◀</div>
            <div className="highlight-scroll-indicator right">▶</div>
          </div>
        )}
      </div>

      <div className="width-control">
        <span className="width-display">{breakpoint.width}px</span>
        <div className="slider-track">
          <div
            className="slider-fill"
            style={{
              width: `${((breakpoint.width - minWidth) / (maxWidth - minWidth)) * 100}%`,
            }}
          />
          <div
            ref={sliderRef}
            className={`slider-thumb ${isDragging ? 'dragging' : ''}`}
            style={{
              left: `${((breakpoint.width - minWidth) / (maxWidth - minWidth)) * 100}%`,
            }}
            onMouseDown={handleSliderMouseDown}
            onTouchStart={handleTouchStart}
          />
        </div>
      </div>
    </div>
  );
}
