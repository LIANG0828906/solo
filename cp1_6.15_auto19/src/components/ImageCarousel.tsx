import { useState, useEffect, useCallback } from 'react'

interface ImageCarouselProps {
  images: string[]
  alt?: string
  height?: number
  autoPlay?: boolean
  autoPlayInterval?: number
}

export default function ImageCarousel({
  images,
  alt = '',
  height = 400,
  autoPlay = true,
  autoPlayInterval = 5000
}: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set())
  const [direction, setDirection] = useState<'left' | 'right'>('right')

  const goToPrevious = useCallback(() => {
    if (isTransitioning) return
    setDirection('left')
    setIsTransitioning(true)
    setCurrentIndex(prev => (prev === 0 ? images.length - 1 : prev - 1))
    setTimeout(() => setIsTransitioning(false), 500)
  }, [images.length, isTransitioning])

  const goToNext = useCallback(() => {
    if (isTransitioning) return
    setDirection('right')
    setIsTransitioning(true)
    setCurrentIndex(prev => (prev === images.length - 1 ? 0 : prev + 1))
    setTimeout(() => setIsTransitioning(false), 500)
  }, [images.length, isTransitioning])

  const goToSlide = useCallback((idx: number) => {
    if (isTransitioning || idx === currentIndex) return
    setDirection(idx > currentIndex ? 'right' : 'left')
    setIsTransitioning(true)
    setCurrentIndex(idx)
    setTimeout(() => setIsTransitioning(false), 500)
  }, [currentIndex, isTransitioning])

  const handleImageLoad = (idx: number) => {
    setLoadedImages(prev => new Set(prev).add(idx))
  }

  useEffect(() => {
    if (!autoPlay || images.length <= 1) return
    const timer = setInterval(() => {
      goToNext()
    }, autoPlayInterval)
    return () => clearInterval(timer)
  }, [autoPlay, autoPlayInterval, images.length, goToNext])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goToPrevious()
      if (e.key === 'ArrowRight') goToNext()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [goToPrevious, goToNext])

  if (!images || images.length === 0) {
    return (
      <div
        className="skeleton"
        style={{
          width: '100%',
          height: `${height}px`,
          borderRadius: 'var(--radius-card)'
        }}
      />
    )
  }

  return (
    <div
      className="carousel"
      onMouseEnter={() => {}}
      style={{ position: 'relative' }}
    >
      {images.map((img, idx) => (
        !loadedImages.has(idx) && idx === currentIndex && (
          <div
            key={`skeleton-${idx}`}
            className="skeleton"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${height}px`,
              zIndex: 1,
              borderRadius: '0'
            }}
          />
        )
      ))}

      <div
        className="carousel-track"
        style={{
          transform: `translateX(-${currentIndex * 100}%)`,
          transition: isTransitioning
            ? 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
            : 'none'
        }}
      >
        {images.map((img, idx) => (
          <div
            key={idx}
            style={{
              minWidth: '100%',
              height: `${height}px`,
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <img
              src={img}
              alt={`${alt} ${idx + 1}`}
              className="carousel-slide"
              style={{
                height: `${height}px`,
                opacity: loadedImages.has(idx) ? 1 : 0,
                transition: 'opacity 0.5s ease',
                transform: idx === currentIndex ? 'scale(1)' : 'scale(1.05)',
                objectFit: 'cover'
              }}
              loading="lazy"
              onLoad={() => handleImageLoad(idx)}
              onError={() => handleImageLoad(idx)}
            />
            {idx === currentIndex && (
              <div style={{
                position: 'absolute',
                bottom: '60px',
                left: '24px',
                padding: '8px 16px',
                background: 'rgba(0,0,0,0.4)',
                backdropFilter: 'blur(8px)',
                color: 'white',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: 500,
                animation: 'fadeInUp 0.5s ease'
              }}>
                📷 {idx + 1} / {images.length}
              </div>
            )}
          </div>
        ))}
      </div>

      {images.length > 1 && (
        <>
          <button
            className="carousel-btn prev"
            onClick={goToPrevious}
            aria-label="上一张"
            style={{
              transform: `translateY(-50%) translateX(${isTransitioning && direction === 'right' ? '-4px' : '0'})`,
              transition: 'transform 0.2s ease'
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-50%) scale(1.15)'
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-50%)'
            }}
          >
            ‹
          </button>
          <button
            className="carousel-btn next"
            onClick={goToNext}
            aria-label="下一张"
            style={{
              transform: `translateY(-50%) translateX(${isTransitioning && direction === 'left' ? '4px' : '0'})`,
              transition: 'transform 0.2s ease'
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-50%) scale(1.15)'
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-50%)'
            }}
          >
            ›
          </button>
          <div className="carousel-dots">
            {images.map((_, idx) => (
              <div
                key={idx}
                className={`carousel-dot ${idx === currentIndex ? 'active' : ''}`}
                onClick={() => goToSlide(idx)}
                style={{
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
