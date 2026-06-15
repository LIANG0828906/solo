import React, { forwardRef, useRef, useEffect, useState, useMemo } from 'react';
import PhotoCard from './PhotoCard';
import type { Photo } from '../types';
import './PhotoTimeline.css';

interface PhotoTimelineProps {
  photos: Photo[];
}

interface LayoutConfig {
  cardWidth: number;
  gap: number;
  bufferSize: number;
}

interface LayoutBreakpoint {
  maxWidth: number;
  config: LayoutConfig;
}

const LAYOUT_BREAKPOINTS: LayoutBreakpoint[] = [
  { maxWidth: 480, config: { cardWidth: 160, gap: 12, bufferSize: 2 } },
  { maxWidth: 768, config: { cardWidth: 200, gap: 16, bufferSize: 2 } },
];

const DEFAULT_LAYOUT: LayoutConfig = { cardWidth: 240, gap: 20, bufferSize: 2 };

const getLayoutConfig = (width: number): LayoutConfig => {
  for (const bp of LAYOUT_BREAKPOINTS) {
    if (width <= bp.maxWidth) {
      return bp.config;
    }
  }
  return DEFAULT_LAYOUT;
};

const PhotoTimeline = forwardRef<HTMLDivElement, PhotoTimelineProps>(({ photos }, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const photosRef = useRef(photos);
  const [layout, setLayout] = useState<LayoutConfig>(() => getLayoutConfig(window.innerWidth));
  const [startIndex, setStartIndex] = useState(0);
  const [endIndex, setEndIndex] = useState(-1);
  const [revision, setRevision] = useState(0);

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
    const currentLayout = getLayoutConfig(window.innerWidth);
    setLayout(currentLayout);
    const slotWidth = currentLayout.cardWidth + currentLayout.gap;
    const scrollLeft = container.scrollLeft;
    const clientWidth = container.clientWidth;
    const buffer = currentLayout.bufferSize;
    const rawStart = Math.floor(scrollLeft / slotWidth) - buffer;
    const rawEnd = Math.ceil((scrollLeft + clientWidth) / slotWidth) + buffer - 1;
    const s = Math.max(0, rawStart);
    const e = Math.min(currentPhotos.length - 1, Math.max(s, rawEnd));
    setStartIndex(s);
    setEndIndex(e);
  };

  useEffect(() => {
    updateRange();
  }, [photos.length, revision]);

  useEffect(() => {
    setRevision((r) => r + 1);
  }, [photos]);

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

  const { safeStart, leftPlaceholderWidth, rightPlaceholderWidth, visiblePhotos } = useMemo(() => {
    if (photos.length === 0) {
      return {
        safeStart: 0,
        leftPlaceholderWidth: 0,
        rightPlaceholderWidth: 0,
        visiblePhotos: [] as Photo[],
      };
    }

    const maxIndex = photos.length - 1;
    const s = Math.min(Math.max(0, startIndex), maxIndex);
    const e = Math.min(Math.max(endIndex, s), maxIndex);

    const slotWidth = layout.cardWidth + layout.gap;
    const leftWidth = s * slotWidth;
    const rightCount = maxIndex - e;
    const rightWidth = rightCount * slotWidth;

    const visible = e >= s ? photos.slice(s, e + 1) : [];

    return {
      safeStart: s,
      leftPlaceholderWidth: leftWidth,
      rightPlaceholderWidth: rightWidth,
      visiblePhotos: visible,
    };
  }, [photos, startIndex, endIndex, layout]);

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
