import React, { useEffect, useRef, useState, useCallback } from 'react'
import type { Note } from './store'
import { useBoardStore } from './store'

interface NoteCardProps {
  note: Note
  canvasRef: React.RefObject<HTMLDivElement>
  onStartConnection: (noteId: string, clientX: number, clientY: number) => void
  onDragConnection: (clientX: number, clientY: number) => void
  onEndConnection: (clientX: number, clientY: number) => void
  isPlacing?: boolean
  isFading?: boolean
}

export const NoteCard: React.FC<NoteCardProps> = ({
  note,
  canvasRef,
  onStartConnection,
  onDragConnection,
  onEndConnection,
  isPlacing = false,
  isFading = false,
}) => {
  const cardRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [localOffset, setLocalOffset] = useState({ x: 0, y: 0 })

  const moveNote = useBoardStore(s => s.moveNote)
  const editNote = useBoardStore(s => s.editNote)
  const bringToFront = useBoardStore(s => s.bringToFront)

  const dragStateRef = useRef({
    rafId: 0,
    startX: 0,
    startY: 0,
    origX: 0,
    origY: 0,
    lastX: 0,
    lastY: 0,
    moved: false,
  })

  const handlePointerDownCard = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (isEditing) return
    const target = e.target as HTMLElement
    if (target.classList.contains('connection-dot') || target.closest('.connection-dot')) return

    const rect = cardRef.current!.getBoundingClientRect()
    const canvasRect = canvasRef.current!.getBoundingClientRect()

    const state = dragStateRef.current
    state.startX = e.clientX
    state.startY = e.clientY
    state.origX = note.x
    state.origY = note.y
    state.lastX = note.x
    state.lastY = note.y
    state.moved = false

    setLocalOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })

    bringToFront(note.id)
    setIsDragging(true)
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    e.preventDefault()
  }, [isEditing, note.id, note.x, note.y, canvasRef, bringToFront])

  useEffect(() => {
    if (!isDragging) return

    const state = dragStateRef.current

    const onPointerMove = (e: PointerEvent) => {
      if (state.rafId) return
      const canvasRect = canvasRef.current!.getBoundingClientRect()

      const dx = e.clientX - state.startX
      const dy = e.clientY - state.startY
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        state.moved = true
      }

      state.rafId = requestAnimationFrame(() => {
        const newX = state.origX + (e.clientX - state.startX)
        const newY = state.origY + (e.clientY - state.startY)
        moveNote(note.id, newX, newY, false)
        state.lastX = newX
        state.lastY = newY
        state.rafId = 0
      })
    }

    const onPointerUp = () => {
      if (state.rafId) {
        cancelAnimationFrame(state.rafId)
        state.rafId = 0
      }
      if (state.moved && (state.lastX !== state.origX || state.lastY !== state.origY)) {
        moveNote(note.id, state.lastX, state.lastY, true)
      }
      setIsDragging(false)
    }

    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('pointercancel', onPointerUp)

    return () => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('pointercancel', onPointerUp)
      if (state.rafId) cancelAnimationFrame(state.rafId)
    }
  }, [isDragging, note.id, moveNote, canvasRef])

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    if (isDragging) return
    e.stopPropagation()
    setIsEditing(true)
  }, [isDragging])

  const finishEditing = useCallback(() => {
    const textarea = textareaRef.current
    if (textarea) {
      const newText = textarea.value
      if (newText !== note.text) {
        editNote(note.id, newText)
      }
    }
    setIsEditing(false)
  }, [note.id, note.text, editNote])

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      const ta = textareaRef.current
      ta.focus()
      ta.setSelectionRange(ta.value.length, ta.value.length)
    }
  }, [isEditing])

  useEffect(() => {
    if (!isEditing) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        finishEditing()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isEditing, finishEditing])

  const handleConnectionDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation()
    e.preventDefault()
    setIsConnecting(true)
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    onStartConnection(note.id, e.clientX, e.clientY)
  }, [note.id, onStartConnection])

  useEffect(() => {
    if (!isConnecting) return

    const handleMove = (e: PointerEvent) => onDragConnection(e.clientX, e.clientY)
    const handleUp = (e: PointerEvent) => {
      setIsConnecting(false)
      onEndConnection(e.clientX, e.clientY)
    }

    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleUp)
    window.addEventListener('pointercancel', handleUp)
    return () => {
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleUp)
      window.removeEventListener('pointercancel', handleUp)
    }
  }, [isConnecting, onDragConnection, onEndConnection])

  const classes = [
    'note-card',
    isDragging ? 'dragging' : '',
    isPlacing ? 'placing' : '',
    isFading ? 'fading' : '',
    isEditing ? 'editing' : '',
  ].filter(Boolean).join(' ')

  const transform = isDragging
    ? `translate3d(${note.x}px, ${note.y}px, 0) scale(1.05)`
    : `translate3d(${note.x}px, ${note.y}px, 0)`

  return (
    <div
      ref={cardRef}
      className={classes}
      style={{
        backgroundColor: note.color,
        zIndex: note.zIndex,
        transform,
        transition: isDragging ? 'none' : 'box-shadow 0.2s ease',
      }}
      onPointerDown={handlePointerDownCard}
      onDoubleClick={handleDoubleClick}
    >
      <textarea
        ref={textareaRef}
        className="note-textarea"
        defaultValue={note.text}
        placeholder={isEditing ? '输入内容...' : ''}
        onBlur={isEditing ? finishEditing : undefined}
        onPointerDown={e => isEditing && e.stopPropagation()}
        readOnly={!isEditing}
      />
      <div
        className={`connection-dot ${isConnecting ? 'dragging' : ''}`}
        onPointerDown={handleConnectionDown}
        title="拖拽连接到其他便签"
      />
    </div>
  )
}
