import React, { forwardRef, useRef, useEffect, useState } from 'react';
import PhotoCard from './PhotoCard';
import type { Photo } from '../types';
import './PhotoTimeline.css';

interface PhotoTimelineProps {
  photos: Photo[];
}

const PhotoTimeline = forwardRef<HTMLDivElement, PhotoTimelineProps>(({ photos }, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleIndices, setVisibleIndices] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!containerRef.current || photos.length === 0) return;

    const container = containerRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const index = Number(entry.target.getAttribute('data-index'));
          if (!isNaN(index)) {
            setVisibleIndices((prev) => {
              const next = new Set(prev);
              if (entry.isIntersecting) {
                next.add(index);
              } else {
                next.delete(index);
              }
              return next;
            });
          }
        });
      },
      {
        root: container,
        threshold: 0.1,
        rootMargin: '100px'
      }
    );

    const items = container.querySelectorAll('.photo-card-wrapper');
    items.forEach((item) => observer.observe(item));

    return () => observer.disconnect();
  }, [photos]);

  const mergedRef = (node: HTMLDivElement | null) => {
    (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
    if (typeof ref === 'function') {
      ref(node);
    } else if (ref) {
      (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
    }
  };

  return (
    <div 
      ref={mergedRef}
      className="photo-timeline"
    >
      <div className="timeline-track">
        {photos.map((photo, index) => (
          <div 
            key={photo.id}
            className="photo-card-wrapper"
            data-index={index}
          >
            <PhotoCard 
              photo={photo} 
              isVisible={visibleIndices.has(index)}
              index={index}
            />
          </div>
        ))}
      </div>
    </div>
  );
});

PhotoTimeline.displayName = 'PhotoTimeline';

export default PhotoTimeline;
