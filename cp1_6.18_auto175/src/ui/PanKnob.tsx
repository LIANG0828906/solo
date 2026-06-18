import { useEffect, useRef, useState } from 'react'
import { clamp } from '@/utils/wavEncoder'

interface PanKnobProps {
  value: number
  onChange: (v: number) => void
}

export default function PanKnob({ value, onChange }: PanKnobProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState(false)
  const [internal, setInternal] = useState(value)
  const startRef = useRef({ x: 0, v: 0 })

  useEffect(() => { if (!dragging) setInternal(value) }, [value, dragging])

  useEffect(() => {
    if (!dragging) return
    const move = (e: MouseEvent) => {
      const dx = (e.clientX - startRef.current.x) / 100
      const v = clamp(startRef.current.v + dx, -1, 1)
      const snapped = Math.round(v * 20) / 20
      setInternal(snapped)
      onChange(snapped)
    }
    const up = () => setDragging(false)
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
    return () => {
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', up)
    }
  }, [dragging, onChange])

  const angle = -135 + internal * 270
  const display = internal === 0 ? 'C' : internal < 0 ? `L${Math.round(-internal * 100)}` : `R${Math.round(internal * 100)}`

  return (
    <div className="pan-knob-wrap">
      <div className="pan-label">PAN · {display}</div>
      <div
        ref={ref}
        className="pan-knob"
        onMouseDown={(e) => {
          startRef.current = { x: e.clientX, v: internal }
          setDragging(true)
        }}
        onDoubleClick={() => { setInternal(0); onChange(0) }}
      >
        <div
          className="pan-knob-indicator"
          style={{ transform: `translate(-50%, 0) rotate(${angle}deg)` }}
        />
      </div>
      <div className="pan-scale">
        <span>L</span><span>C</span><span>R</span>
      </div>
    </div>
  )
}
