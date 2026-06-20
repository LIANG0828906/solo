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
  const [isJustDropped, setIsJustDropped] = useState(false)

  const moveNote = useBoardStore(s => s.moveNote)
  const editNote = useBoardStore(s => s.editNote)
  const bringToFront = useBoardStore(s => s.bringToFront)
  const selectNote = useBoardStore(s => s.selectNote)
  const selectedNoteId = useBoardStore(s => s.selectedNoteId)

  const isSelected = selectedNoteId === note.id

  const dragStateRef = useRef({
    rafId: 0,
    startClientX: 0,
    startClientY: 0,
    origX: 0,
    origY: 0,
    latestX: 0,
    latestY: 0,
    moved: false,
    pendingX: 0,
    pendingY: 0,
  })

  const applyTransform = useCallback(() => {
    const state = dragStateRef.current
    state.rafId = 0
    if (cardRef.current) {
      cardRef.current.style.transform =
        `translate3d(${state.pendingX}px, ${state.pendingY}px, 0) scale(1.05)`
    }
  }, [])

  const handleDragStart = useCallback((clientX: number, clientY: number) => {
    const state = dragStateRef.current
    state.startClientX = clientX
    state.startClientY = clientY
    state.origX = note.x
    state.origY = note.y
    state.latestX = note.x
    state.latestY = note.y
    state.pendingX = note.x
    state.pendingY = note.y
    state.moved = false
    state.rafId = 0

    bringToFront(note.id)
    selectNote(note.id)
    setIsDragging(true)
    setIsJustDropped(false)
  }, [note.id, note.x, note.y, bringToFront, selectNote])

  const handleDragMove = useCallback((clientX: number, clientY: number) => {
    const state = dragStateRef.current
    const dx = clientX - state.startClientX
    const dy = clientY - state.startClientY

    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      state.moved = true
    }

    const newX = state.origX + dx
    const newY = state.origY + dy
    state.latestX = newX
    state.latestY = newY
    state.pendingX = newX
    state.pendingY = newY

    if (!state.rafId) {
      state.rafId = requestAnimationFrame(() => {
        moveNote(note.id, state.pendingX, state.pendingY, false)
        applyTransform()
      })
    }
  }, [note.id, moveNote, applyTransform])

  const handleDragEnd = useCallback(() => {
    const state = dragStateRef.current
    if (state.rafId) {
      cancelAnimationFrame(state.rafId)
      state.rafId = 0
    }

    if (state.moved && (state.latestX !== state.origX || state.latestY !== state.origY)) {
      moveNote(note.id, state.latestX, state.latestY, true)
    }

    setIsDragging(false)
    setIsJustDropped(true)
    setTimeout(() => setIsJustDropped(false), 200)
  }, [note.id, moveNote])

  const handlePointerDownCard = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (isEditing) return
    const target = e.target as HTMLElement
    if (target.classList.contains('connection-dot') || target.closest('.connection-dot')) return
    if (target.tagName === 'TEXTAREA') return

    e.preventDefault()
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    handleDragStart(e.clientX, e.clientY)
  }, [isEditing, handleDragStart])

  useEffect(() => {
    if (!isDragging) return

    const handleMove = (e: PointerEvent) => {
      handleDragMove(e.clientX, e.clientY)
    }
    const handleUp = (e: PointerEvent) => {
      const el = cardRef.current
      if (el && el.hasPointerCapture?.(e.pointerId)) {
        el.releasePointerCapture(e.pointerId)
      }
      handleDragEnd()
    }
    const handleCancel = (e: PointerEvent) => {
      const el = cardRef.current
      if (el && el.hasPointerCapture?.(e.pointerId)) {
        el.releasePointerCapture(e.pointerId)
      }
      handleDragEnd()
    }

    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleUp)
    window.addEventListener('pointercancel', handleCancel)

    return () => {
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleUp)
      window.removeEventListener('pointercancel', handleCancel)
      if (dragStateRef.current.rafId) {
        cancelAnimationFrame(dragStateRef.current.rafId)
      }
    }
  }, [isDragging, handleDragMove, handleDragEnd])

  const handleCardClick = useCallback((e: React.MouseEvent) => {
    if (isDragging) return
    e.stopPropagation()
    selectNote(note.id)
  }, [note.id, isDragging, selectNote])

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    if (dragStateRef.current.moved) return
    e.stopPropagation()
    setIsEditing(true)
    selectNote(note.id)
  }, [note.id, selectNote])

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
      requestAnimationFrame(() => {
        ta.focus()
        const len = ta.value.length
        ta.setSelectionRange(len, len)
      })
    }
  }, [isEditing])

  useEffect(() => {
    if (!isEditing) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        finishEditing()
      }
    }
    window.addEventListener('keydown', handleKeyDown, true)
    return () => window.removeEventListener('keydown', handleKeyDown, true)
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
      const el = e.currentTarget as HTMLElement | null
      if (el && el.hasPointerCapture?.(e.pointerId)) {
        el.releasePointerCapture(e.pointerId)
      }
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
    isPlacing || isJustDropped ? 'dropping' : '',
    isFading ? 'fading' : '',
    isEditing ? 'editing' : '',
    isSelected ? 'selected' : '',
  ].filter(Boolean).join(' ')

  const transform = isDragging
    ? `translate3d(${note.x}px, ${note.y}px, 0) scale(1.05)`
    : `translate3d(${note.x}px, ${note.y}px, 0)`

  const transition = isDragging
    ? 'none'
    : 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease, outline-color 0.3s ease'

  return (
    <div
      ref={cardRef}
      className={classes}
      style={{
        backgroundColor: note.color,
        zIndex: note.zIndex,
        transform,
        transition,
      }}
      onPointerDown={handlePointerDownCard}
      onClick={handleCardClick}
      onDoubleClick={handleDoubleClick}
    >
      <div
        className="note-drag-handle"
        onPointerDown={e => {
          e.stopPropagation()
          e.preventDefault()
          ;(e.currentTarget.parentElement as HTMLElement).setPointerCapture(e.pointerId)
          handleDragStart(e.clientX, e.clientY)
        }}
        title="拖拽移动便签"
      >
        <div className="note-drag-handle-dots">
          <span /><span /><span />
          <span /><span /><span />
        </div>
      </div>

      <div className="note-content-wrapper">
        <textarea
          ref={textareaRef}
          className="note-textarea"
          defaultValue={note.text}
          placeholder={isEditing ? '输入内容...' : ''}
          onBlur={isEditing ? finishEditing : undefined}
          onPointerDown={e => {
            e.stopPropagation()
            if (isEditing) e.preventDefault()
          }}
          readOnly={!isEditing}
        />
      </div>

      <div
        className={`connection-dot ${isConnecting ? 'dragging' : ''}`}
        onPointerDown={handleConnectionDown}
        title="拖拽连接到其他便签"
      />
    </div>
  )
}
