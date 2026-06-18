import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface TimelineProps {
  yearList: number[]
  selectedYear: number
  onSelect: (year: number) => void
  getYearMemoryCount: (year: number) => number
}

type ScaleLevel = 'compact' | 'normal' | 'expanded'

const scaleConfig: Record<ScaleLevel, { gap: number; labelSize: number }> = {
  compact: { gap: 50, labelSize: 14 },
  normal: { gap: 80, labelSize: 18 },
  expanded: { gap: 120, labelSize: 22 }
}

function Timeline({ yearList, selectedYear, onSelect, getYearMemoryCount }: TimelineProps) {
  const [scale, setScale] = useState<ScaleLevel>('normal')
  const [isDragging, setIsDragging] = useState(false)
  const [dragStartY, setDragStartY] = useState(0)
  const [scrollStartY, setScrollStartY] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    if (containerRef.current && trackRef.current) {
      const selectedIndex = yearList.indexOf(selectedYear)
      const gap = scaleConfig[scale].gap
      const targetScroll = Math.max(0, selectedIndex * gap - (isMobile ? window.innerWidth / 2 : 200))
      
      if (isMobile) {
        containerRef.current.scrollTo({
          left: targetScroll,
          behavior: 'smooth'
        })
      } else {
        containerRef.current.scrollTo({
          top: targetScroll,
          behavior: 'smooth'
        })
      }
    }
  }, [selectedYear, yearList, scale, isMobile])

  const handleDragStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!containerRef.current) return
    setIsDragging(true)
    
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    
    setDragStartY(isMobile ? clientX : clientY)
    setScrollStartY(isMobile ? containerRef.current.scrollLeft : containerRef.current.scrollTop)
  }, [isMobile])

  const handleDragMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging || !containerRef.current) return
    
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    
    const delta = (isMobile ? clientX : clientY) - dragStartY
    const newScroll = scrollStartY - delta
    
    if (isMobile) {
      containerRef.current.scrollLeft = newScroll
    } else {
      containerRef.current.scrollTop = newScroll
    }
  }, [isDragging, dragStartY, scrollStartY, isMobile])

  const handleDragEnd = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (!containerRef.current) return
    
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
      const scales: ScaleLevel[] = ['compact', 'normal', 'expanded']
      const currentIndex = scales.indexOf(scale)
      const newIndex = Math.max(0, Math.min(2, currentIndex + (e.deltaY > 0 ? 1 : -1)))
      setScale(scales[newIndex])
    }
  }, [scale])

  const handleYearClick = useCallback((year: number) => {
    if (!isDragging) {
      onSelect(year)
    }
  }, [onSelect, isDragging])

  const visibleYears = useMemo(() => {
    return yearList.map(year => ({
      year,
      count: getYearMemoryCount(year)
    }))
  }, [yearList, getYearMemoryCount])

  const scaleLabels: Record<ScaleLevel, string> = {
    compact: '紧凑',
    normal: '标准',
    expanded: '宽松'
  }

  return (
    <>
      <div className="timeline-scale-controls">
        {(['compact', 'normal', 'expanded'] as ScaleLevel[]).map(s => (
          <button
            key={s}
            className={`scale-btn ${scale === s ? 'active' : ''}`}
            onClick={() => setScale(s)}
          >
            {scaleLabels[s]}
          </button>
        ))}
      </div>
      
      <div
        ref={containerRef}
        className="timeline-track"
        onMouseDown={handleDragStart}
        onMouseMove={handleDragMove}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
        onTouchStart={handleDragStart}
        onTouchMove={handleDragMove}
        onTouchEnd={handleDragEnd}
        onWheel={handleWheel}
        style={{
          cursor: isDragging ? (isMobile ? 'grabbing' : 'grabbing') : (isMobile ? 'grab' : 'grab'),
          ...(isMobile ? { paddingLeft: 0, paddingRight: 0 } : {})
        }}
      >
        <div className="timeline-line" />
        
        <div
          ref={trackRef}
          style={{
            display: isMobile ? 'flex' : 'block',
            alignItems: isMobile ? 'center' : undefined,
            paddingLeft: isMobile ? '40px' : undefined,
            paddingRight: isMobile ? '40px' : undefined
          }}
        >
          <AnimatePresence initial={false}>
            {visibleYears.map(({ year, count }) => (
              <motion.div
                key={year}
                className={`year-card ${selectedYear === year ? 'selected' : ''}`}
                onClick={() => handleYearClick(year)}
                initial={{ opacity: 0, y: isMobile ? 0 : 20, x: isMobile ? 20 : 0 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  x: 0,
                  height: isMobile ? 'auto' : scaleConfig[scale].gap,
                  fontSize: scaleConfig[scale].labelSize
                }}
                exit={{ opacity: 0 }}
                transition={{
                  type: 'spring',
                  stiffness: 300,
                  damping: 30,
                  mass: 0.8
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <motion.div
                  className="year-dot"
                  animate={{
                    scale: selectedYear === year ? [1, 1.2, 1] : 1
                  }}
                  transition={{
                    duration: 0.5,
                    ease: 'easeInOut'
                  }}
                />
                <span className="year-label">{year}</span>
                {count > 0 && (
                  <motion.span
                    className="year-count"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    {count}
                  </motion.span>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </>
  )
}

export default Timeline
