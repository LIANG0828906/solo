import { useState } from 'react'

interface ImageCarouselProps {
  images: string[]
  alt?: string
  height?: number
}

export default function ImageCarousel({ images, alt = '', height = 400 }: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  const goToPrevious = () => {
    setCurrentIndex(prev => (prev === 0 ? images.length - 1 : prev - 1))
  }

  const goToNext = () => {
    setCurrentIndex(prev => (prev === images.length - 1 ? 0 : prev + 1))
  }

  return (
    <div className="carousel">
      <div
        className="carousel-track"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {images.map((img, idx) => (
          <img
            key={idx}
            src={img}
            alt={`${alt} ${idx + 1}`}
            className="carousel-slide"
            style={{ height: `${height}px` }}
            loading="lazy"
          />
        ))}
      </div>

      {images.length > 1 && (
        <>
          <button
            className="carousel-btn prev"
            onClick={goToPrevious}
            aria-label="上一张"
          >
            ‹
          </button>
          <button
            className="carousel-btn next"
            onClick={goToNext}
            aria-label="下一张"
          >
            ›
          </button>
          <div className="carousel-dots">
            {images.map((_, idx) => (
              <div
                key={idx}
                className={`carousel-dot ${idx === currentIndex ? 'active' : ''}`}
                onClick={() => setCurrentIndex(idx)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
