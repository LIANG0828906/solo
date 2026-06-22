import { useEffect, useRef, useState, useCallback } from 'react'
import PhotoCard from './PhotoCard'
import type { Photo } from '../data/photos'
import type { FlipState } from '../store/usePhotoStore'

interface AlbumPageProps {
  photos: Photo[]
  currentIndex: number
  totalPages: number
  flipState: FlipState
  onFlipComplete: () => void
  onNext: () => void
  onPrev: () => void
  isFullscreen: boolean
}

type AnimationPhase = 'idle' | 'out-going' | 'in-coming'

export default function AlbumPage({
  photos,
  currentIndex,
  totalPages,
  flipState,
  onFlipComplete,
  onNext,
  onPrev,
  isFullscreen
}: AlbumPageProps) {
  const [displayIndex, setDisplayIndex] = useState(currentIndex)
  const [nextIndex, setNextIndex] = useState<number | null>(null)
  const [phase, setPhase] = useState<AnimationPhase>('idle')
  const [animationKey, setAnimationKey] = useState(0)
  const animFrameRef = useRef<number | null>(null)
  const startTimeRef = useRef<number>(0)
  const FLIP_DURATION = 600
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)
  const isMobileRef = useRef(false)

  useEffect(() => {
    isMobileRef.current = window.matchMedia('(max-width: 768px)').matches
    const handler = () => {
      isMobileRef.current = window.matchMedia('(max-width: 768px)').matches
    }
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  const finishAnimation = useCallback(() => {
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current)
      animFrameRef.current = null
    }
    if (nextIndex !== null) {
      setDisplayIndex(nextIndex)
    }
    setNextIndex(null)
    setPhase('idle')
    setAnimationKey((k) => k + 1)
    onFlipComplete()
  }, [nextIndex, onFlipComplete])

  useEffect(() => {
    if (!flipState.isFlipping) return

    const targetIndex = flipState.direction === 'left'
      ? Math.min(currentIndex + 1, totalPages - 1)
      : Math.max(currentIndex - 1, 0)

    if (targetIndex === currentIndex) {
      onFlipComplete()
      return
    }

    setNextIndex(targetIndex)
    setPhase('out-going')
    startTimeRef.current = performance.now()

    const animate = (now: number) => {
      const elapsed = now - startTimeRef.current
      const progress = Math.min(elapsed / FLIP_DURATION, 1)

      if (progress >= 0.5 && phase === 'out-going') {
        setPhase('in-coming')
        setDisplayIndex(targetIndex)
      }

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animate)
      } else {
        finishAnimation()
      }
    }

    animFrameRef.current = requestAnimationFrame(animate)

    return () => {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current)
      }
    }
  }, [flipState.isFlipping, flipState.direction, currentIndex, totalPages, onFlipComplete, finishAnimation, phase])

  useEffect(() => {
    if (!flipState.isFlipping) {
      setDisplayIndex(currentIndex)
    }
  }, [currentIndex, flipState.isFlipping])

  const getPageClasses = (): string[] => {
    const classes: string[] = []

    if (phase !== 'idle' && flipState.direction) {
      if (phase === 'out-going') {
        classes.push(flipState.direction === 'left' ? 'flipping-out-left' : 'flipping-out-right')
      } else if (phase === 'in-coming') {
        classes.push(flipState.direction === 'left' ? 'flipping-in-right' : 'flipping-in-left')
      }
    }

    return classes
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isMobileRef.current || phase !== 'idle') return
    const touch = e.touches[0]
    touchStartRef.current = { x: touch.clientX, y: touch.clientY }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isMobileRef.current || !touchStartRef.current || phase !== 'idle') return

    const touch = e.changedTouches[0]
    const deltaX = touch.clientX - touchStartRef.current.x
    const deltaY = touch.clientY - touchStartRef.current.y

    if (Math.abs(deltaX) > 60 && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX < 0) {
        onNext()
      } else {
        onPrev()
      }
    }

    touchStartRef.current = null
  }

  const currentPhoto = photos[displayIndex]
  if (!currentPhoto) return null

  return (
    <div
      className="flip-container"
      style={{ paddingBottom: isFullscreen ? '24px' : undefined }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div
        key={`page-${displayIndex}-${animationKey}`}
        className={`album-page ${getPageClasses().join(' ')}`}
      >
        <div className="page-inner">
          <div className="page-number">
            {currentIndex + 1}/{totalPages}
          </div>

          <div className="photo-wrapper">
            <PhotoCard
              photo={currentPhoto}
              positionSeed={displayIndex}
            />
          </div>

          {currentIndex < totalPages - 1 && phase === 'idle' && (
            <div
              className="click-zone next"
              onClick={onNext}
              aria-label="下一页"
            />
          )}

          {currentIndex > 0 && phase === 'idle' && (
            <div
              className="click-zone prev"
              onClick={onPrev}
              aria-label="上一页"
            />
          )}
        </div>
      </div>
    </div>
  )
}
