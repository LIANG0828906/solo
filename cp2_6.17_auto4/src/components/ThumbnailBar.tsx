import { useBookStore } from '@/store/bookStore';
import type { ComicPage } from '@/types';
import { useEffect, useRef, useState, useCallback } from 'react';

interface ThumbnailBarProps {
  pages: ComicPage[];
  currentPage: number;
  thumbnailWidth: number;
  onClick: (page: number) => void;
}

export default function ThumbnailBar({ pages, currentPage, thumbnailWidth, onClick }: ThumbnailBarProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 10 });
  const observerRef = useRef<HTMLDivElement>(null);

  const updateVisibleRange = useCallback(() => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    const scrollLeft = container.scrollLeft;
    const containerWidth = container.clientWidth;
    const gap = 8;
    const totalItemWidth = thumbnailWidth + gap;
    const start = Math.max(0, Math.floor(scrollLeft / totalItemWidth) - 2);
    const end = Math.min(pages.length, Math.ceil((scrollLeft + containerWidth) / totalItemWidth) + 2);
    setVisibleRange({ start, end });
  }, [thumbnailWidth, pages.length]);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    container.addEventListener('scroll', updateVisibleRange);
    updateVisibleRange();
    return () => container.removeEventListener('scroll', updateVisibleRange);
  }, [updateVisibleRange]);

  const gap = 8;
  const thumbHeight = Math.round(thumbnailWidth * 0.75);
  const placeholderW = 20;
  const placeholderH = 30;

  return (
    <div
      ref={scrollRef}
      style={{
        display: 'flex',
        gap: `${gap}px`,
        overflowX: 'auto',
        overflowY: 'hidden',
        padding: '4px 12px',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        maxWidth: '100%',
      }}
    >
      {pages.map((page, idx) => {
        const isVisible = idx >= visibleRange.start && idx <= visibleRange.end;
        const isCurrentPage = idx === currentPage;

        return (
          <div
            key={page.id}
            onClick={() => onClick(idx)}
            style={{
              flexShrink: 0,
              width: thumbnailWidth,
              height: thumbHeight,
              border: isCurrentPage ? '2px solid #D4A017' : '2px solid transparent',
              borderRadius: 3,
              overflow: 'hidden',
              cursor: 'pointer',
              transition: 'border-color 0.2s',
              position: 'relative',
              background: '#555',
            }}
          >
            {isVisible ? (
              <img
                src={page.imageUrl}
                alt={`Page ${idx + 1}`}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                }}
                loading="lazy"
              />
            ) : (
              <div
                style={{
                  width: placeholderW,
                  height: placeholderH,
                  background: '#888',
                  margin: 'auto',
                  marginTop: (thumbHeight - placeholderH) / 2,
                }}
              />
            )}
          </div>
        );
      })}
      <div ref={observerRef} style={{ width: 1, flexShrink: 0 }} />
    </div>
  );
}
