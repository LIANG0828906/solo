import React, { useRef, useEffect, useState, useCallback } from 'react'
import { useGalleryStore } from './store'

const Gallery: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const viewportWidth = useRef(window.innerWidth)

  const images = useGalleryStore((s) => s.images)
  const currentIndex = useGalleryStore((s) => s.currentIndex)
  const scale = useGalleryStore((s) => s.scale)
  const rotation = useGalleryStore((s) => s.rotation)
  const deletedIds = useGalleryStore((s) => s.deletedIds)
  const filterActive = useGalleryStore((s) => s.filterActive)
  const translateX = useGalleryStore((s) => s.translateX)
  const swipeOpacity = useGalleryStore((s) => s.swipeOpacity)
  const transitioning = useGalleryStore((s) => s.transitioning)

  const setScale = useGalleryStore((s) => s.setScale)
  const setRotation = useGalleryStore((s) => s.setRotation)
  const setTranslateX = useGalleryStore((s) => s.setTranslateX)
  const setSwipeOpacity = useGalleryStore((s) => s.setSwipeOpacity)
  const setCurrentIndex = useGalleryStore((s) => s.setCurrentIndex)
  const setTransitioning = useGalleryStore((s) => s.setTransitioning)
  const addImages = useGalleryStore((s) => s.addImages)
  const markImageLoaded = useGalleryStore((s) => s.markImageLoaded)

  const [showScaleLabel, setShowScaleLabel] = useState(false)
  const [showRotationLabel, setShowRotationLabel] = useState(false)

  const gestureMode = useRef<'none' | 'swipe' | 'pinch'>('none')
  const startX = useRef(0)
  const startY = useRef(0)
  const startDistance = useRef(0)
  const startAngle = useRef(0)
  const startScale = useRef(1)
  const startRotation = useRef(0)
  const startCenter = useRef({ x: 0, y: 0 })
  const lastTouchTime = useRef(0)
  const longPressTimer = useRef<number | null>(null)

  const visibleImages = images.filter((img) => !deletedIds.has(img.id))

  useEffect(() => {
    const updateWidth = () => {
      viewportWidth.current = window.innerWidth
    }
    window.addEventListener('resize', updateWidth)
    return () => window.removeEventListener('resize', updateWidth)
  }, [])

  const getDistance = (t1: React.Touch, t2: React.Touch) => {
    const dx = t2.clientX - t1.clientX
    const dy = t2.clientY - t1.clientY
    return Math.sqrt(dx * dx + dy * dy)
  }

  const getAngle = (t1: React.Touch, t2: React.Touch) => {
    return Math.atan2(t2.clientY - t1.clientY, t2.clientX - t1.clientX) * (180 / Math.PI)
  }

  const getCenter = (t1: React.Touch, t2: React.Touch) => ({
    x: (t1.clientX + t2.clientX) / 2,
    y: (t1.clientY + t2.clientY) / 2
  })

  const loadAdjacentImages = useCallback(
    (index: number) => {
      const loadIndices = [index - 1, index, index + 1, index + 2]
      loadIndices.forEach((i) => {
        const clamped = ((i % visibleImages.length) + visibleImages.length) % visibleImages.length
        const img = visibleImages[clamped]
        if (img && !img.loaded) {
          const preload = new Image()
          preload.onload = () => markImageLoaded(img.id)
          preload.src = img.url
        }
      })
    },
    [visibleImages, markImageLoaded]
  )

  useEffect(() => {
    if (visibleImages.length > 0) {
      loadAdjacentImages(currentIndex)
    }
  }, [currentIndex, visibleImages.length, loadAdjacentImages])

  const animateTransition = useCallback(
    (direction: number) => {
      if (transitioning) return
      setTransitioning(true)
      const vw = viewportWidth.current
      const targetX = direction * -vw
      setTranslateX(targetX)
      setSwipeOpacity(0.3)

      window.setTimeout(() => {
        setCurrentIndex(currentIndex + direction)
        setTranslateX(0)
        setSwipeOpacity(1)
        window.setTimeout(() => {
          setTransitioning(false)
        }, 250)
      }, 250)
    },
    [currentIndex, setCurrentIndex, setTranslateX, setSwipeOpacity, transitioning, setTransitioning]
  )

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (visibleImages.length === 0) return
      lastTouchTime.current = Date.now()

      if (e.touches.length === 1) {
        gestureMode.current = 'swipe'
        startX.current = e.touches[0].clientX
        startY.current = e.touches[0].clientY

        longPressTimer.current = window.setTimeout(() => {
          gestureMode.current = 'none'
        }, 500)
      } else if (e.touches.length === 2) {
        if (longPressTimer.current) {
          window.clearTimeout(longPressTimer.current)
          longPressTimer.current = null
        }
        gestureMode.current = 'pinch'
        startDistance.current = getDistance(e.touches[0], e.touches[1])
        startAngle.current = getAngle(e.touches[0], e.touches[1])
        startScale.current = scale
        startRotation.current = rotation
        startCenter.current = getCenter(e.touches[0], e.touches[1])
        setShowScaleLabel(true)
        setShowRotationLabel(true)
      }
    },
    [visibleImages.length, scale, rotation]
  )

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (visibleImages.length === 0) return
      e.preventDefault()

      if (gestureMode.current === 'swipe' && e.touches.length === 1 && scale === 1 && rotation === 0) {
        const dx = e.touches[0].clientX - startX.current
        const dy = e.touches[0].clientY - startY.current
        if (Math.abs(dx) > Math.abs(dy)) {
          if (longPressTimer.current) {
            window.clearTimeout(longPressTimer.current)
            longPressTimer.current = null
          }
          setTranslateX(dx)
          const opacityDelta = Math.abs(dx) / viewportWidth.current
          setSwipeOpacity(1 - opacityDelta * 0.2)
        }
      } else if (gestureMode.current === 'pinch' && e.touches.length === 2) {
        const currentDistance = getDistance(e.touches[0], e.touches[1])
        const currentAngle = getAngle(e.touches[0], e.touches[1])
        const newScale = startScale.current * (currentDistance / startDistance.current)
        const newRotation = startRotation.current + (currentAngle - startAngle.current)
        setScale(newScale)
        setRotation(newRotation)
      }
    },
    [visibleImages.length, scale, rotation, setTranslateX, setSwipeOpacity, setScale, setRotation]
  )

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (longPressTimer.current) {
        window.clearTimeout(longPressTimer.current)
        longPressTimer.current = null
      }

      if (gestureMode.current === 'swipe' && e.touches.length === 0) {
        const vw = viewportWidth.current
        if (translateX > vw * 0.5) {
          animateTransition(-1)
        } else if (translateX < -vw * 0.5) {
          animateTransition(1)
        } else {
          setTransitioning(true)
          setTranslateX(0)
          setSwipeOpacity(1)
          window.setTimeout(() => setTransitioning(false), 250)
        }
      } else if (gestureMode.current === 'pinch' && e.touches.length < 2) {
        gestureMode.current = 'none'
        const hideTimer = window.setTimeout(() => {
          setShowScaleLabel(false)
          setShowRotationLabel(false)
        }, 800)
        return () => window.clearTimeout(hideTimer)
      }
    },
    [translateX, animateTransition, setTranslateX, setSwipeOpacity, setTransitioning]
  )

  const handlePlaceholderClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addImages(e.target.files)
      e.target.value = ''
    }
  }

  if (visibleImages.length === 0) {
    return (
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 40,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#1E1E24',
          cursor: 'pointer'
        }}
        onClick={handlePlaceholderClick}
      >
        <div
          style={{
            width: 60,
            height: 60,
            borderRadius: '50%',
            background: '#555',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16
          }}
        >
          <span style={{ color: '#FFF', fontSize: 32, lineHeight: 1, fontWeight: 300 }}>+</span>
        </div>
        <span style={{ color: '#FFF', fontSize: 16, lineHeight: '24px' }}>点击添加图片</span>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </div>
    )
  }

  const currentImg = visibleImages[currentIndex]

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 40,
        background: '#1E1E24',
        overflow: 'hidden'
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: '100%',
          maxWidth: '100vw',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: `translate(-50%, -50%) translateX(${translateX}px)`,
          transition: transitioning ? 'transform 250ms ease-out, opacity 250ms ease-out' : 'none',
          opacity: swipeOpacity,
          willChange: 'transform, opacity'
        }}
      >
        {currentImg && (
          <img
            src={currentImg.url}
            alt=""
            draggable={false}
            loading="lazy"
            onLoad={() => markImageLoaded(currentImg.id)}
            style={{
              maxWidth: '100%',
              maxHeight: 'calc(100vh - 40px)',
              objectFit: 'contain',
              transform: `scale3d(${scale}, ${scale}, 1) rotate(${rotation}deg)`,
              transformOrigin: 'center center',
              transition:
                gestureMode.current === 'none' || transitioning
                  ? 'transform 250ms ease-out'
                  : 'none',
              filter: filterActive ? 'grayscale(60%)' : 'none',
              willChange: 'transform',
              pointerEvents: 'none'
            }}
          />
        )}
      </div>

      {showScaleLabel && (
        <div
          style={{
            position: 'absolute',
            top: 12,
            left: 12,
            fontSize: 12,
            color: '#FFF',
            background: 'rgba(0, 0, 0, 0.5)',
            padding: '4px 8px',
            borderRadius: 4,
            pointerEvents: 'none'
          }}
        >
          {scale.toFixed(2)}x
        </div>
      )}

      {showRotationLabel && (
        <div
          style={{
            position: 'absolute',
            top: 12,
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: 12,
            color: '#FFF',
            background: 'rgba(0, 0, 0, 0.5)',
            padding: '4px 8px',
            borderRadius: 4,
            pointerEvents: 'none'
          }}
        >
          {rotation.toFixed(1)}°
        </div>
      )}

      {filterActive && (
        <div
          style={{
            position: 'absolute',
            bottom: 8,
            right: 12,
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: '#4A90D9',
            boxShadow: '0 0 8px rgba(74, 144, 217, 0.6)'
          }}
        />
      )}
    </div>
  )
}

export default Gallery
