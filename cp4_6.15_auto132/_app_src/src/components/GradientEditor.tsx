import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import type { GradientStop, GradientType } from '../types'
import ColorPicker from './ColorPicker'

interface GradientEditorProps {
  type: GradientType
  angle: number
  stops: GradientStop[]
  onTypeChange: (t: GradientType) => void
  onAngleChange: (angle: number) => void
  onStopsChange: (stops: GradientStop[]) => void
}

const MIN_DISTANCE = 2

const resolveStopOverlaps = (stops: GradientStop[], draggedId: string): GradientStop[] => {
  if (stops.length < 2) return stops

  const sorted = [...stops].sort((a, b) => a.position - b.position)
  const n = sorted.length

  let hasOverlap = false
  for (let i = 0; i < n - 1; i++) {
    if (sorted[i + 1].position - sorted[i].position < MIN_DISTANCE) {
      hasOverlap = true
      break
    }
  }
  if (sorted[0].position < 0 || sorted[n - 1].position > 100) hasOverlap = true

  if (!hasOverlap) return stops

  const grouped: GradientStop[][] = []
  let currentGroup: GradientStop[] = [sorted[0]]
  for (let i = 1; i < n; i++) {
    if (sorted[i].position - currentGroup[currentGroup.length - 1].position <= MIN_DISTANCE) {
      currentGroup.push(sorted[i])
    } else {
      grouped.push(currentGroup)
      currentGroup = [sorted[i]]
    }
  }
  grouped.push(currentGroup)

  const resolved: GradientStop[] = []
  for (const group of grouped) {
    if (group.length === 1) {
      resolved.push({ ...group[0], position: Math.max(0, Math.min(100, group[0].position)) })
    } else {
      const draggedIdx = group.findIndex(s => s.id === draggedId)
      let anchorPos = draggedIdx >= 0
        ? group[draggedIdx].position
        : (group[0].position + group[group.length - 1].position) / 2

      const totalSpread = (group.length - 1) * MIN_DISTANCE
      let startPos = anchorPos - (draggedIdx >= 0 ? draggedIdx : (group.length - 1) / 2) * MIN_DISTANCE
      let endPos = startPos + totalSpread

      if (startPos < 0) {
        startPos = 0
        endPos = totalSpread
      }
      if (endPos > 100) {
        endPos = 100
        startPos = 100 - totalSpread
        if (startPos < 0) {
          startPos = 0
          const step = 100 / Math.max(1, group.length - 1)
          for (let i = 0; i < group.length; i++) {
            resolved.push({ ...group[i], position: Math.round(startPos + step * i) })
          }
          continue
        }
      }

      const step = group.length > 1 ? (endPos - startPos) / (group.length - 1) : 0
      for (let i = 0; i < group.length; i++) {
        resolved.push({ ...group[i], position: Math.round(startPos + step * i) })
      }
    }
  }

  const posMap = new Map<string, number>()
  resolved.forEach(s => posMap.set(s.id, s.position))
  return stops.map(s => ({ ...s, position: posMap.get(s.id) ?? s.position }))
}

const GradientEditor: React.FC<GradientEditorProps> = ({
  type, angle, stops, onTypeChange, onAngleChange, onStopsChange,
}) => {
  const [selectedStopId, setSelectedStopId] = useState<string | null>(stops[0]?.id ?? null)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [scaledId, setScaledId] = useState<string | null>(null)
  const rowRef = useRef<HTMLDivElement>(null)
  const dragState = useRef<{ id: string; startX: number; startPos: number } | null>(null)

  useEffect(() => {
    if (selectedStopId && !stops.find(s => s.id === selectedStopId) && stops.length > 0) {
      setSelectedStopId(stops[0].id)
    }
    if (!selectedStopId && stops.length > 0) {
      setSelectedStopId(stops[0].id)
    }
  }, [stops])

  const trackStyle = useMemo(() => {
    const sortedStops = [...stops].sort((a, b) => a.position - b.position)
    if (sortedStops.length === 0) return { background: '#333' }
    const parts = sortedStops.map(s => `${s.color} ${s.position}%`).join(', ')
    if (type === 'linear') {
      return { background: `linear-gradient(${angle}deg, ${parts})` }
    }
    return { background: `radial-gradient(circle, ${parts})` }
  }, [stops, type, angle])

  const handleDragStart = useCallback((e: React.MouseEvent | React.TouchEvent, stop: GradientStop) => {
    e.preventDefault()
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    dragState.current = { id: stop.id, startX: clientX, startPos: stop.position }
    setDraggingId(stop.id)
    setScaledId(stop.id)
    setSelectedStopId(stop.id)
  }, [])

  const handleDragMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!dragState.current || !rowRef.current) return
    const { id, startX, startPos } = dragState.current
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const rect = rowRef.current.getBoundingClientRect()
    const width = Math.max(1, rect.width)
    const deltaX = clientX - startX
    const deltaPercent = (deltaX / width) * 100
    const newPos = Math.max(0, Math.min(100, startPos + deltaPercent))

    const updated = stops.map(s => (s.id === id ? { ...s, position: newPos } : s))
    const resolved = resolveStopOverlaps(updated, id)
    onStopsChange(resolved)
  }, [stops, onStopsChange])

  const handleDragEnd = useCallback(() => {
    if (dragState.current) {
      const rounded = stops.map(s => ({ ...s, position: Math.round(s.position) }))
      onStopsChange(rounded)
    }
    dragState.current = null
    setDraggingId(null)
    setScaledId(null)
  }, [stops, onStopsChange])

  useEffect(() => {
    if (draggingId) {
      const onMove = (e: MouseEvent | TouchEvent) => handleDragMove(e)
      const onEnd = () => handleDragEnd()
      window.addEventListener('mousemove', onMove)
      window.addEventListener('mouseup', onEnd)
      window.addEventListener('touchmove', onMove, { passive: false })
      window.addEventListener('touchend', onEnd)
      return () => {
        window.removeEventListener('mousemove', onMove)
        window.removeEventListener('mouseup', onEnd)
        window.removeEventListener('touchmove', onMove)
        window.removeEventListener('touchend', onEnd)
      }
    }
  }, [draggingId, handleDragMove, handleDragEnd])

  const addStop = useCallback(() => {
    if (stops.length >= 8) return
    const sorted = [...stops].sort((a, b) => a.position - b.position)
    let maxGap = 0
    let gapStart = 50

    if (sorted.length > 0) {
      if (sorted[0].position > maxGap) {
        maxGap = sorted[0].position
        gapStart = maxGap / 2
      }
      for (let i = 0; i < sorted.length - 1; i++) {
        const gap = sorted[i + 1].position - sorted[i].position
        if (gap > maxGap) {
          maxGap = gap
          gapStart = sorted[i].position + gap / 2
        }
      }
      const tailGap = 100 - sorted[sorted.length - 1].position
      if (tailGap > maxGap) {
        maxGap = tailGap
        gapStart = sorted[sorted.length - 1].position + tailGap / 2
      }
    }

    const midIdx = Math.floor(sorted.length / 2)
    const newStop: GradientStop = {
      id: `stop-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      color: sorted[midIdx]?.color ?? '#6366F1',
      position: Math.round(gapStart),
    }
    const newStops = [...stops, newStop]
    setSelectedStopId(newStop.id)
    onStopsChange(resolveStopOverlaps(newStops, newStop.id))
  }, [stops, onStopsChange])

  const deleteStop = useCallback((id: string) => {
    if (stops.length <= 2) return
    const newStops = stops.filter(s => s.id !== id)
    if (selectedStopId === id) {
      setSelectedStopId(newStops[0]?.id ?? null)
    }
    onStopsChange(newStops)
  }, [stops, selectedStopId, onStopsChange])

  const updateStopColor = useCallback((id: string, color: string) => {
    onStopsChange(stops.map(s => (s.id === id ? { ...s, color } : s)))
  }, [stops, onStopsChange])

  const selectedStop = stops.find(s => s.id === selectedStopId) ?? stops[0]

  return (
    <div className="editor-panel">
      <div>
        <div className="section-title">渐变设置</div>
        <div className="toolbar-row">
          <div className="type-toggle">
            <button
              className={`type-btn ${type === 'linear' ? 'active' : ''}`}
              onClick={() => onTypeChange('linear')}
            >线性</button>
            <button
              className={`type-btn ${type === 'radial' ? 'active' : ''}`}
              onClick={() => onTypeChange('radial')}
            >径向</button>
          </div>
          <div
            className="angle-control"
            style={{
              opacity: type === 'linear' ? 1 : 0.4,
              pointerEvents: type === 'linear' ? 'auto' : 'none',
            }}
          >
            <input
              type="range"
              className="angle-slider"
              min="0"
              max="360"
              value={angle}
              onChange={e => onAngleChange(Number(e.target.value))}
            />
            <span className="angle-value">{angle}°</span>
          </div>
        </div>
      </div>

      <div>
        <div className="section-title">色标管理</div>
        <div className="stops-container">
          <div className="gradient-track" style={trackStyle} />
          <div className="stops-row" ref={rowRef}>
            {stops.map(stop => (
              <div
                key={stop.id}
                className={[
                  'stop-marker',
                  draggingId === stop.id ? 'dragging' : '',
                  scaledId === stop.id ? 'scaled-up' : '',
                  selectedStopId === stop.id ? 'selected' : '',
                ].filter(Boolean).join(' ')}
                style={{ left: `${stop.position}%` }}
                onMouseDown={e => handleDragStart(e, stop)}
                onTouchStart={e => handleDragStart(e, stop)}
                onClick={e => { e.stopPropagation(); setSelectedStopId(stop.id) }}
                onDoubleClick={e => { e.stopPropagation(); deleteStop(stop.id) }}
              >
                <div className="stop-color-dot" style={{ background: stop.color }} />
                <div className="stop-pointer" />
                <div className="stop-pos-label">{Math.round(stop.position)}%</div>
              </div>
            ))}
            <button
              className="add-stop-btn"
              onClick={addStop}
              title="添加色标"
              style={{
                opacity: stops.length >= 8 ? 0.4 : 1,
                cursor: stops.length >= 8 ? 'not-allowed' : 'pointer',
              }}
            >+</button>
          </div>
        </div>

        {selectedStop && (
          <div className="color-picker-wrapper">
            <ColorPicker
              color={selectedStop.color}
              onChange={color => updateStopColor(selectedStop.id, color)}
              onDelete={() => deleteStop(selectedStop.id)}
              canDelete={stops.length > 2}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default GradientEditor
