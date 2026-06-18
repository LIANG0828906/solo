import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface TimelineProps {
  yearList: number[]
  selectedYear: number
  onSelect: (year: number) => void
  getYearMemoryCount: (year: number) => number
  onYearRangeChange?: (minYear: number, maxYear: number) => void
}

const MIN_SCALE = 0.5
const MAX_SCALE = 2
const BASE_GAP = 80
const SCROLL_THRESHOLD = 100
const EXTEND_YEARS = 5

function Timeline({ yearList, selectedYear, onSelect, getYearMemoryCount }: TimelineProps) {
  const [scale, setScale] = useState(1)
  const [isDragging, setIsDragging] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [visibleRange, setVisibleRange] = useState<[number, number]>([0, yearList.length - 1])
  const containerRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const dragStartRef = useRef(0)
  const scrollStartRef = useRef(0)
  const animationFrameRef = useRef<number | null>(null)
  const lastScrollRef = useRef(0)
  const yearsRef = useRef<number[]>([...yearList])

  useEffect(() => {
    yearsRef.current = [...yearList]
  }, [yearList])

  const currentGap = useMemo(() => BASE_GAP * scale, [scale])

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    if (containerRef.current && trackRef.current) {
      const selectedIndex = yearsRef.current.indexOf(selectedYear)
      const targetScroll = Math.max(0, selectedIndex * currentGap - (isMobile ? window.innerWidth / 2 : 200))
      
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
  }, [selectedYear, currentGap, isMobile])

  const updateVisibleRange = useCallback(() => {
    if (!containerRef.current) return
    
    const container = containerRef.current
    const scrollPos = isMobile ? container.scrollLeft : container.scrollTop
    const containerSize = isMobile ? container.clientWidth : container.clientHeight
    const totalSize = yearsRef.current.length * currentGap
    
    const startIndex = Math.max(0, Math.floor(scrollPos / currentGap) - 2)
    const endIndex = Math.min(yearsRef.current.length - 1, Math.ceil((scrollPos + containerSize) / currentGap) + 2)
    
    setVisibleRange([startIndex, endIndex])
    
    if (scrollPos < SCROLL_THRESHOLD && startIndex === 0) {
      const minYear = Math.min(...yearsRef.current)
      const newYears: number[] = []
      for (let y = minYear - EXTEND_YEARS; y < minYear; y++) {
        newYears.push(y)
      }
      yearsRef.current = [...newYears, ...yearsRef.current]
      if (containerRef.current) {
        if (isMobile) {
          containerRef.current.scrollLeft += EXTEND_YEARS * currentGap
        } else {
          containerRef.current.scrollTop += EXTEND_YEARS * currentGap
        }
      }
    }
    
    if (totalSize - scrollPos - containerSize < SCROLL_THRESHOLD && endIndex === yearsRef.current.length - 1) {
      const maxYear = Math.max(...yearsRef.current)
      const newYears: number[] = []
      for (let y = maxYear + 1; y <= maxYear + EXTEND_YEARS; y++) {
        newYears.push(y)
      }
      yearsRef.current = [...yearsRef.current, ...newYears]
    }
  }, [currentGap, isMobile])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleScroll = () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      animationFrameRef.current = requestAnimationFrame(() => {
        updateVisibleRange()
        animationFrameRef.current = null
      })
    }

    container.addEventListener('scroll', handleScroll, { passive: true })
    updateVisibleRange()
    
    return () => {
      container.removeEventListener('scroll', handleScroll)
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [updateVisibleRange])

  const handleDragStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!containerRef.current) return
    setIsDragging(true)
    
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    
    dragStartRef.current = isMobile ? clientX : clientY
    scrollStartRef.current = isMobile ? containerRef.current.scrollLeft : containerRef.current.scrollTop
    lastScrollRef.current = scrollStartRef.current
  }, [isMobile])

  const handleDragMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging || !containerRef.current) return
    
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    
    const delta = (isMobile ? clientX : clientY) - dragStartRef.current
    const newScroll = scrollStartRef.current - delta
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
    
    animationFrameRef.current = requestAnimationFrame(() => {
      if (containerRef.current) {
        if (isMobile) {
          containerRef.current.scrollLeft = newScroll
        } else {
          containerRef.current.scrollTop = newScroll
        }
        lastScrollRef.current = newScroll
      }
      animationFrameRef.current = null
    })
  }, [isDragging, isMobile])

  const handleDragEnd = useCallback(() => {
    setIsDragging(false)
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
  }, [])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (!containerRef.current) return
    
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
      const delta = e.deltaY > 0 ? 0.1 : -0.1
      setScale(prev => Math.max(MIN_SCALE, Math.min(MAX_SCALE, prev + delta)))
    }
  }, [])

  const handleYearClick = useCallback((year: number) => {
    if (!isDragging) {
      onSelect(year)
    }
  }, [onSelect, isDragging])

  const visibleYears = useMemo(() => {
    const [start, end] = visibleRange
    return yearsRef.current.slice(start, end + 1).map((year, index) => ({
      year,
      index: start + index,
      count: getYearMemoryCount(year)
    }))
  }, [visibleRange, getYearMemoryCount])

  const totalYears = yearsRef.current.length

  return (
    <>
      <div className="timeline-scale-controls">
        <div className="scale-info">
          <span className="scale-value">{Math.round(scale * 100)}%</span>
        </div>
        <div className="scale-buttons">
          <button
            className="scale-btn"
            onClick={() => setScale(prev => Math.max(MIN_SCALE, prev - 0.25))}
            disabled={scale <= MIN_SCALE}
          >
            −
          </button>
          <button
            className="scale-btn"
            onClick={() => setScale(1)}
          >
            1x
          </button>
          <button
            className="scale-btn"
            onClick={() => setScale(prev => Math.min(MAX_SCALE, prev + 0.25))}
            disabled={scale >= MAX_SCALE}
          >
            +
          </button>
        </div>
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
          cursor: isDragging ? 'grabbing' : 'grab',
        }}
      >
        <div className="timeline-line" />
        
        <div
          ref={trackRef}
          className="timeline-track-inner"
          style={{
            height: isMobile ? '100%' : `${totalYears * currentGap}px`,
            width: isMobile ? `${totalYears * currentGap}px` : '100%',
            paddingTop: isMobile ? 0 : currentGap / 2,
            paddingLeft: isMobile ? currentGap / 2 : 0,
          }}
        >
          <AnimatePresence initial={false}>
            {visibleYears.map(({ year, count, index }) => (
              <motion.div
                key={year}
                className={`year-card ${selectedYear === year ? 'selected' : ''}`}
                onClick={() => handleYearClick(year)}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{
                  type: 'spring',
                  stiffness: 300,
                  damping: 30,
                  mass: 0.8
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  position: 'absolute',
                  top: isMobile ? '50%' : `${index * currentGap}px`,
                  left: isMobile ? `${index * currentGap}px` : 0,
                  transform: isMobile ? 'translate(-50%, -50%)' : 'none',
                  width: isMobile ? 'auto' : '100%',
                }}
              >
                <motion.div
                  className="year-dot"
                  animate={selectedYear === year ? {
                    scale: [1, 1.3, 1],
                    boxShadow: [
                      '0 0 0 0 rgba(212, 167, 98, 0.4)',
                      '0 0 0 12px rgba(212, 167, 98, 0)',
                      '0 0 0 0 rgba(212, 167, 98, 0)'
                    ]
                  } : {}}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatType: 'loop',
                    ease: 'easeInOut'
                  }}
                  style={{
                    fontSize: 14 * scale
                  }}
                />
                <span 
                  className="year-label" 
                  style={{ fontSize: `${14 + 4 * scale}px` }}
                >
                  {year}
                </span>
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
