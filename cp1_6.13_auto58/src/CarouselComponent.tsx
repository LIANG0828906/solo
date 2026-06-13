import React, { useRef, useState, useCallback, useEffect } from 'react';
import type { ComponentConfig } from './types';

interface CarouselComponentProps {
  component: ComponentConfig;
  isPreview?: boolean;
}

const CarouselComponent: React.FC<CarouselComponentProps> = ({ component, isPreview }) => {
  const images = component.images || [
    'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=beautiful%20landscape%20mountain&image_size=landscape_16_9',
    'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=ocean%20sunset%20beach&image_size=landscape_16_9',
    'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=city%20skyline%20night&image_size=landscape_16_9',
  ];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dragStartX, setDragStartX] = useState<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startAutoPlay = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % images.length);
    }, 3000);
  }, [images.length]);

  const stopAutoPlay = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (isPreview) {
      startAutoPlay();
    }
    return () => stopAutoPlay();
  }, [isPreview, startAutoPlay, stopAutoPlay]);

  const handleDragStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isPreview) return;
    stopAutoPlay();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    setDragStartX(clientX);
  }, [isPreview, stopAutoPlay]);

  const handleDragEnd = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isPreview || dragStartX === null) return;
    const clientX = 'changedTouches' in e ? e.changedTouches[0].clientX : e.clientX;
    const diff = clientX - dragStartX;
    if (Math.abs(diff) > 30) {
      if (diff < 0) {
        setCurrentIndex(prev => (prev + 1) % images.length);
      } else {
        setCurrentIndex(prev => (prev - 1 + images.length) % images.length);
      }
    }
    setDragStartX(null);
    startAutoPlay();
  }, [isPreview, dragStartX, images.length, startAutoPlay]);

  return (
    <div style={{
      width: '100%',
      height: '100%',
      position: 'relative',
      overflow: 'hidden',
      borderRadius: component.borderRadius || 4,
      backgroundColor: '#f0f0f0',
    }}>
      <div
        onMouseDown={handleDragStart}
        onMouseUp={handleDragEnd}
        onTouchStart={handleDragStart}
        onTouchEnd={handleDragEnd}
        style={{
          width: '100%',
          height: '100%',
          cursor: isPreview ? 'grab' : 'default',
          position: 'relative',
        }}
      >
        {images.map((img, idx) => (
          <img
            key={idx}
            src={img}
            alt={`slide ${idx + 1}`}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: 'calc(100% - 24px)',
              objectFit: 'cover',
              opacity: idx === currentIndex ? 1 : 0,
              transition: 'opacity 0.5s ease-in-out',
            }}
          />
        ))}
      </div>
      <div style={{
        position: 'absolute',
        bottom: 4,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: 6,
        zIndex: 2,
      }}>
        {images.map((_, idx) => (
          <div
            key={idx}
            onClick={() => isPreview && setCurrentIndex(idx)}
            style={{
              width: idx === currentIndex ? 16 : 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: idx === currentIndex ? '#2196F3' : 'rgba(255,255,255,0.7)',
              cursor: isPreview ? 'pointer' : 'default',
              transition: 'all 0.3s ease',
              border: '1px solid rgba(0,0,0,0.1)',
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default React.memo(CarouselComponent);
