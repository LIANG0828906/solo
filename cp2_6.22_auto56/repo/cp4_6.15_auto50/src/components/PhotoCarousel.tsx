import { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight, Camera, Image } from 'lucide-react';

interface PhotoCarouselProps {
  photos: string[];
  onUpdatePhoto?: () => void;
}

export default function PhotoCarousel({ photos, onUpdatePhoto }: PhotoCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goToNext = useCallback(() => {
    if (photos.length <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % photos.length);
  }, [photos.length]);

  const goToPrev = useCallback(() => {
    if (photos.length <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
  }, [photos.length]);

  useEffect(() => {
    if (isHovering || photos.length <= 1) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }
    intervalRef.current = setInterval(goToNext, 4000);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isHovering, goToNext, photos.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goToPrev();
      else if (e.key === 'ArrowRight') goToNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToPrev, goToNext]);

  if (photos.length === 0) {
    return (
      <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-olive-100 flex flex-col items-center justify-center">
        <Image size={48} className="text-olive-300" />
        <span className="text-olive-300 mt-2">暂无照片</span>
      </div>
    );
  }

  return (
    <div
      className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-olive-100"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <img
        src={photos[currentIndex]}
        alt={`照片 ${currentIndex + 1}`}
        className="object-cover w-full h-full transition-opacity duration-300"
      />

      {photos.length > 1 && (
        <>
          <button
            onClick={goToPrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/70 backdrop-blur flex items-center justify-center hover:bg-white transition"
          >
            <ChevronLeft size={20} className="text-olive-700" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/70 backdrop-blur flex items-center justify-center hover:bg-white transition"
          >
            <ChevronRight size={20} className="text-olive-700" />
          </button>
        </>
      )}

      {photos.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
          {photos.map((_, idx) => (
            <span
              key={idx}
              className={`rounded-full transition-all ${
                idx === currentIndex
                  ? 'bg-white w-6 h-2'
                  : 'bg-white/50 w-2 h-2'
              }`}
            />
          ))}
        </div>
      )}

      {onUpdatePhoto && (
        <button
          onClick={onUpdatePhoto}
          className="absolute top-3 right-3 bg-white/70 backdrop-blur rounded-full w-8 h-8 flex items-center justify-center hover:bg-white transition"
        >
          <Camera size={16} className="text-olive-700" />
        </button>
      )}
    </div>
  );
}
