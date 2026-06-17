import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react'
import type { Note, NoteColor } from './store'
import { useBoardStore, NOTE_COLORS } from './store'
import { NoteCard } from './NoteCard'

interface ConnectionPoint { x: number; y: number }

export const Canvas: React.FC = () => {
  const canvasRef = useRef<HTMLDivElement>(null)
  const notes = useBoardStore(s => s.present)
  const addNote = useBoardStore(s => s.addNote)
  const connectNotes = useBoardStore(s => s.connectNotes)
  const disconnectNotes = useBoardStore(s => s.disconnectNotes)
  const selectNote = useBoardStore(s => s.selectNote)

  const [sidebarDragging, setSidebarDragging] = useState<{ color: NoteColor; x: number; y: number } | null>(null)
  const [connectionState, setConnectionState] = useState<{ fromId: string; from: ConnectionPoint; to: ConnectionPoint } | null>(null)
  const [placingIds, setPlacingIds] = useState<Set<string>>(new Set())
  const [fadingIds, setFadingIds] = useState<Set<string>>(new Set())

  const prevNotesRef = useRef<Note[]>([])
  useEffect(() => {
    const prevIds = new Set(prevNotesRef.current.map(n => n.id))
    const added = notes.filter(n => !prevIds.has(n.id))
    if (added.length > 0) {
      const ids = new Set(added.map(n => n.id))
      setPlacingIds(ids)
      const timers = added.map(n =>
        setTimeout(() => {
          setPlacingIds(prev => {
            const next = new Set(prev)
            next.delete(n.id)
            return next
          })
        }, 220)
      )
      prevNotesRef.current = notes
      return () => timers.forEach(t => clearTimeout(t))
    }

    if (prevNotesRef.current.length > 0 && notes.length === 0) {
      const ids = new Set(prevNotesRef.current.map(n => n.id))
      setFadingIds(ids)
      const toFade = prevNotesRef.current
      const timers = toFade.map((n, i) =>
        setTimeout(() => {
          setFadingIds(prev => {
            const next = new Set(prev)
            next.delete(n.id)
            return next
          })
        }, 300 + i * 100)
      )
      prevNotesRef.current = notes
      return () => timers.forEach(t => clearTimeout(t))
    }

    prevNotesRef.current = notes
  }, [notes])

  const getCanvasPoint = useCallback((clientX: number, clientY: number): ConnectionPoint => {
    const rect = canvasRef.current!.getBoundingClientRect()
    return { x: clientX - rect.left, y: clientY - rect.top }
  }, [])

  const getNoteEdgePoint = useCallback((note: Note, targetX: number, targetY: number): ConnectionPoint => {
    const effectiveH = note.h + 24
    const cx = note.x + note.w / 2
    const cy = note.y + effectiveH / 2
    const dx = targetX - cx
    const dy = targetY - cy

    if (dx === 0 && dy === 0) return { x: cx, y: cy }

    const hw = note.w / 2
    const hh = effectiveH / 2
    const scale = Math.min(hw / Math.abs(dx || 0.0001), hh / Math.abs(dy || 0.0001))

    return { x: cx + dx * scale, y: cy + dy * scale }
  }, [])

  const bezierPath = useCallback((p1: ConnectionPoint, p2: ConnectionPoint): string => {
    const dx = Math.abs(p2.x - p1.x)
    const offset = Math.max(40, dx * 0.4)
    const c1x = p1.x + offset
    const c1y = p1.y
    const c2x = p2.x - offset
    const c2y = p2.y
    return `M ${p1.x} ${p1.y} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`
  }, [])

  const connections = useMemo(() => {
    const seen = new Set<string>()
    const pairs: Array<{ from: Note; to: Note; key: string }> = []
    for (const n1 of notes) {
      for (const cid of n1.connections) {
        const n2 = notes.find(n => n.id === cid)
        if (!n2) continue
        const key = n1.id < cid ? `${n1.id}-${cid}` : `${cid}-${n1.id}`
        if (seen.has(key)) continue
        seen.add(key)
        pairs.push({ from: n1, to: n2, key })
      }
    }
    return pairs
  }, [notes])

  const onStartConnection = useCallback((noteId: string, clientX: number, clientY: number) => {
    const note = notes.find(n => n.id === noteId)
    if (!note) return
    const fromCenter = { x: note.x + note.w / 2, y: note.y + note.h / 2 }
    const pt = getCanvasPoint(clientX, clientY)
    setConnectionState({
      fromId: noteId,
      from: getNoteEdgePoint(note, pt.x, pt.y),
      to: pt,
    })
  }, [notes, getCanvasPoint, getNoteEdgePoint])

  const onDragConnection = useCallback((clientX: number, clientY: number) => {
    setConnectionState(prev => {
      if (!prev) return prev
      const from = notes.find(n => n.id === prev.fromId)
      if (!from) return prev
      const pt = getCanvasPoint(clientX, clientY)
      const fromEdge = getNoteEdgePoint(from, pt.x, pt.y)
      return { ...prev, from: fromEdge, to: pt }
    })
  }, [notes, getCanvasPoint, getNoteEdgePoint])

  const onEndConnection = useCallback((clientX: number, clientY: number) => {
    const state = connectionState
    setConnectionState(null)
    if (!state) return
    const pt = getCanvasPoint(clientX, clientY)
    const fromNote = notes.find(n => n.id === state.fromId)
    if (!fromNote) return

    const effectiveH = fromNote.h + 24
    const backToFrom =
      pt.x >= fromNote.x && pt.x <= fromNote.x + fromNote.w &&
      pt.y >= fromNote.y && pt.y <= fromNote.y + effectiveH

    const target = notes.find(n => {
      if (n.id === state.fromId) return false
      const nH = n.h + 24
      return pt.x >= n.x && pt.x <= n.x + n.w &&
             pt.y >= n.y && pt.y <= n.y + nH
    })

    if (target) {
      if (fromNote.connections.includes(target.id)) {
        disconnectNotes(fromNote.id, target.id)
      } else {
        connectNotes(fromNote.id, target.id)
      }
    } else if (backToFrom) {
      if (fromNote.connections.length > 0) {
        const lastConnectedId = fromNote.connections[fromNote.connections.length - 1]
        disconnectNotes(fromNote.id, lastConnectedId)
      }
    }
  }, [connectionState, notes, getCanvasPoint, connectNotes, disconnectNotes])

  const handleSidebarPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>, color: NoteColor) => {
    e.preventDefault()
    const pt = getCanvasPoint(e.clientX, e.clientY)
    setSidebarDragging({ color, x: pt.x, y: pt.y })
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }, [getCanvasPoint])

  useEffect(() => {
    if (!sidebarDragging) return

    const handleMove = (e: PointerEvent) => {
      const pt = getCanvasPoint(e.clientX, e.clientY)
      setSidebarDragging(prev => prev ? { ...prev, x: pt.x, y: pt.y } : null)
    }

    const handleUp = (e: PointerEvent) => {
      const rect = canvasRef.current?.getBoundingClientRect()
      if (rect &&
          e.clientX >= rect.left && e.clientX <= rect.right &&
          e.clientY >= rect.top && e.clientY <= rect.bottom) {
        const color = sidebarDragging.color
        const pt = getCanvasPoint(e.clientX, e.clientY)
        const note = addNote(pt.x - 80, pt.y - 80, color)
        setPlacingIds(prev => {
          const next = new Set(prev)
          next.add(note.id)
          return next
        })
        setTimeout(() => {
          setPlacingIds(prev => {
            const next = new Set(prev)
            next.delete(note.id)
            return next
          })
        }, 220)
      }
      setSidebarDragging(null)
    }

    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleUp)
    window.addEventListener('pointercancel', handleUp)
    return () => {
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleUp)
      window.removeEventListener('pointercancel', handleUp)
    }
  }, [sidebarDragging, getCanvasPoint, addNote])

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (e.target !== e.currentTarget) return
    selectNote(null)
  }, [selectNote])

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).tagName === 'svg' || (e.target as HTMLElement).classList.contains('canvas')) {
      selectNote(null)
    }
  }, [selectNote])

  return (
    <div className="canvas-wrapper">
      <div
        ref={canvasRef}
        className="canvas"
        onClick={handleCanvasClick}
        onMouseDown={handleCanvasMouseDown}
      >
        <svg className="connections-svg">
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {connections.map(({ from, to, key }) => {
            const p1 = getNoteEdgePoint(from, to.x + to.w / 2, to.y + to.h / 2)
            const p2 = getNoteEdgePoint(to, from.x + from.w / 2, from.y + from.h / 2)
            const d = bezierPath(p1, p2)
            return (
              <g key={key} filter="url(#glow)">
                <path
                  className="connection-line"
                  d={d}
                  onClick={(e) => {
                    e.stopPropagation()
                    disconnectNotes(from.id, to.id)
                  }}
                  strokeDasharray="200"
                  strokeDashoffset="0"
                  style={{ animation: 'dash 0.3s ease forwards' }}
                />
                <circle
                  className="connection-endpoint"
                  cx={p1.x}
                  cy={p1.y}
                  r={5}
                  onClick={(e) => {
                    e.stopPropagation()
                    disconnectNotes(from.id, to.id)
                  }}
                />
                <circle
                  className="connection-endpoint"
                  cx={p2.x}
                  cy={p2.y}
                  r={5}
                  onClick={(e) => {
                    e.stopPropagation()
                    disconnectNotes(from.id, to.id)
                  }}
                />
              </g>
            )
          })}
          {connectionState && (
            <path
              className="temp-line"
              d={bezierPath(connectionState.from, connectionState.to)}
            />
          )}
        </svg>

        {sidebarDragging && (
          <div
            className="canvas-drop-preview"
            style={{
              transform: `translate3d(${sidebarDragging.x - 80}px, ${sidebarDragging.y - 80}px, 0) scale(1.05)`,
              backgroundColor: sidebarDragging.color,
              border: '2px solid rgba(255,255,255,0.4)',
            }}
          />
        )}

        {notes.map(note => (
          <NoteCard
            key={note.id}
            note={note}
            canvasRef={canvasRef}
            onStartConnection={onStartConnection}
            onDragConnection={onDragConnection}
            onEndConnection={onEndConnection}
            isPlacing={placingIds.has(note.id)}
            isFading={fadingIds.has(note.id)}
          />
        ))}
      </div>

      <div className="sidebar">
        <div className="sidebar-label">NOTES</div>
        {NOTE_COLORS.map((color, i) => (
          <div
            key={color}
            className="note-draggable"
            style={{ backgroundColor: color }}
            onPointerDown={e => handleSidebarPointerDown(e, color)}
            title={`拖拽到画布创建便签 (${i + 1})`}
          >
            ✎
          </div>
        ))}
      </div>

      <style>{`
        @keyframes dash {
          from { stroke-dashoffset: 200; }
          to { stroke-dashoffset: 0; }
        }
      `}</style>
    </div>
  )
}
