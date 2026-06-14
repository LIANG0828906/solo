import React, { forwardRef, useRef, useEffect, useState } from 'react';
import PhotoCard from './PhotoCard';
import type { Photo } from '../types';
import './PhotoTimeline.css';

interface PhotoTimelineProps {
  photos: Photo[];
}

interface Layout {
  cardWidth: number;
  gap: number;
}

const getLayout = (): Layout => {
  const w = window.innerWidth;
  if (w <= 480) return { cardWidth: 160, gap: 12 };
  if (w <= 768) return { cardWidth: 200, gap: 16 };
  return { cardWidth: 240, gap: 20 };
};

const PhotoTimeline = forwardRef<HTMLDivElement, PhotoTimelineProps>(({ photos }, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const photosRef = useRef(photos);
  const [layout, setLayout] = useState<Layout>(() => getLayout());
  const [startIndex, setStartIndex] = useState(0);
  const [endIndex, setEndIndex] = useState(-1);

  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);

  const updateRange = () => {
    const container = containerRef.current;
    const currentPhotos = photosRef.current;
    if (!container || currentPhotos.length === 0) {
      setStartIndex(0);
      setEndIndex(-1);
      return;
    }
    const currentLayout = getLayout();
    setLayout(currentLayout);
    const slotWidth = currentLayout.cardWidth + currentLayout.gap;
    const scrollLeft = container.scrollLeft;
    const clientWidth = container.clientWidth;
    const rawStart = Math.floor(scrollLeft / slotWidth) - 2;
    const rawEnd = Math.ceil((scrollLeft + clientWidth) / slotWidth) + 2;
    const s = Math.max(0, rawStart);
    const e = Math.min(currentPhotos.length - 1, rawEnd);
    setStartIndex(s);
    setEndIndex(e);
  };

  useEffect(() => {
    updateRange();
  }, [photos.length]);

  useEffect(() => {
    const onScroll = () => {
      if (rafRef.current !== null) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        updateRange();
      });
    };

    const onResize = () => {
      if (rafRef.current !== null) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        updateRange();
      });
    };

    const container = containerRef.current;
    container?.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);

    return () => {
      container?.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const mergedRef = (node: HTMLDivElement | null) => {
    (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
    if (typeof ref === 'function') {
      ref(node);
    } else if (ref) {
      (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
    }
  };

  const maxIndex = Math.max(0, photos.length - 1);
  const safeStart = Math.min(startIndex, maxIndex);
  const safeEnd = Math.min(Math.max(endIndex, safeStart - 1), maxIndex);

  const leftPlaceholderWidth = safeStart > 0
    ? safeStart * layout.cardWidth + (safeStart - 1) * layout.gap
    : 0;

  const rightCount = Math.max(0, photos.length - 1 - safeEnd);
  const rightPlaceholderWidth = rightCount > 0
    ? rightCount * layout.cardWidth + (rightCount - 1) * layout.gap
    : 0;

  const visiblePhotos = safeEnd >= safeStart && photos.length > 0
    ? photos.slice(safeStart, safeEnd + 1)
    : [];

  return (
    <div 
      ref={mergedRef}
      className="photo-timeline"
    >
      <div className="timeline-track">
        {leftPlaceholderWidth > 0 && (
          <div 
            className="photo-card-placeholder"
            style={{ width: `${leftPlaceholderWidth}px` }}
          />
        )}
        {visiblePhotos.map((photo, offset) => {
          const index = safeStart + offset;
          return (
            <div 
              key={photo.id}
              className="photo-card-wrapper"
              data-index={index}
            >
              <PhotoCard 
                photo={photo} 
                isVisible={true}
                index={index}
              />
            </div>
          );
        })}
        {rightPlaceholderWidth > 0 && (
          <div 
            className="photo-card-placeholder"
            style={{ width: `${rightPlaceholderWidth}px` }}
          />
        )}
      </div>
    </div>
  );
});

PhotoTimeline.displayName = 'PhotoTimeline';

export default PhotoTimeline;
