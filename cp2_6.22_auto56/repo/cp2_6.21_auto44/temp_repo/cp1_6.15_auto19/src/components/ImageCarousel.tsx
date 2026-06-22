import { useState, useEffect, useCallback, useRef } from 'react'

interface ImageCarouselProps {
  images: string[]
  alt?: string
  height?: number
  autoPlay?: boolean
  autoPlayInterval?: number
}

const DEFAULT_PLACEHOLDER =
  'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20800%20400%22%3E%3Crect%20width%3D%22800%22%20height%3D%22400%22%20fill%3D%22%23F5EDE4%22%2F%3E%3Ctext%20x%3D%22400%22%20y%3D%22220%22%20font-size%3D%2280%22%20text-anchor%3D%22middle%22%3E🏠%3C%2Ftext%3E%3Ctext%20x%3D%22400%22%20y%3D%22280%22%20font-size%3D%2220%22%20text-anchor%3D%22middle%22%20fill%3D%22%238D7664%22%3E加载中...%3C%2Ftext%3E%3C%2Fsvg%3E'

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
  const [errorImages, setErrorImages] = useState<Set<number>>(new Set())
  const [direction, setDirection] = useState<'left' | 'right'>('right')
  const [preloadedIndices, setPreloadedIndices] = useState<Set<number>>(new Set())
  const autoPlayTimerRef = useRef<NodeJS.Timeout | null>(null)

  const preloadImage = useCallback((index: number) => {
    if (!images || images.length === 0) return
    const actualIndex = ((index % images.length) + images.length) % images.length
    if (preloadedIndices.has(actualIndex)) return

    setPreloadedIndices(prev => new Set(prev).add(actualIndex))
    const img = new Image()
    img.src = images[actualIndex]
    img.onload = () => {
      setLoadedImages(prev => new Set(prev).add(actualIndex))
    }
    img.onerror = () => {
      setErrorImages(prev => new Set(prev).add(actualIndex))
      setLoadedImages(prev => new Set(prev).add(actualIndex))
    }
  }, [images, preloadedIndices])

  useEffect(() => {
    if (!images || images.length === 0) return
    preloadImage(0)
    preloadImage(1)
    preloadImage(images.length - 1)
  }, [images])

  const goToPrevious = useCallback(() => {
    if (isTransitioning || !images || images.length === 0) return
    const nextIndex = currentIndex === 0 ? images.length - 1 : currentIndex - 1

    preloadImage(nextIndex - 1)
    setDirection('left')
    setIsTransitioning(true)
    setCurrentIndex(nextIndex)

    setTimeout(() => {
      setIsTransitioning(false)
    }, 500)
  }, [currentIndex, images, isTransitioning, preloadImage])

  const goToNext = useCallback(() => {
    if (isTransitioning || !images || images.length === 0) return
    const nextIndex = currentIndex === images.length - 1 ? 0 : currentIndex + 1

    preloadImage(nextIndex + 1)
    setDirection('right')
    setIsTransitioning(true)
    setCurrentIndex(nextIndex)

    setTimeout(() => {
      setIsTransitioning(false)
    }, 500)
  }, [currentIndex, images, isTransitioning, preloadImage])

  const goToSlide = useCallback((idx: number) => {
    if (isTransitioning || idx === currentIndex || !images || images.length === 0) return
    const targetIndex = Math.max(0, Math.min(images.length - 1, idx))
    const dir = targetIndex > currentIndex ? 'right' : 'left'

    preloadImage(targetIndex)
    preloadImage(targetIndex + 1)
    preloadImage(targetIndex - 1)

    setDirection(dir)
    setIsTransitioning(true)
    setCurrentIndex(targetIndex)

    setTimeout(() => {
      setIsTransitioning(false)
    }, 500)
  }, [currentIndex, isTransitioning, images, preloadImage])

  const handleImageLoad = (idx: number) => {
    setLoadedImages(prev => new Set(prev).add(idx))
  }

  const handleImageError = (idx: number) => {
    setErrorImages(prev => new Set(prev).add(idx))
    setLoadedImages(prev => new Set(prev).add(idx))
  }

  useEffect(() => {
    if (!autoPlay || !images || images.length <= 1) return

    const startAutoPlay = () => {
      if (autoPlayTimerRef.current) {
        clearInterval(autoPlayTimerRef.current)
      }
      autoPlayTimerRef.current = setInterval(() => {
        goToNext()
      }, autoPlayInterval)
    }

    startAutoPlay()

    return () => {
      if (autoPlayTimerRef.current) {
        clearInterval(autoPlayTimerRef.current)
      }
    }
  }, [autoPlay, autoPlayInterval, images, goToNext])

  const pauseAutoPlay = () => {
    if (autoPlayTimerRef.current) {
      clearInterval(autoPlayTimerRef.current)
      autoPlayTimerRef.current = null
    }
  }

  const resumeAutoPlay = () => {
    if (autoPlay && images && images.length > 1) {
      if (autoPlayTimerRef.current) {
        clearInterval(autoPlayTimerRef.current)
      }
      autoPlayTimerRef.current = setInterval(() => {
        goToNext()
      }, autoPlayInterval)
    }
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        pauseAutoPlay()
        goToPrevious()
        resumeAutoPlay()
      }
      if (e.key === 'ArrowRight') {
        pauseAutoPlay()
        goToNext()
        resumeAutoPlay()
      }
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

  const isCurrentLoaded = loadedImages.has(currentIndex)
  const currentImageHasError = errorImages.has(currentIndex)

  return (
    <div
      className="carousel"
      onMouseEnter={pauseAutoPlay}
      onMouseLeave={resumeAutoPlay}
      style={{ position: 'relative' }}
    >
      {!isCurrentLoaded && (
        <div
          className="skeleton"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: `${height}px`,
            zIndex: 2,
            borderRadius: '0'
          }}
        />
      )}

      <div
        className="carousel-track"
        style={{
          transform: `translateX(-${currentIndex * 100}%)`,
          transition: isTransitioning
            ? 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
            : 'none'
        }}
      >
        {images.map((img, idx) => {
          const hasError = errorImages.has(idx)
          const isLoaded = loadedImages.has(idx)

          return (
            <div
              key={idx}
              style={{
                minWidth: '100%',
                height: `${height}px`,
                position: 'relative',
                overflow: 'hidden',
                background: 'var(--color-bg-warm)'
              }}
            >
              <img
                src={hasError ? DEFAULT_PLACEHOLDER : img}
                alt={`${alt} ${idx + 1}`}
                className="carousel-slide"
                style={{
                  height: `${height}px`,
                  opacity: isLoaded ? 1 : 0,
                  transition: 'opacity 0.5s ease',
                  transform: idx === currentIndex ? 'scale(1)' : 'scale(1.05)',
                  objectFit: hasError ? 'contain' : 'cover',
                  background: hasError ? 'var(--color-cream)' : 'var(--color-bg-warm)'
                }}
                loading="lazy"
                onLoad={() => handleImageLoad(idx)}
                onError={() => handleImageError(idx)}
                draggable={false}
              />
              {idx === currentIndex && isLoaded && (
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
                  animation: 'fadeInUp 0.5s ease',
                  zIndex: 10
                }}>
                  📷 {idx + 1} / {images.length}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {images.length > 1 && (
        <>
          <button
            className="carousel-btn prev"
            onClick={() => {
              pauseAutoPlay()
              goToPrevious()
              resumeAutoPlay()
            }}
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
            onClick={() => {
              pauseAutoPlay()
              goToNext()
              resumeAutoPlay()
            }}
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
                onClick={() => {
                  pauseAutoPlay()
                  goToSlide(idx)
                  resumeAutoPlay()
                }}
                style={{
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  if (idx !== currentIndex) {
                    (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.3)'
                    (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.8)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (idx !== currentIndex) {
                    (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)'
                    (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.5)'
                  }
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
