import React, { useState, useRef, useEffect, useCallback } from 'react'

interface CustomSliderProps {
  value: number
  min: number
  max: number
  step: number
  onChange: (value: number) => void
}

const CustomSlider: React.FC<CustomSliderProps> = ({ value, min, max, step, onChange }) => {
  const trackRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const rafIdRef = useRef<number | null>(null)
  const pendingValueRef = useRef<number | null>(null)

  const percentage = ((value - min) / (max - min)) * 100

  const updateValue = useCallback(
    (clientX: number) => {
      if (!trackRef.current) return
      const rect = trackRef.current.getBoundingClientRect()
      const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
      let rawValue = min + x * (max - min)
      rawValue = Math.round(rawValue / step) * step
      rawValue = Math.max(min, Math.min(max, rawValue))
      return rawValue
    },
    [min, max, step]
  )

  const rafUpdate = useCallback(
    (clientX: number) => {
      if (rafIdRef.current !== null) {
        pendingValueRef.current = clientX
        return
      }
      rafIdRef.current = requestAnimationFrame(() => {
        const val = updateValue(clientX)
        if (val !== undefined) {
          onChange(val)
        }
        rafIdRef.current = null
        if (pendingValueRef.current !== null) {
          const pending = pendingValueRef.current
          pendingValueRef.current = null
          rafUpdate(pending)
        }
      })
    },
    [updateValue, onChange]
  )

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        rafUpdate(e.clientX)
      }
    }
    const handleMouseUp = () => {
      setIsDragging(false)
    }
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current)
      }
    }
  }, [isDragging, rafUpdate])

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
    const val = updateValue(e.clientX)
    if (val !== undefined) {
      onChange(val)
    }
  }

  return (
    <div
      ref={trackRef}
      className="custom-slider-track"
      onMouseDown={handleMouseDown}
    >
      <div className="custom-slider-fill" style={{ width: `${percentage}%` }} />
      <div
        className="custom-slider-thumb"
        style={{ left: `${percentage}%` }}
      />
    </div>
  )
}

export default CustomSlider
