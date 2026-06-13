import { useState, useRef, useCallback, useEffect } from 'react'
import Note from './Note'
import type { Note as NoteType, Column } from './types'

interface BoardProps {
  columns: Column[]
  notes: NoteType[]
  nickname: string
  onAddNote: (note: { columnId: string; tempId: string; title: string; content: string; color: string; creator: string }) => void
  onUpdateNote: (note: Partial<NoteType> & { id: string }) => void
  onDeleteNote: (id: string) => void
  onMoveNote: (id: string, toColumnId: string, toIndex: number) => void
}

interface DragState {
  noteId: string
  fromColumnId: string
  fromIndex: number
  currentColumnId: string
  currentIndex: number
  startX: number
  startY: number
  offsetX: number
  offsetY: number
  originalRect: DOMRect
}

function Board({ columns, notes, nickname, onAddNote, onUpdateNote, onDeleteNote, onMoveNote }: BoardProps) {
  const [dragState, setDragState] = useState<DragState | null>(null)
  const [hoverColumn, setHoverColumn] = useState<string | null>(null)
  const [bumpColumns, setBumpColumns] = useState<Set<string>>(new Set())
  const boardRef = useRef<HTMLDivElement>(null)

  const getColumnNotes = useCallback(
    (columnId: string) => {
      return notes
        .filter((n) => n.columnId === columnId)
        .sort((a, b) => a.order - b.order)
    },
    [notes]
  )

  const getDropIndex = useCallback(
    (columnId: string, clientY: number): number => {
      const colEl = document.querySelector(`[data-column="${columnId}"] .column-body`)
      if (!colEl) return 0

      const rect = colEl.getBoundingClientRect()
      const relativeY = clientY - rect.top
      const noteEls = colEl.querySelectorAll('.note-wrapper:not(.dragging)')

      if (noteEls.length === 0) return 0

      for (let i = 0; i < noteEls.length; i++) {
        const noteRect = (noteEls[i] as HTMLElement).getBoundingClientRect()
        const noteCenter = noteRect.top - rect.top + noteRect.height / 2
        if (relativeY < noteCenter) return i
      }
      return noteEls.length
    },
    []
  )

  const handleDoubleClick = useCallback(
    (columnId: string, e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest('.note')) return
      const col = columns.find((c) => c.id === columnId)
      if (!col) return
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`
      onAddNote({
        columnId,
        tempId,
        title: '新便签',
        content: '',
        color: col.defaultColor,
        creator: nickname,
      })
    },
    [columns, nickname, onAddNote]
  )

  const handleDragStart = useCallback(
    (note: NoteType, e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault()
      const el = (e.currentTarget as HTMLElement).closest('.note') as HTMLElement
      if (!el) return
      const rect = el.getBoundingClientRect()
      let clientX: number, clientY: number
      if ('touches' in e) {
        clientX = e.touches[0].clientX
        clientY = e.touches[0].clientY
      } else {
        clientX = e.clientX
        clientY = e.clientY
      }

      const currentNotes = getColumnNotes(note.columnId)
      const fromIndex = currentNotes.findIndex((n) => n.id === note.id)

      setDragState({
        noteId: note.id,
        fromColumnId: note.columnId,
        fromIndex,
        currentColumnId: note.columnId,
        currentIndex: fromIndex,
        startX: clientX,
        startY: clientY,
        offsetX: clientX - rect.left,
        offsetY: clientY - rect.top,
        originalRect: rect,
      })
    },
    [getColumnNotes]
  )

  const handleDragMove = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (!dragState) return
      let clientX: number, clientY: number
      if ('touches' in e) {
        clientX = e.touches[0].clientX
        clientY = e.touches[0].clientY
      } else {
        clientX = e.clientX
        clientY = e.clientY
      }

      let targetColId: string | null = null
      columns.forEach((col) => {
        const colEl = document.querySelector(`[data-column="${col.id}"]`) as HTMLElement
        if (colEl) {
          const rect = colEl.getBoundingClientRect()
          if (clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom) {
            targetColId = col.id
          }
        }
      })

      if (!targetColId) {
        setHoverColumn(null)
        return
      }

      setHoverColumn(targetColId)
      const dropIndex = getDropIndex(targetColId, clientY)

      if (targetColId !== dragState.currentColumnId || dropIndex !== dragState.currentIndex) {
        const prevCol = dragState.currentColumnId
        setDragState((prev) =>
          prev
            ? { ...prev, currentColumnId: targetColId!, currentIndex: dropIndex }
            : prev
        )

        if (targetColId !== prevCol) {
          setBumpColumns((prev) => {
            const next = new Set(prev)
            next.add(targetColId!)
            next.add(prevCol)
            return next
          })
          setTimeout(() => {
            setBumpColumns((prev) => {
              const next = new Set(prev)
              next.delete(targetColId!)
              next.delete(prevCol)
              return next
            })
          }, 300)
        }
      }
    },
    [dragState, columns, getDropIndex]
  )

  const handleDragEnd = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (!dragState) return
      let clientX: number, clientY: number
      if ('changedTouches' in e) {
        clientX = e.changedTouches[0].clientX
        clientY = e.changedTouches[0].clientY
      } else {
        clientX = e.clientX
        clientY = e.clientY
      }

      const boardEl = boardRef.current
      if (boardEl) {
        const rect = boardEl.getBoundingClientRect()
        const isOutside = 
          clientX < rect.left - 50 || 
          clientX > rect.right + 50 || 
          clientY < rect.top - 50 || 
          clientY > rect.bottom + 50

        if (isOutside) {
          const noteEl = document.querySelector(`[data-note-id="${dragState.noteId}"]`) as HTMLElement
          if (noteEl) {
            noteEl.style.willChange = 'transform, opacity'
            noteEl.classList.add('returning')
            setTimeout(() => {
              noteEl.classList.remove('returning')
              noteEl.style.willChange = ''
            }, 400)
          }
          setDragState(null)
          setHoverColumn(null)
          return
        }
      }

      if (hoverColumn) {
        const shouldMove = 
          dragState.fromColumnId !== dragState.currentColumnId || 
          dragState.fromIndex !== dragState.currentIndex

        if (shouldMove) {
          onMoveNote(dragState.noteId, dragState.currentColumnId, dragState.currentIndex)
        }
      }

      setDragState(null)
      setHoverColumn(null)
    },
    [dragState, hoverColumn, onMoveNote]
  )

  useEffect(() => {
    if (dragState) {
      const moveHandler = (e: MouseEvent) => handleDragMove(e)
      const upHandler = (e: MouseEvent) => handleDragEnd(e)
      const touchMove = (e: TouchEvent) => handleDragMove(e)
      const touchEnd = (e: TouchEvent) => handleDragEnd(e)
      window.addEventListener('mousemove', moveHandler)
      window.addEventListener('mouseup', upHandler)
      window.addEventListener('touchmove', touchMove, { passive: false })
      window.addEventListener('touchend', touchEnd)
      return () => {
        window.removeEventListener('mousemove', moveHandler)
        window.removeEventListener('mouseup', upHandler)
        window.removeEventListener('touchmove', touchMove)
        window.removeEventListener('touchend', touchEnd)
      }
    }
  }, [dragState, handleDragMove, handleDragEnd])

  const renderColumn = (col: Column) => {
    const colNotes = getColumnNotes(col.id)
    const isHover = hoverColumn === col.id

    let displayNotes = [...colNotes]
    if (dragState) {
      const isDraggingFromThisCol = dragState.fromColumnId === col.id
      const isDraggingToThisCol = isHover

      displayNotes = displayNotes.filter((n) => n.id !== dragState.noteId)

      if (isDraggingToThisCol) {
        const dragNote = notes.find((n) => n.id === dragState.noteId)
        if (dragNote) {
          const insertedNote: NoteType = { ...dragNote, columnId: col.id, order: dragState.currentIndex }
          displayNotes.splice(dragState.currentIndex, 0, insertedNote)
        }
      }

      displayNotes.forEach((n, i) => {
        n.order = i
      })
    }

    const count = colNotes.length + 
      (dragState && isDraggingToThisCol && dragState.fromColumnId !== col.id ? 1 : 0) - 
      (dragState && isDraggingFromThisCol && !isDraggingToThisCol ? 1 : 0)

    return (
      <div key={col.id} className="column" data-column={col.id}>
        <div className="column-header">
          <span className="column-title">{col.name}</span>
          <span className={`column-count ${bumpColumns.has(col.id) ? 'bump' : ''}`}>
            {count}
          </span>
        </div>
        <div
          className={`column-body ${isHover ? 'drag-over' : ''}`}
          onDoubleClick={(e) => handleDoubleClick(col.id, e)}
        >
          {displayNotes.map((note, idx) => (
            <div 
              key={note.id} 
              className={`note-wrapper ${dragState?.noteId === note.id ? 'dragging' : ''}`}
              style={{ position: 'relative' }}
            >
              {dragState && isHover && idx === dragState.currentIndex && dragState.noteId !== note.id && (
                <div className="drag-indicator" />
              )}
              <Note
                note={note}
                isDragging={dragState?.noteId === note.id}
                onDragStart={(e) => handleDragStart(note, e)}
                onUpdate={(data) => onUpdateNote({ ...data, id: note.id })}
                onDelete={() => onDeleteNote(note.id)}
              />
            </div>
          ))}
          {dragState && isHover && dragState.currentIndex >= displayNotes.length && (
            <div className="drag-indicator" />
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="board-container" ref={boardRef}>
      {columns.map(renderColumn)}
    </div>
  )
}

export default Board
