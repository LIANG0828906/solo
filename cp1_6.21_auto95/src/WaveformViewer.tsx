import React, { useRef, useEffect, useState, useCallback } from 'react'
import type { WaveformData } from './AudioWaveform'
import type { BeatGrid, Marker, Selection } from './BeatMarkerManager'

interface WaveformViewerProps {
  waveformData: WaveformData | null
  beatGrid: BeatGrid | null
  markers: Marker[]
  selection: Selection | null
  zoomLevel: number
  onSelectionChange: (selection: Selection | null) => void
  onZoomChange: (zoom: number) => void
}

const WAVEFORM_BG = '#1A1A2E'
const WAVEFORM_START = '#1E88E5'
const WAVEFORM_END = '#00ACC1'
const PEAK_COLOR = '#FFFFFF'
const GRID_COLOR = 'rgba(255, 255, 255, 0.125)'
const BEAT_DOT_COLOR = '#4CAF50'
const SELECTION_COLOR = 'rgba(255, 235, 59, 0.19)'
const HANDLE_COLOR = '#FFFFFF'
const RULER_COLOR = 'rgba(255, 255, 255, 0.6)'

export const WaveformViewer: React.FC<WaveformViewerProps> = ({
  waveformData,
  beatGrid,
  markers,
  selection,
  zoomLevel,
  onSelectionChange,
  onZoomChange,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number | null>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStartX, setDragStartX] = useState(0)
  const [dragCurrentX, setDragCurrentX] = useState(0)
  const [isResizing, setIsResizing] = useState<'start' | 'end' | null>(null)
  const [scrollOffset, setScrollOffset] = useState(0)

  const waveformHeight = 200
  const rulerHeight = 30
  const totalHeight = waveformHeight + rulerHeight

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setDimensions({ width: rect.width, height: totalHeight })
      }
    }

    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  const getTotalWidth = useCallback(() => {
    return dimensions.width * zoomLevel
  }, [dimensions.width, zoomLevel])

  const timeToX = useCallback(
    (time: number): number => {
      if (!waveformData) return 0
      return (time / waveformData.duration) * getTotalWidth() - scrollOffset
    },
    [waveformData, getTotalWidth, scrollOffset]
  )

  const xToTime = useCallback(
    (x: number): number => {
      if (!waveformData || getTotalWidth() === 0) return 0
      const adjustedX = x + scrollOffset
      return (adjustedX / getTotalWidth()) * waveformData.duration
    },
    [waveformData, getTotalWidth, scrollOffset]
  )

  const render = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || dimensions.width === 0) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = dimensions.width * dpr
    canvas.height = totalHeight * dpr
    canvas.style.width = `${dimensions.width}px`
    canvas.style.height = `${totalHeight}px`
    ctx.scale(dpr, dpr)

    ctx.fillStyle = WAVEFORM_BG
    ctx.fillRect(0, 0, dimensions.width, totalHeight)

    if (!waveformData) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
      ctx.font = '14px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('请上传音频文件以显示波形', dimensions.width / 2, waveformHeight / 2)
      return
    }

    const { peaks, duration } = waveformData
    const totalWidth = getTotalWidth()
    const centerY = waveformHeight / 2
    const maxAmplitude = waveformHeight / 2 - 10

    const gradient = ctx.createLinearGradient(0, 0, 0, waveformHeight)
    gradient.addColorStop(0, WAVEFORM_START)
    gradient.addColorStop(1, WAVEFORM_END)

    const visibleStart = Math.max(0, Math.floor((scrollOffset / totalWidth) * peaks.length))
    const visibleEnd = Math.min(
      peaks.length,
      Math.ceil(((scrollOffset + dimensions.width) / totalWidth) * peaks.length) + 1
    )

    ctx.beginPath()
    ctx.moveTo(0, centerY)

    for (let i = visibleStart; i < visibleEnd; i++) {
      const x = (i / peaks.length) * totalWidth - scrollOffset
      const peak = peaks[i]
      const y = centerY - peak * maxAmplitude
      ctx.lineTo(x, y)
    }

    for (let i = visibleEnd - 1; i >= visibleStart; i--) {
      const x = (i / peaks.length) * totalWidth - scrollOffset
      const peak = peaks[i]
      const y = centerY + peak * maxAmplitude
      ctx.lineTo(x, y)
    }

    ctx.closePath()
    ctx.fillStyle = gradient
    ctx.fill()

    ctx.strokeStyle = PEAK_COLOR
    ctx.lineWidth = 1
    for (let i = visibleStart; i < visibleEnd; i++) {
      if (peaks[i] > 0.85) {
        const x = (i / peaks.length) * totalWidth - scrollOffset
        const y = centerY - peaks[i] * maxAmplitude
        ctx.beginPath()
        ctx.moveTo(x, y - 4)
        ctx.lineTo(x, y + 4)
        ctx.stroke()
      }
    }

    if (beatGrid) {
      ctx.strokeStyle = GRID_COLOR
      ctx.lineWidth = 1

      for (let i = 0; i < beatGrid.beatTimes.length; i++) {
        const time = beatGrid.beatTimes[i]
        const x = timeToX(time)

        if (x >= -10 && x <= dimensions.width + 10) {
          ctx.beginPath()
          ctx.moveTo(x, 0)
          ctx.lineTo(x, waveformHeight)
          ctx.stroke()

          if (i % beatGrid.timeSignature === 0) {
            ctx.fillStyle = BEAT_DOT_COLOR
            ctx.beginPath()
            ctx.arc(x, 10, 3, 0, Math.PI * 2)
            ctx.fill()
          }
        }
      }
    }

    if (selection) {
      const startX = timeToX(selection.start)
      const endX = timeToX(selection.end)
      const left = Math.min(startX, endX)
      const right = Math.max(startX, endX)
      const width = right - left

      if (right > 0 && left < dimensions.width) {
        ctx.fillStyle = SELECTION_COLOR
        ctx.fillRect(Math.max(0, left), 0, Math.min(width, dimensions.width - left), waveformHeight)

        ctx.fillStyle = HANDLE_COLOR
        if (left >= 0 && left <= dimensions.width) {
          ctx.fillRect(left - 3, centerY - 30, 6, 60)
        }
        if (right >= 0 && right <= dimensions.width) {
          ctx.fillRect(right - 3, centerY - 30, 6, 60)
        }
      }
    }

    if (isDragging && !isResizing) {
      const left = Math.min(dragStartX, dragCurrentX)
      const right = Math.max(dragStartX, dragCurrentX)
      ctx.fillStyle = SELECTION_COLOR
      ctx.fillRect(left, 0, right - left, waveformHeight)
    }

    for (const marker of markers) {
      const x = timeToX(marker.time)
      if (x >= -20 && x <= dimensions.width + 20) {
        ctx.fillStyle = marker.color
        ctx.beginPath()
        ctx.moveTo(x, 4)
        ctx.lineTo(x - 7, 16)
        ctx.lineTo(x + 7, 16)
        ctx.closePath()
        ctx.fill()
      }
    }

    ctx.fillStyle = WAVEFORM_BG
    ctx.fillRect(0, waveformHeight, dimensions.width, rulerHeight)

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
    ctx.beginPath()
    ctx.moveTo(0, waveformHeight)
    ctx.lineTo(dimensions.width, waveformHeight)
    ctx.stroke()

    ctx.fillStyle = RULER_COLOR
    ctx.font = '10px sans-serif'
    ctx.textAlign = 'center'

    const interval = 0.5
    const pixelsPerSecond = totalWidth / duration
    const minSpacing = 50
    let displayInterval = interval
    while (pixelsPerSecond * displayInterval < minSpacing) {
      displayInterval *= 2
    }

    for (let time = 0; time <= duration; time += displayInterval) {
      const x = timeToX(time)
      if (x >= -20 && x <= dimensions.width + 20) {
        ctx.beginPath()
        ctx.moveTo(x, waveformHeight)
        ctx.lineTo(x, waveformHeight + (time % 1 === 0 ? 10 : 5))
        ctx.strokeStyle = RULER_COLOR
        ctx.stroke()

        if (time % 1 === 0) {
          const minutes = Math.floor(time / 60)
          const seconds = Math.floor(time % 60)
          const label = `${minutes}:${seconds.toString().padStart(2, '0')}`
          ctx.fillText(label, x, waveformHeight + 22)
        }
      }
    }
  }, [
    waveformData,
    beatGrid,
    markers,
    selection,
    dimensions,
    zoomLevel,
    scrollOffset,
    isDragging,
    isResizing,
    dragStartX,
    dragCurrentX,
    timeToX,
    getTotalWidth,
    totalHeight,
    waveformHeight,
  ])

  useEffect(() => {
    const animate = () => {
      render()
      animationRef.current = requestAnimationFrame(animate)
    }
    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [render])

  const getHandleAtPosition = useCallback(
    (x: number): 'start' | 'end' | null => {
      if (!selection) return null
      const startX = timeToX(selection.start)
      const endX = timeToX(selection.end)

      if (Math.abs(x - startX) < 10) return 'start'
      if (Math.abs(x - endX) < 10) return 'end'
      return null
    },
    [selection, timeToX]
  )

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!containerRef.current || !waveformData) return

    const rect = containerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left

    const handle = getHandleAtPosition(x)
    if (handle) {
      setIsResizing(handle)
      return
    }

    setIsDragging(true)
    setDragStartX(x)
    setDragCurrentX(x)
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left

    if (isResizing && selection) {
      const time = xToTime(x)
      if (isResizing === 'start') {
        onSelectionChange({ start: Math.max(0, time), end: selection.end })
      } else {
        onSelectionChange({ start: selection.start, end: Math.min(waveformData?.duration || 0, time) })
      }
    } else if (isDragging) {
      setDragCurrentX(x)
    }

    if (getHandleAtPosition(x)) {
      containerRef.current.style.cursor = 'ew-resize'
    } else {
      containerRef.current.style.cursor = isDragging ? 'grabbing' : 'crosshair'
    }
  }

  const handleMouseUp = () => {
    if (isDragging && !isResizing && waveformData) {
      const startTime = xToTime(Math.min(dragStartX, dragCurrentX))
      const endTime = xToTime(Math.max(dragStartX, dragCurrentX))

      if (Math.abs(endTime - startTime) > 0.05) {
        onSelectionChange({
          start: Math.max(0, startTime),
          end: Math.min(waveformData.duration, endTime),
        })
      } else {
        onSelectionChange(null)
      }
    }

    setIsDragging(false)
    setIsResizing(null)
  }

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    if (!waveformData) return

    const delta = e.deltaY > 0 ? 0.8 : 1.25
    const newZoom = Math.max(0.5, Math.min(4, zoomLevel * delta))

    if (newZoom !== zoomLevel) {
      const rect = containerRef.current?.getBoundingClientRect()
      if (rect) {
        const mouseX = e.clientX - rect.left
        const mouseTime = xToTime(mouseX)
        const newTotalWidth = dimensions.width * newZoom
        const newScrollOffset = mouseTime / waveformData.duration * newTotalWidth - mouseX
        setScrollOffset(Math.max(0, Math.min(newTotalWidth - dimensions.width, newScrollOffset)))
      }
      onZoomChange(newZoom)
    }
  }

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollOffset(e.currentTarget.scrollLeft)
  }

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: totalHeight,
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: WAVEFORM_BG,
        borderRadius: '8px',
      }}
    >
      <div
        style={{
          width: '100%',
          height: totalHeight,
          overflowX: 'auto',
          overflowY: 'hidden',
          scrollbarWidth: 'thin',
        }}
        onScroll={handleScroll}
      >
        <canvas
          ref={canvasRef}
          style={{
            display: 'block',
            cursor: isDragging ? 'grabbing' : 'crosshair',
            transition: zoomLevel !== 1 ? 'transform 0.3s ease' : 'none',
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        />
      </div>
    </div>
  )
}
