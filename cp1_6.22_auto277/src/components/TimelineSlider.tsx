import React, { useRef, useCallback, useState, useEffect } from 'react'

interface TimelineSliderProps {
  minYear: number
  maxYear: number
  startYear: number
  endYear: number
  onChange: (startYear: number, endYear: number) => void
}

const TimelineSlider: React.FC<TimelineSliderProps> = ({
  minYear,
  maxYear,
  startYear,
  endYear,
  onChange,
}) => {
  const trackRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState<'start' | 'end' | null>(null)

  const totalRange = maxYear - minYear

  const yearToPercent = useCallback(
    (year: number) => ((year - minYear) / totalRange) * 100,
    [minYear, totalRange]
  )

  const percentToYear = useCallback(
    (percent: number) => Math.round(minYear + (percent / 100) * totalRange),
    [minYear, totalRange]
  )

  const getPercentFromEvent = useCallback((clientX: number) => {
    if (!trackRef.current) return 0
    const rect = trackRef.current.getBoundingClientRect()
    const percent = ((clientX - rect.left) / rect.width) * 100
    return Math.max(0, Math.min(100, percent))
  }, [])

  const handleMouseDown = useCallback((type: 'start' | 'end') => {
    setIsDragging(type)
  }, [])

  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      const percent = getPercentFromEvent(e.clientX)
      const year = percentToYear(percent)

      if (isDragging === 'start') {
        onChange(Math.min(year, endYear - 1), endYear)
      } else {
        onChange(startYear, Math.max(year, startYear + 1))
      }
    }

    const handleMouseUp = () => {
      setIsDragging(null)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, startYear, endYear, onChange, getPercentFromEvent, percentToYear])

  const startPercent = yearToPercent(startYear)
  const endPercent = yearToPercent(endYear)

  return (
    <div className="timeline-section">
      <span className="timeline-label">年代筛选</span>
      <span className="timeline-year">{startYear}年</span>
      <span className="timeline-separator">—</span>
      <span className="timeline-year">{endYear}年</span>
      <div className="timeline-slider-container">
        <div className="timeline-slider-track" ref={trackRef}>
          <div
            className="timeline-slider-track-fill"
            style={{
              left: `${startPercent}%`,
              width: `${endPercent - startPercent}%`,
            }}
          />
          <div
            className="timeline-slider-thumb"
            style={{ left: `${startPercent}%` }}
            onMouseDown={() => handleMouseDown('start')}
          />
          <div
            className="timeline-slider-thumb"
            style={{ left: `${endPercent}%` }}
            onMouseDown={() => handleMouseDown('end')}
          />
        </div>
      </div>
    </div>
  )
}

export default TimelineSlider
