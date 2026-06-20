import { useState, useRef, useCallback, useEffect } from 'react';

interface ImageCarouselProps {
  images: string[];
}

export default function ImageCarousel({ images }: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [direction, setDirection] = useState<'left' | 'right'>('right');
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number; scale: number } | null>(null);
  const lastPinchDist = useRef<number | null>(null);

  const goTo = useCallback((index: number, dir: 'left' | 'right') => {
    if (isAnimating) return;
    setDirection(dir);
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentIndex(index);
      setIsAnimating(false);
    }, 300);
  }, [isAnimating]);

  const goNext = useCallback(() => {
    const next = (currentIndex + 1) % images.length;
    goTo(next, 'right');
  }, [currentIndex, images.length, goTo]);

  const goPrev = useCallback(() => {
    const prev = (currentIndex - 1 + images.length) % images.length;
    goTo(prev, 'left');
  }, [currentIndex, images.length, goTo]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, scale };
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastPinchDist.current = Math.sqrt(dx * dx + dy * dy);
    }
  }, [scale]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && lastPinchDist.current !== null) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const newScale = Math.min(3, Math.max(1, scale * (dist / lastPinchDist.current)));
      setScale(newScale);
      lastPinchDist.current = dist;
    }
  }, [scale]);

  const handleTouchEnd = useCallback(() => {
    if (touchStartRef.current && scale <= 1.2) {
      setScale(1);
    }
    touchStartRef.current = null;
    lastPinchDist.current = null;
  }, [scale]);

  useEffect(() => {
    setScale(1);
  }, [currentIndex]);

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-[4/3] rounded-card overflow-hidden bg-cream select-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className="w-full h-full"
        style={{
          perspective: '1000px',
          transformStyle: 'preserve-3d',
        }}
      >
        {images.map((img, idx) => {
          const isActive = idx === currentIndex;
          const rotateY = !isActive
            ? direction === 'right'
              ? (idx < currentIndex ? -90 : 90)
              : (idx > currentIndex ? 90 : -90)
            : 0;
          const zIndex = isActive ? 10 : 1;

          return (
            <div
              key={idx}
              className="absolute inset-0"
              style={{
                transform: `rotateY(${isAnimating && isActive ? 0 : rotateY}deg) scale(${isActive ? scale : 1})`,
                transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                transformOrigin: direction === 'right' ? 'left center' : 'right center',
                backfaceVisibility: 'hidden',
                zIndex,
              }}
            >
              <img
                src={img}
                alt={`作品图片 ${idx + 1}`}
                className="w-full h-full object-cover"
                draggable={false}
              />
            </div>
          );
        })}
      </div>

      <button
        onClick={goPrev}
        className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 text-walnut flex items-center justify-center shadow-md hover:bg-white transition-colors duration-300 z-20"
        aria-label="上一张"
      >
        ‹
      </button>
      <button
        onClick={goNext}
        className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 text-walnut flex items-center justify-center shadow-md hover:bg-white transition-colors duration-300 z-20"
        aria-label="下一张"
      >
        ›
      </button>

      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
        {images.map((_, idx) => (
          <button
            key={idx}
            onClick={() => goTo(idx, idx > currentIndex ? 'right' : 'left')}
            className={`
              w-2 h-2 rounded-full transition-all duration-300
              ${idx === currentIndex ? 'bg-white w-6' : 'bg-white/50'}
            `}
            aria-label={`图片 ${idx + 1}`}
          />
        ))}
      </div>

      {scale > 1.1 && (
        <button
          onClick={() => setScale(1)}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 text-walnut text-sm flex items-center justify-center z-20"
        >
          ✕
        </button>
      )}
    </div>
  );
}
