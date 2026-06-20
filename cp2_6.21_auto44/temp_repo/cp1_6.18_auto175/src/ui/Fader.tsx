import { useEffect, useRef, useState } from 'react'
import { clamp } from '@/utils/wavEncoder'

interface FaderProps {
  value: number
  min?: number
  max?: number
  onChange: (v: number) => void
  trackHeight?: number
}

export default function Fader({
  value,
  min = 0,
  max = 1,
  onChange,
  trackHeight = 140
}: FaderProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState(false)
  const [internal, setInternal] = useState(value)

  useEffect(() => {
    if (!dragging) setInternal(value)
  }, [value, dragging])

  function setFromY(clientY: number) {
    if (!trackRef.current) return
    const rect = trackRef.current.getBoundingClientRect()
    const rel = 1 - clamp((clientY - rect.top) / rect.height, 0, 1)
    const v = min + (max - min) * rel
    const snap = Math.round(v * 100) / 100
    setInternal(clamp(snap, min, max))
    onChange(clamp(snap, min, max))
  }

  useEffect(() => {
    if (!dragging) return
    const move = (e: MouseEvent) => setFromY(e.clientY)
    const up = () => setDragging(false)
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
    return () => {
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', up)
    }
  }, [dragging])

  const rel = (internal - min) / (max - min)
  const fillH = Math.max(0, Math.min(trackHeight, rel * trackHeight))
  const thumbBottom = fillH
  const dbText = internal <= 0
    ? '-∞'
    : `${(20 * Math.log10(internal)).toFixed(0)}dB`

  return (
    <div className="fader-wrap">
      <div
        ref={trackRef}
        className="fader-track"
        style={{ height: trackHeight }}
        onMouseDown={(e) => {
          setDragging(true)
          setFromY(e.clientY)
        }}
      >
        <div className="fader-fill" style={{ height: fillH }} />
        <div
          className={`fader-thumb ${dragging ? 'dragging' : ''}`}
          style={{ bottom: thumbBottom - 8 }}
          onMouseDown={(e) => {
            e.stopPropagation()
            setDragging(true)
          }}
        />
      </div>
      <span className="fader-value">{dbText}</span>
    </div>
  )
}
