import { useState, useEffect, useRef } from 'react'

interface LazyImageProps {
  src: string
  alt: string
  className?: string
  style?: React.CSSProperties
}

function LazyImage({ src, alt, className = '', style }: LazyImageProps) {
  const [loaded, setLoaded] = useState(false)
  const [inView, setInView] = useState(false)
  const imgRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!imgRef.current) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )
    observer.observe(imgRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={imgRef} className={`lazy-image-wrapper ${className}`} style={{ position: 'relative', ...style }}>
      {!loaded && <div className="image-placeholder" style={{ position: 'absolute', inset: 0 }} />}
      {inView && (
        <img
          src={src}
          alt={alt}
          className={`lazy-image ${loaded ? 'loaded' : ''} ${className}`}
          onLoad={() => setLoaded(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      )}
    </div>
  )
}

export default LazyImage
