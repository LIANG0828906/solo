import { useRef, useEffect, useCallback } from 'react'
import type { Merchandise } from './App'

interface ShopCarouselProps {
  merchandise: Merchandise[]
  isMobile: boolean
}

function ShopCarousel({ merchandise, isMobile }: ShopCarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number | null>(null)
  const cardWidth = isMobile ? 160 : 200
  const cardGap = isMobile ? 12 : 16
  const galleryHeight = isMobile ? 140 : 180

  const easeOut = (t: number): number => {
    return 1 - Math.pow(1 - t, 3)
  }

  const smoothScroll = useCallback(
    (targetScroll: number) => {
      if (!scrollRef.current) return
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }

      const startScroll = scrollRef.current.scrollLeft
      const distance = targetScroll - startScroll
      const duration = 400
      let startTime: number | null = null

      const animate = (currentTime: number) => {
        if (startTime === null) startTime = currentTime
        const elapsed = currentTime - startTime
        const progress = Math.min(elapsed / duration, 1)
        const easedProgress = easeOut(progress)

        if (scrollRef.current) {
          scrollRef.current.scrollLeft = startScroll + distance * easedProgress
        }

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate)
        }
      }

      animationRef.current = requestAnimationFrame(animate)
    },
    [],
  )

  const scrollLeft = () => {
    if (!scrollRef.current) return
    const targetScroll = Math.max(0, scrollRef.current.scrollLeft - (cardWidth + cardGap))
    smoothScroll(targetScroll)
  }

  const scrollRight = () => {
    if (!scrollRef.current) return
    const maxScroll = scrollRef.current.scrollWidth - scrollRef.current.clientWidth
    const targetScroll = Math.min(maxScroll, scrollRef.current.scrollLeft + (cardWidth + cardGap))
    smoothScroll(targetScroll)
  }

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: `${galleryHeight}px`,
        background: 'rgba(11, 13, 23, 0.9)',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        alignItems: 'center',
        padding: `0 ${isMobile ? '12px' : '24px'}`,
        zIndex: 5,
        backdropFilter: 'blur(10px)',
      }}
    >
      <button
        onClick={scrollLeft}
        className="gallery-nav"
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.1)',
          border: 'none',
          color: '#ffffff',
          fontSize: '18px',
          cursor: 'pointer',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: isMobile ? '8px' : '12px',
        }}
      >
        ‹
      </button>

      <div
        ref={scrollRef}
        className="scrollbar-hide"
        style={{
          flex: 1,
          overflowX: 'auto',
          overflowY: 'hidden',
          display: 'flex',
          gap: `${cardGap}px`,
          scrollBehavior: 'auto',
          padding: '4px 2px',
        }}
      >
        {merchandise.map((item) => (
          <div
            key={item.id}
            style={{
              width: `${cardWidth}px`,
              minWidth: `${cardWidth}px`,
              background: '#1A1B3A',
              borderRadius: '12px',
              padding: isMobile ? '10px' : '12px',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)'
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.4), 0 0 16px rgba(255,107,53,0.15)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            <div
              style={{
                width: '100%',
                aspectRatio: '1 / 1',
                borderRadius: '8px',
                border: '1px dashed rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.03)',
                marginBottom: isMobile ? '8px' : '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  fontSize: isMobile ? '24px' : '32px',
                  opacity: 0.3,
                }}
              >
                ♪
              </div>
            </div>
            <div
              style={{
                fontSize: isMobile ? '11px' : '13px',
                fontWeight: 500,
                color: '#ffffff',
                marginBottom: '4px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {item.name}
            </div>
            <div
              style={{
                fontSize: isMobile ? '12px' : '14px',
                fontWeight: 700,
                color: '#FF6B35',
              }}
            >
              {item.price}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={scrollRight}
        className="gallery-nav"
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.1)',
          border: 'none',
          color: '#ffffff',
          fontSize: '18px',
          cursor: 'pointer',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginLeft: isMobile ? '8px' : '12px',
        }}
      >
        ›
      </button>
    </div>
  )
}

export default ShopCarousel
