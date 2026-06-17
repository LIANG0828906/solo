import { useState, useRef, useEffect } from 'react'
import { useGradientStore, ColorStop } from '../stores/gradientStore'
import { hslToHex, hexToHsl, hexToRgba, rgbaToString } from '../utils/colorUtils'

interface ColorPickerProps {
  color: string
  opacity: number
  onChange: (color: string, opacity: number) => void
  onClose: () => void
  positionStyle: React.CSSProperties
}

function ColorPicker({ color, opacity, onChange, onClose, positionStyle }: ColorPickerProps) {
  const [hsl, setHsl] = useState(() => hexToHsl(color))
  const pickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  const updateHue = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const cx = rect.width / 2
    const cy = rect.height / 2
    const dx = x - cx
    const dy = y - cy
    let angle = Math.atan2(dy, dx) * (180 / Math.PI)
    angle = (angle + 360) % 360
    const newHsl = { ...hsl, h: Math.round(angle) }
    setHsl(newHsl)
    onChange(hslToHex(newHsl.h, newHsl.s, newHsl.l), opacity)
  }

  const updateSaturationLightness = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left))
    const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top))
    const s = Math.round((x / rect.width) * 100)
    const l = Math.round(100 - (y / rect.height) * 100)
    const newHsl = { ...hsl, s, l }
    setHsl(newHsl)
    onChange(hslToHex(newHsl.h, newHsl.s, newHsl.l), opacity)
  }

  const satLightBg = hslToHex(hsl.h, 100, 50)

  return (
    <div
      ref={pickerRef}
      style={{
        position: 'absolute',
        width: '200px',
        height: '320px',
        background: 'white',
        borderRadius: '16px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
        padding: '16px',
        zIndex: 1000,
        ...positionStyle,
      }}
    >
      <div style={{ marginBottom: '12px' }}>
        <div
          onClick={updateHue}
          style={{
            width: '100%',
            height: '100px',
            borderRadius: '50%',
            background: `conic-gradient(
              hsl(0, 100%, 50%),
              hsl(60, 100%, 50%),
              hsl(120, 100%, 50%),
              hsl(180, 100%, 50%),
              hsl(240, 100%, 50%),
              hsl(300, 100%, 50%),
              hsl(360, 100%, 50%)
            )`,
            cursor: 'crosshair',
            position: 'relative',
          }}
        />
      </div>
      <div
        onClick={updateSaturationLightness}
        style={{
          width: '100%',
          height: '80px',
          borderRadius: '8px',
          background: `linear-gradient(to top, #000, transparent),
                       linear-gradient(to right, #fff, ${satLightBg})`,
          cursor: 'crosshair',
          marginBottom: '12px',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: `${hsl.s}%`,
            top: `${100 - hsl.l}%`,
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            border: '2px solid white',
            boxShadow: '0 0 4px rgba(0,0,0,0.5)',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
          }}
        />
      </div>
      <div style={{ marginBottom: '8px' }}>
        <div
          style={{
            fontSize: '11px',
            color: '#666',
            marginBottom: '4px',
          }}
        >
          透明度: {Math.round(opacity * 100)}%
        </div>
        <div
          style={{
            width: '100%',
            height: '10px',
            borderRadius: '5px',
            background: `linear-gradient(to right, transparent, ${color})`,
            position: 'relative',
          }}
        >
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={opacity}
            onChange={(e) => onChange(color, parseFloat(e.target.value))}
            style={{
              position: 'absolute',
              top: '0',
              left: '0',
              width: '100%',
              height: '100%',
              opacity: 0,
              cursor: 'pointer',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: `${opacity * 100}%`,
              width: '14px',
              height: '14px',
              borderRadius: '50%',
              background: 'white',
              border: '2px solid #4A90D9',
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none',
            }}
          />
        </div>
      </div>
      <div
        style={{
          width: '100%',
          height: '30px',
          borderRadius: '6px',
          background: rgbaToString(hexToRgba(color, opacity)),
          border: '1px solid #ddd',
        }}
      />
    </div>
  )
}

interface StopDotProps {
  stop: ColorStop
}

function StopDot({ stop }: StopDotProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [showPicker, setShowPicker] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const updateColorStop = useGradientStore((s) => s.updateColorStop)
  const removeColorStop = useGradientStore((s) => s.removeColorStop)

  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return
      const parent = containerRef.current.parentElement
      if (!parent) return
      const rect = parent.getBoundingClientRect()
      let position = ((e.clientX - rect.left) / rect.width) * 100
      position = Math.max(0, Math.min(100, position))
      position = Math.round(position * 10) / 10
      updateColorStop(stop.id, { position })
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, stop.id, updateColorStop])

  const handleColorChange = (color: string, opacity: number) => {
    updateColorStop(stop.id, { color, opacity })
  }

  const size = isHovered || showPicker ? 28 : 24

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        left: `${stop.position}%`,
        top: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: isDragging || showPicker ? 10 : 1,
      }}
    >
      {showPicker && (
        <ColorPicker
          color={stop.color}
          opacity={stop.opacity}
          onChange={handleColorChange}
          onClose={() => setShowPicker(false)}
          positionStyle={{
            bottom: '40px',
            left: '50%',
            transform: 'translateX(-50%)',
          }}
        />
      )}
      <div
        onClick={() => setShowPicker(!showPicker)}
        onMouseDown={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onContextMenu={(e) => {
          e.preventDefault()
          removeColorStop(stop.id)
        }}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: '50%',
          background: stop.color,
          border: '3px solid white',
          boxShadow: isHovered
            ? '0 0 8px rgba(0,0,0,0.5)'
            : '0 0 4px rgba(0,0,0,0.3)',
          cursor: 'grab',
          transition: 'all 0.2s ease',
          position: 'relative',
          opacity: stop.opacity,
        }}
        title={`右键删除\n位置: ${stop.position.toFixed(1)}%`}
      />
    </div>
  )
}

function ColorStopEditor() {
  const colorStops = useGradientStore((s) => s.colorStops)
  const addColorStop = useGradientStore((s) => s.addColorStop)
  const trackRef = useRef<HTMLDivElement>(null)

  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return
    const rect = e.currentTarget.getBoundingClientRect()
    let position = ((e.clientX - rect.left) / rect.width) * 100
    position = Math.max(0, Math.min(100, position))
    position = Math.round(position * 10) / 10
    addColorStop(position)
  }

  return (
    <div
      ref={trackRef}
      onClick={handleTrackClick}
      style={{
        width: '80%',
        height: '60px',
        background: '#F0F0F0',
        borderRadius: '8px',
        position: 'relative',
        marginTop: '16px',
        cursor: 'crosshair',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: '12px',
          right: '12px',
          top: '50%',
          height: '4px',
          transform: 'translateY(-50%)',
          borderRadius: '2px',
          background: '#D0D0D0',
        }}
      />
      {colorStops.map((stop) => (
        <StopDot key={stop.id} stop={stop} />
      ))}
    </div>
  )
}

export default ColorStopEditor
