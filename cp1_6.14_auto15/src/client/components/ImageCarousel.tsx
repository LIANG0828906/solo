import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  images: string[];
}

export default function ImageCarousel({ images }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="aspect-square bg-gray-100 rounded-2xl flex items-center justify-center text-gray-400">
        暂无图片
      </div>
    );
  }

  const goPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const goNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  return (
    <div className="space-y-3">
      <div className="relative aspect-square bg-gray-100 rounded-2xl overflow-hidden shadow-lg">
        <img
          key={currentIndex}
          src={images[currentIndex]}
          alt={`图片 ${currentIndex + 1}`}
          className="w-full h-full object-cover animate-fade-in"
        />

        {images.length > 1 && (
          <>
            <button
              onClick={goPrev}
              className={cn(
                'absolute left-3 top-1/2 -translate-y-1/2',
                'w-10 h-10 rounded-full bg-white/80 hover:bg-white',
                'flex items-center justify-center shadow-md transition-colors'
              )}
            >
              <ChevronLeft className="w-6 h-6 text-gray-700" />
            </button>
            <button
              onClick={goNext}
              className={cn(
                'absolute right-3 top-1/2 -translate-y-1/2',
                'w-10 h-10 rounded-full bg-white/80 hover:bg-white',
                'flex items-center justify-center shadow-md transition-colors'
              )}
            >
              <ChevronRight className="w-6 h-6 text-gray-700" />
            </button>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={cn(
                'shrink-0 w-16 h-16 rounded-lg overflow-hidden',
                'border-2 transition-colors',
                idx === currentIndex
                  ? 'border-[#8B5A2B]'
                  : 'border-transparent hover:border-gray-300'
              )}
            >
              <img src={img} alt={`缩略图 ${idx + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
