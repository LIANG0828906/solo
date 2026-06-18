import { useEffect, useRef, useState } from 'react'
import { useProjectStore, type Clip } from '@/stores/projectStore'
import { secToPx, pxToSec, throttle } from '@/utils/dom'
import { drawWaveformPreview } from '@/engine/visualizerEngine'

interface Props {
  clip: Clip
  trackColor: string
  pxPerSec: number
  trackIndex: number
  onDropToTrack?: (trackIdx: number) => void
}

export default function ClipBlock({ clip, trackColor, pxPerSec, trackIndex, onDropToTrack }: Props) {
  const {
    selectedClipId, selectClip, removeClip, moveClip, trimClip,
    openEffectPanel, audioEngine, tracks
  } = useProjectStore()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const blockRef = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState<null | 'move' | 'left' | 'right'>(null)
  const dragStateRef = useRef({ startX: 0, startAt: 0, trimVal: 0 })
  const posX = secToPx(clip.startAt, pxPerSec)
  const widthPx = secToPx(Math.max(0.01, clip.trimEnd - clip.trimStart), pxPerSec)
  const selected = selectedClipId === clip.id

  useEffect(() => {
    const c = canvasRef.current
    if (!c || !audioEngine) return
    const buffer = clip.isBeat && clip.audioBufferRef
      ? audioEngine.getCachedBuffer(clip.audioBufferRef)
      : (clip.audioBufferRef ? audioEngine.getCachedBuffer(clip.audioBufferRef) : null)
      || (clip.audioUrl ? audioEngine.getCachedBuffer(clip.audioUrl) : null)
    if (buffer) {
      requestAnimationFrame(() => {
        drawWaveformPreview(c!, buffer, clip.trimStart, clip.trimEnd, 'rgba(255,255,255,0.7)')
      })
    }
  }, [clip, audioEngine])

  useEffect(() => {
    if (!dragging) return
    const throttledMove = throttle((clientX: number) => {
      if (!blockRef.current) return
      if (dragging === 'move') {
        const dx = clientX - dragStateRef.current.startX
        const deltaSec = pxToSec(dx, pxPerSec)
        let newAt = Math.max(0, dragStateRef.current.startAt + deltaSec)
        moveClip(clip.id, newAt)
      } else if (dragging === 'left' || dragging === 'right') {
        const dx = clientX - dragStateRef.current.startX
        const deltaSec = pxToSec(dx, pxPerSec)
        const side = dragging === 'left' ? 'start' : 'end'
        const newVal = side === 'start'
          ? Math.max(0, Math.min(clip.trimEnd - 0.05, dragStateRef.current.trimVal + deltaSec))
          : Math.min(clip.duration, Math.max(clip.trimStart + 0.05, dragStateRef.current.trimVal + deltaSec))
        trimClip(clip.id, side, newVal)
      }
    }, 16)
    const move = (e: MouseEvent) => throttledMove(e.clientX)
    const up = () => setDragging(null)
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
    return () => {
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', up)
    }
  }, [dragging, pxPerSec, clip.id, clip.trimStart, clip.trimEnd, clip.duration, moveClip, trimClip])

  return (
    <div
      id={`clip-${clip.id}`}
      ref={blockRef}
      className={`clip-block ${selected ? 'selected' : ''} ${clip.isBeat ? 'beat-clip' : ''} ${dragging ? 'dragging' : ''}`}
      style={{
        left: posX,
        width: widthPx,
        borderColor: clip.isBeat ? undefined : trackColor,
        background: clip.isBeat ? undefined : `${trackColor}33`
      }}
      draggable={false}
      onMouseDown={(e) => {
        e.stopPropagation()
        selectClip(clip.id)
        dragStateRef.current = { startX: e.clientX, startAt: clip.startAt, trimVal: 0 }
        setDragging('move')
      }}
      onDoubleClick={(e) => {
        e.stopPropagation()
        openEffectPanel(clip.id)
      }}
    >
      <div className="clip-label">{clip.name}{clip.effects.length > 0 ? ` · FX${clip.effects.length}` : ''}</div>
      <canvas ref={canvasRef} className="clip-waveform" />
      <div
        className="trim-handle left"
        onMouseDown={(e) => {
          e.stopPropagation()
          dragStateRef.current = { startX: e.clientX, startAt: 0, trimVal: clip.trimStart }
          setDragging('left')
        }}
      />
      <div
        className="trim-handle right"
        onMouseDown={(e) => {
          e.stopPropagation()
          dragStateRef.current = { startX: e.clientX, startAt: 0, trimVal: clip.trimEnd }
          setDragging('right')
        }}
      />
      <button
        title="删除片段"
        style={{
          position: 'absolute',
          top: 4, right: 6,
          width: 18, height: 18, borderRadius: 4,
          background: 'rgba(0,0,0,0.4)', color: '#fff',
          fontSize: 11, lineHeight: 1, cursor: 'pointer',
          display: selected ? 'inline-flex' : 'none',
          alignItems: 'center', justifyContent: 'center',
          opacity: 0.8, zIndex: 6, padding: 0
        }}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => { e.stopPropagation(); removeClip(clip.id) }}
      >
        ×
      </button>
      {/* drag-to-reorder-zone */}
      <div
        style={{
          position: 'absolute',
          left: 0, right: 0, top: -10, height: 10,
          zIndex: 3,
          pointerEvents: dragging === 'move' ? 'none' : 'auto'
        }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={() => onDropToTrack?.(trackIndex - 1)}
      />
      <div
        style={{
          position: 'absolute',
          left: 0, right: 0, bottom: -10, height: 10,
          zIndex: 3
        }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={() => onDropToTrack?.(trackIndex + 1)}
      />
      {tracks.length > 0 && null}
    </div>
  )
}
