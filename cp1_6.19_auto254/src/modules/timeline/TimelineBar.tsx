import { useRef, useState, useCallback, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useJourneyStore } from '@/store/useJourneyStore'

function formatTimestamp(date: Date | null): string {
  if (!date) return '未知'
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const h = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')
  return `${y}/${m}/${d} ${h}:${min}`
}

function getColorForProgress(progress: number): string {
  const r1 = 0x00, g1 = 0xc4, b1 = 0xff
  const r2 = 0x7b, g2 = 0x2f, b2 = 0xf7
  const r = Math.round(r1 + (r2 - r1) * progress)
  const g = Math.round(g1 + (g2 - g1) * progress)
  const b = Math.round(b1 + (b2 - b1) * progress)
  return `rgb(${r}, ${g}, ${b})`
}

export function TimelineBar() {
  const trackRef = useRef<HTMLDivElement>(null)
  const {
    photos,
    highlightedPhotoId,
    highlightPhoto,
    isRoaming,
    setRoaming,
    roamingSpeed,
    setRoamingSpeed
  } = useJourneyStore()

  const [isDragging, setIsDragging] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(-1)

  const photosWithGPS = useMemo(
    () => photos.filter((p) => p.hasGPS),
    [photos]
  )

  const sortedPhotos = useMemo(() => {
    return [...photosWithGPS].sort((a, b) => {
      if (!a.timestamp && !b.timestamp) return 0
      if (!a.timestamp) return 1
      if (!b.timestamp) return -1
      return a.timestamp.getTime() - b.timestamp.getTime()
    })
  }, [photosWithGPS])

  const getIndexFromPosition = useCallback(
    (clientX: number): number => {
      if (!trackRef.current || sortedPhotos.length === 0) return -1
      const rect = trackRef.current.getBoundingClientRect()
      const padding = 24
      const trackWidth = rect.width - padding * 2
      const x = Math.max(0, Math.min(trackWidth, clientX - rect.left - padding))
      const ratio = x / trackWidth
      const idx = Math.round(ratio * (sortedPhotos.length - 1))
      return Math.max(0, Math.min(sortedPhotos.length - 1, idx))
    },
    [sortedPhotos]
  )

  const handleDragStart = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (sortedPhotos.length === 0) return
      setIsDragging(true)
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
      const idx = getIndexFromPosition(clientX)
      if (idx >= 0) {
        setCurrentIndex(idx)
        highlightPhoto(sortedPhotos[idx].id)
      }
    },
    [getIndexFromPosition, sortedPhotos, highlightPhoto]
  )

  useEffect(() => {
    if (!isDragging) return

    const handleMove = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
      const idx = getIndexFromPosition(clientX)
      if (idx >= 0 && idx !== currentIndex) {
        setCurrentIndex(idx)
        highlightPhoto(sortedPhotos[idx].id)
      }
    }

    const handleEnd = () => {
      setIsDragging(false)
    }

    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleEnd)
    window.addEventListener('touchmove', handleMove)
    window.addEventListener('touchend', handleEnd)

    return () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleEnd)
      window.removeEventListener('touchmove', handleMove)
      window.removeEventListener('touchend', handleEnd)
    }
  }, [isDragging, getIndexFromPosition, sortedPhotos, highlightPhoto, currentIndex])

  useEffect(() => {
    if (highlightedPhotoId) {
      const idx = sortedPhotos.findIndex((p) => p.id === highlightedPhotoId)
      if (idx !== -1) setCurrentIndex(idx)
    }
  }, [highlightedPhotoId, sortedPhotos])

  useEffect(() => {
    if (!isRoaming || sortedPhotos.length === 0) return

    const baseDelay = 3000
    const delay = baseDelay / roamingSpeed
    let idx = currentIndex >= 0 ? currentIndex : 0

    highlightPhoto(sortedPhotos[idx].id)

    const timer = setInterval(() => {
      idx++
      if (idx >= sortedPhotos.length) {
        idx = 0
      }
      setCurrentIndex(idx)
      highlightPhoto(sortedPhotos[idx].id)
    }, delay)

    return () => clearInterval(timer)
  }, [isRoaming, sortedPhotos, roamingSpeed, highlightPhoto, currentIndex])

  const progress =
    sortedPhotos.length > 1
      ? currentIndex >= 0
        ? currentIndex / (sortedPhotos.length - 1)
        : 0
      : 0

  const activePhoto = currentIndex >= 0 ? sortedPhotos[currentIndex] : null

  return (
    <div
      style={{
        backgroundColor: '#161B22',
        borderTop: '1px solid #30363D',
        padding: '16px 24px 20px'
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <AnimatePresence mode="wait">
            {activePhoto && (
              <motion.div
                key={activePhoto.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.2 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  backgroundColor: '#21262D'
                }}
              >
                <img
                  src={activePhoto.thumbnailUrl}
                  alt=""
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '4px',
                    objectFit: 'cover'
                  }}
                />
                <div>
                  <div style={{ fontSize: '12px', color: '#C9D1D9', fontWeight: 500 }}>
                    {activePhoto.file.name}
                  </div>
                  <div style={{ fontSize: '11px', color: '#8B949E' }}>
                    {formatTimestamp(activePhoto.timestamp)}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              display: 'flex',
              backgroundColor: '#21262D',
              borderRadius: '8px',
              padding: '2px',
              gap: '2px'
            }}
          >
            {[0.5, 1, 2].map((speed) => (
              <motion.button
                key={speed}
                onClick={() => setRoamingSpeed(speed as 0.5 | 1 | 2)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: 600,
                  backgroundColor: roamingSpeed === speed ? '#1F6FEB' : 'transparent',
                  color: roamingSpeed === speed ? '#fff' : '#8B949E',
                  transition: 'all 100ms ease'
                }}
                whileHover={{ backgroundColor: roamingSpeed === speed ? '#1F6FEB' : '#30363D' }}
                whileTap={{ scale: 0.95 }}
              >
                {speed}x
              </motion.button>
            ))}
          </div>

          <motion.button
            onClick={() => setRoaming(!isRoaming)}
            disabled={sortedPhotos.length < 2}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              cursor: sortedPhotos.length < 2 ? 'not-allowed' : 'pointer',
              fontSize: '13px',
              fontWeight: 600,
              background:
                sortedPhotos.length < 2
                  ? '#21262D'
                  : isRoaming
                  ? 'linear-gradient(135deg, #F85149, #DA3633)'
                  : 'linear-gradient(135deg, #00C4FF, #7B2FF7)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              opacity: sortedPhotos.length < 2 ? 0.5 : 1,
              transition: 'all 100ms ease',
              boxShadow: isRoaming
                ? '0 4px 12px rgba(248, 81, 73, 0.3)'
                : '0 4px 12px rgba(0, 196, 255, 0.2)'
            }}
            whileHover={sortedPhotos.length >= 2 ? { scale: 1.02 } : {}}
            whileTap={sortedPhotos.length >= 2 ? { scale: 0.98 } : {}}
          >
            <span>{isRoaming ? '⏸' : '▶'}</span>
            {isRoaming ? '暂停漫游' : '全景漫游'}
          </motion.button>
        </div>
      </div>

      <div
        ref={trackRef}
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
        style={{
          position: 'relative',
          height: '48px',
          padding: '0 24px',
          cursor: sortedPhotos.length > 0 ? (isDragging ? 'grabbing' : 'grab') : 'default',
          userSelect: 'none'
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: '24px',
            right: '24px',
            top: '50%',
            height: '4px',
            transform: 'translateY(-50%)',
            backgroundColor: '#30363D',
            borderRadius: '2px',
            overflow: 'hidden'
          }}
        >
          <motion.div
            initial={false}
            animate={{
              width: `${progress * 100}%`,
              background: `linear-gradient(90deg, #00C4FF, #7B2FF7)`
            }}
            transition={{ duration: isDragging ? 0.05 : 0.3, ease: 'easeOut' }}
            style={{
              height: '100%',
              borderRadius: '2px'
            }}
          />
        </div>

        {sortedPhotos.map((photo, idx) => {
          const p = sortedPhotos.length > 1 ? idx / (sortedPhotos.length - 1) : 0
          const dotColor = getColorForProgress(p)
          const isActive = idx === currentIndex
          return (
            <div
              key={photo.id}
              style={{
                position: 'absolute',
                left: `calc(${p * 100}% + 24px - 4px)`,
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: isActive ? 3 : 1
              }}
            >
              <motion.div
                animate={{
                  width: isActive ? '16px' : '8px',
                  height: isActive ? '16px' : '8px',
                  left: isActive ? '-4px' : '0px',
                  top: isActive ? '-4px' : '0px',
                  backgroundColor: isActive ? '#fff' : dotColor,
                  boxShadow: isActive
                    ? `0 0 0 3px ${dotColor}80, 0 2px 8px ${dotColor}40`
                    : `0 0 0 2px #161B22`
                }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                style={{
                  position: 'relative',
                  borderRadius: '50%',
                  cursor: 'pointer'
                }}
              />
              {isActive && (
                <motion.div
                  initial={{ scale: 1, opacity: 0.5 }}
                  animate={{ scale: 2.5, opacity: 0 }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: 'easeOut' }}
                  style={{
                    position: 'absolute',
                    left: '-4px',
                    top: '-4px',
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    border: `2px solid ${dotColor}`
                  }}
                />
              )}
            </div>
          )
        })}

        {currentIndex >= 0 && (
          <motion.div
            initial={false}
            animate={{
              left: `calc(${progress * 100}% + 24px - 14px)`,
              backgroundColor: getColorForProgress(progress)
            }}
            transition={{ type: 'spring', stiffness: 400, damping: isDragging ? 25 : 35 }}
            style={{
              position: 'absolute',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              cursor: isDragging ? 'grabbing' : 'grab',
              zIndex: 10,
              boxShadow: `0 2px 8px rgba(0,0,0,0.5), 0 0 0 4px #161B22`
            }}
          >
            <div
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: '#fff'
              }}
            />
          </motion.div>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          padding: '0 24px',
          marginTop: '4px'
        }}
      >
        <span style={{ fontSize: '10px', color: '#6E7681' }}>
          {sortedPhotos.length > 0 ? formatTimestamp(sortedPhotos[0].timestamp) : '—'}
        </span>
        <span style={{ fontSize: '10px', color: '#6E7681' }}>
          {sortedPhotos.length > 1
            ? formatTimestamp(sortedPhotos[sortedPhotos.length - 1].timestamp)
            : '—'}
        </span>
      </div>
    </div>
  )
}
