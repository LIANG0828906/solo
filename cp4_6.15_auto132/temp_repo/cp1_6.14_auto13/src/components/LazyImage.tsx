import { useState, useEffect, useRef } from 'react'

interface LazyImageProps {
  src: string
  alt: string
  className?: string
  style?: React.CSSProperties
  placeholderStyle?: React.CSSProperties
}

let observerInstance: IntersectionObserver | null = null
const callbackMap = new WeakMap<Element, () => void>()

function getSharedObserver(): IntersectionObserver {
  if (!observerInstance && typeof window !== 'undefined' && 'IntersectionObserver' in window) {
    observerInstance = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const callback = callbackMap.get(entry.target)
            if (callback) {
              callback()
              callbackMap.delete(entry.target)
              observerInstance?.unobserve(entry.target)
            }
          }
        })
      },
      {
        rootMargin: '150px 0px',
        threshold: 0.01
      }
    )
  }
  return observerInstance as IntersectionObserver
}

function LazyImage({ src, alt, className = '', style, placeholderStyle }: LazyImageProps) {
  const [loaded, setLoaded] = useState(false)
  const [inView, setInView] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return
    const el = containerRef.current

    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      setInView(true)
      return
    }

    const observer = getSharedObserver()
    callbackMap.set(el, () => setInView(true))
    observer.observe(el)

    return () => {
      callbackMap.delete(el)
      observer.unobserve(el)
    }
  }, [])

  return (
    <div
      ref={containerRef}
      style={{ position: 'relative', overflow: 'hidden', ...style }}
    >
      {!loaded && (
        <div
          className="image-placeholder"
          style={{ position: 'absolute', inset: 0, ...placeholderStyle }}
        />
      )}
      {inView && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          className={`lazy-image ${loaded ? 'loaded' : ''} ${className}`}
          onLoad={() => setLoaded(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      )}
    </div>
  )
}

export default LazyImage
