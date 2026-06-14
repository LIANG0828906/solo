import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageCarouselProps {
  images: string[];
}

export default function ImageCarousel({ images }: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [opacity, setOpacity] = useState(1);

  const goTo = useCallback(
    (index: number) => {
      if (index === currentIndex || images.length <= 1) {
        setCurrentIndex(index);
        return;
      }
      setOpacity(0);
      setTimeout(() => {
        setCurrentIndex(index);
        setOpacity(1);
      }, 500);
    },
    [currentIndex, images.length]
  );

  const goPrev = useCallback(() => {
    goTo(currentIndex === 0 ? images.length - 1 : currentIndex - 1);
  }, [currentIndex, images.length, goTo]);

  const goNext = useCallback(() => {
    goTo(currentIndex === images.length - 1 ? 0 : currentIndex + 1);
  }, [currentIndex, images.length, goTo]);

  useEffect(() => {
    if (images.length <= 1) return;
    const timer = setInterval(() => {
      goNext();
    }, 5000);
    return () => clearInterval(timer);
  }, [images.length, goNext]);

  if (!images.length) return null;

  return (
    <div className="relative w-full overflow-hidden rounded-xl bg-gray-100">
      <img
        src={images[currentIndex]}
        alt={`图片 ${currentIndex + 1}`}
        className="h-full w-full object-cover"
        style={{
          opacity,
          transition: 'opacity 0.5s ease-in-out',
        }}
      />

      {images.length > 1 && (
        <>
          <button
            onClick={goPrev}
            className={cn(
              'absolute left-2 top-1/2 -translate-y-1/2',
              'flex h-8 w-8 items-center justify-center',
              'rounded-full bg-black/30 text-white',
              'hover:bg-black/50 transition-colors'
            )}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={goNext}
            className={cn(
              'absolute right-2 top-1/2 -translate-y-1/2',
              'flex h-8 w-8 items-center justify-center',
              'rounded-full bg-black/30 text-white',
              'hover:bg-black/50 transition-colors'
            )}
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={cn(
                  'h-2 w-2 rounded-full transition-colors',
                  i === currentIndex ? 'bg-white' : 'bg-white/50'
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
