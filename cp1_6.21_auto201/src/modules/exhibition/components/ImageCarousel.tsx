import React, { useState, useRef, useCallback, useEffect } from 'react';

interface ImageCarouselProps {
  images: string[];
}

const ImageCarousel: React.FC<ImageCarouselProps> = ({ images }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set([0]));
  const [transitioning, setTransitioning] = useState(false);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const goTo = useCallback(
    (index: number) => {
      if (transitioning || index === currentIndex) return;
      setTransitioning(true);
      setCurrentIndex(index);
      if (!loadedImages.has(index)) {
        setLoadedImages((prev) => new Set(prev).add(index));
      }
      setTimeout(() => setTransitioning(false), 300);
    },
    [currentIndex, transitioning, loadedImages]
  );

  const goPrev = useCallback(() => {
    const next = currentIndex === 0 ? images.length - 1 : currentIndex - 1;
    goTo(next);
  }, [currentIndex, images.length, goTo]);

  const goNext = useCallback(() => {
    const next = currentIndex === images.length - 1 ? 0 : currentIndex + 1;
    goTo(next);
  }, [currentIndex, images.length, goTo]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(() => {
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 50) {
      if (diff > 0) goNext();
      else goPrev();
    }
  }, [goNext, goPrev]);

  useEffect(() => {
    setCurrentIndex(0);
    setLoadedImages(new Set([0]));
  }, [images]);

  if (!images.length) {
    return (
      <div style={styles.emptyContainer}>
        <div className="skeleton-pulse" style={styles.skeleton} />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={styles.container}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div style={styles.imageWrapper}>
        {images.map((src, idx) => (
          <div
            key={idx}
            style={{
              ...styles.slide,
              opacity: idx === currentIndex ? 1 : 0,
              transition: 'opacity 0.3s ease',
              zIndex: idx === currentIndex ? 1 : 0,
            }}
          >
            {loadedImages.has(idx) ? (
              <img
                src={src}
                alt={`Exhibition view ${idx + 1}`}
                style={styles.image}
                onLoad={() => setLoadedImages((prev) => new Set(prev).add(idx))}
              />
            ) : null}
            {idx === currentIndex && !loadedImages.has(idx) && (
              <div className="skeleton-pulse" style={styles.skeleton} />
            )}
          </div>
        ))}
      </div>

      {images.length > 1 && (
        <>
          <button style={styles.arrowButton} onClick={goPrev} aria-label="Previous image">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F1F5F9" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button
            style={{ ...styles.arrowButton, right: 12, left: 'auto' }}
            onClick={goNext}
            aria-label="Next image"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F1F5F9" strokeWidth="2">
              <polyline points="9 6 15 12 9 18" />
            </svg>
          </button>
        </>
      )}

      <div style={styles.dotsContainer}>
        {images.map((_, idx) => (
          <div
            key={idx}
            style={{
              ...styles.dot,
              background: idx === currentIndex ? '#38BDF8' : 'rgba(56,189,248,0.3)',
            }}
            onClick={() => goTo(idx)}
          />
        ))}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'relative',
    padding: 20,
    borderRadius: 16,
    overflow: 'hidden',
    background: '#1E293B',
  },
  emptyContainer: {
    position: 'relative',
    padding: 20,
    borderRadius: 16,
    overflow: 'hidden',
    background: '#1E293B',
    height: 300,
  },
  imageWrapper: {
    position: 'relative',
    width: '100%',
    minHeight: 200,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  slide: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    maxWidth: 800,
    width: '100%',
    height: 'auto',
    maxHeight: 500,
    objectFit: 'contain',
    borderRadius: 8,
  },
  skeleton: {
    width: '100%',
    height: 300,
    borderRadius: 8,
    background: '#334155',
  },
  arrowButton: {
    position: 'absolute',
    top: '50%',
    left: 12,
    transform: 'translateY(-50%)',
    width: 40,
    height: 40,
    borderRadius: '50%',
    border: 'none',
    background: 'rgba(51,65,85,0.8)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
    transition: 'background 0.2s, transform 0.2s',
  },
  dotsContainer: {
    display: 'flex',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: '50%',
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
};

export default ImageCarousel;
