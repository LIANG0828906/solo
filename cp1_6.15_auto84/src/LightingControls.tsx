import React, { useRef, useEffect, useCallback, useState } from 'react'
import type { LightingParams } from './utils/imageFilters'
import './LightingControls.css'

interface LightingControlsProps {
  lighting: LightingParams
  onChange: (lighting: LightingParams) => void
  onReset: () => void
}

const LightingControls: React.FC<LightingControlsProps> = ({
  lighting,
  onChange,
  onReset
}) => {
  const circleRef = useRef<HTMLDivElement>(null)
  const [angleDragging, setAngleDragging] = useState(false)
  const [intensityDragging, setIntensityDragging] = useState(false)

  const handleAngleChange = useCallback(
    (clientX: number, clientY: number) => {
      if (!circleRef.current) return
      const rect = circleRef.current.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const dx = clientX - cx
      const dy = clientY - cy
      let angle = (Math.atan2(dy, dx) * 180) / Math.PI + 90
      if (angle < 0) angle += 360
      angle = Math.round(angle)
      if (angle !== lighting.angle) {
        onChange({ ...lighting, angle })
      }
    },
    [lighting, onChange]
  )

  const handleAnglePointerDown = (e: React.PointerEvent) => {
    e.preventDefault()
    setAngleDragging(true)
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    handleAngleChange(e.clientX, e.clientY)
  }

  const handleAnglePointerMove = (e: React.PointerEvent) => {
    if (!angleDragging) return
    handleAngleChange(e.clientX, e.clientY)
  }

  const handleAnglePointerUp = (e: React.PointerEvent) => {
    setAngleDragging(false)
    ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)
  }

  const intensityTrackRef = useRef<HTMLDivElement>(null)

  const handleIntensityChange = useCallback(
    (clientX: number) => {
      if (!intensityTrackRef.current) return
      const rect = intensityTrackRef.current.getBoundingClientRect()
      const pct = (clientX - rect.left) / rect.width
      const intensity = Math.round(Math.max(0, Math.min(100, pct * 100)))
      if (intensity !== lighting.intensity) {
        onChange({ ...lighting, intensity })
      }
    },
    [lighting, onChange]
  )

  const handleIntensityPointerDown = (e: React.PointerEvent) => {
    e.preventDefault()
    setIntensityDragging(true)
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    handleIntensityChange(e.clientX)
  }

  const handleIntensityPointerMove = (e: React.PointerEvent) => {
    if (!intensityDragging) return
    handleIntensityChange(e.clientX)
  }

  const handleIntensityPointerUp = (e: React.PointerEvent) => {
    setIntensityDragging(false)
    ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)
  }

  useEffect(() => {
    return () => {}
  }, [])

  const angleRadians = ((lighting.angle - 90) * Math.PI) / 180
  const handleX = 50 + Math.cos(angleRadians) * 42
  const handleY = 50 + Math.sin(angleRadians) * 42

  return (
    <div className="lighting-controls">
      <div className="control-section angle-control">
        <div className="angle-value">{lighting.angle}°</div>
        <div
          className="angle-circle"
          ref={circleRef}
          onPointerDown={handleAnglePointerDown}
          onPointerMove={handleAnglePointerMove}
          onPointerUp={handleAnglePointerUp}
          onPointerCancel={handleAnglePointerUp}
        >
          <div className="angle-ring" />
          <div className="angle-center" />
          <div
            className={`angle-handle ${angleDragging ? 'dragging' : ''}`}
            style={{
              left: `${handleX}%`,
              top: `${handleY}%`
            }}
          />
        </div>
        <div className="control-label">光照方向</div>
      </div>

      <div className="control-section intensity-control">
        <div className="intensity-value">{lighting.intensity}</div>
        <div
          className="intensity-track"
          ref={intensityTrackRef}
          onPointerDown={handleIntensityPointerDown}
          onPointerMove={handleIntensityPointerMove}
          onPointerUp={handleIntensityPointerUp}
          onPointerCancel={handleIntensityPointerUp}
        >
          <div
            className="intensity-fill"
            style={{ width: `${lighting.intensity}%` }}
          />
          <div
            className={`intensity-handle ${intensityDragging ? 'dragging' : ''}`}
            style={{ left: `${lighting.intensity}%` }}
          />
        </div>
        <div className="control-label">光照强度</div>
      </div>

      <button
        className="reset-button"
        onClick={onReset}
        title="重置光照"
      >
        ×
      </button>
    </div>
  )
}

export default LightingControls
