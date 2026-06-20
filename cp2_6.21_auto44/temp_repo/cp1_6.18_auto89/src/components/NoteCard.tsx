import React, { useState, useRef, useCallback, useEffect } from 'react'
import { useNoteStore, Priority } from '../stores/noteStore'

interface NoteCardProps {
  id: string
  content: string
  color: string
  x: number
  y: number
  priority: Priority
  tags: string[]
  isDragging: boolean
  otherDragging: boolean
}

const PRIORITY_LABELS: Record<Priority, string> = {
  high: '高',
  medium: '中',
  low: '低',
}

const NoteCard: React.FC<NoteCardProps> = ({
  id,
  content,
  color,
  x,
  y,
  priority,
  tags,
  isDragging,
  otherDragging,
}) => {
  const { deleteNote, moveNote, updateNoteContent, updateNotePriority, setDraggingId } =
    useNoteStore()
  const [editing, setEditing] = useState(false)
  const [localContent, setLocalContent] = useState(content)
  const [deleting, setDeleting] = useState(false)
  const [showPriorityMenu, setShowPriorityMenu] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const dragRef = useRef<{ startX: number; startY: number; noteX: number; noteY: number } | null>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setLocalContent(content)
  }, [content])

  useEffect(() => {
    if (editing && textareaRef.current) {
      textareaRef.current.focus()
      textareaRef.current.selectionStart = textareaRef.current.value.length
    }
  }, [editing])

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (editing) return
      const target = e.target as HTMLElement
      if (target.closest('.note-delete-btn') || target.closest('.note-priority-btn') || target.closest('.priority-menu') || target.tagName === 'TEXTAREA') return
      e.preventDefault()
      setDraggingId(id)
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        noteX: x,
        noteY: y,
      }

      const handleMouseMove = (ev: MouseEvent) => {
        if (!dragRef.current) return
        const dx = ev.clientX - dragRef.current.startX
        const dy = ev.clientY - dragRef.current.startY
        moveNote(id, dragRef.current.noteX + dx, dragRef.current.noteY + dy)
      }

      const handleMouseUp = () => {
        setDraggingId(null)
        dragRef.current = null
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
      }

      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    },
    [editing, id, x, y, setDraggingId, moveNote]
  )

  const handleContentClick = (e: React.MouseEvent) => {
    e.stopPropagation()
  }

  const handleContentDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setEditing(true)
  }

  const handleBlur = () => {
    setEditing(false)
    if (localContent !== content) {
      updateNoteContent(id, localContent)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setEditing(false)
      updateNoteContent(id, localContent)
    }
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    setDeleting(true)
    setTimeout(() => {
      deleteNote(id)
    }, 200)
  }

  const handlePriorityChange = (p: Priority) => {
    updateNotePriority(id, p)
    setShowPriorityMenu(false)
  }

  return (
    <div
      ref={cardRef}
      className="note-card"
      onMouseDown={handleMouseDown}
      style={{
        left: x,
        top: y,
        backgroundColor: color,
        opacity: otherDragging ? 0.6 : 1,
        transform: isDragging ? 'rotate(2deg) scale(1.02)' : deleting ? 'scale(0.5) rotate(90deg)' : 'none',
        boxShadow: isDragging
          ? '0 8px 24px rgba(0,0,0,0.15)'
          : '0 2px 8px rgba(0,0,0,0.08)',
        zIndex: isDragging ? 9999 : 1,
        transition: isDragging ? 'box-shadow 0.15s ease, opacity 0.15s ease' : 'all 0.15s ease',
        cursor: editing ? 'text' : 'grab',
      }}
    >
      {priority === 'high' && (
        <div
          style={{
            position: 'absolute',
            top: 8,
            left: 8,
            width: 10,
            height: 10,
            borderRadius: '50%',
            backgroundColor: '#FF5252',
          }}
        />
      )}

      <button
        className="note-delete-btn"
        onClick={handleDelete}
        title="删除便签"
        style={{
          position: 'absolute',
          top: -6,
          right: -6,
          width: 20,
          height: 20,
          borderRadius: '50%',
          border: 'none',
          backgroundColor: '#FF5252',
          color: '#fff',
          fontSize: 11,
          lineHeight: '20px',
          textAlign: 'center',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 0,
          transition: 'transform 0.15s ease, width 0.15s ease, height 0.15s ease',
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget
          el.style.width = '22px'
          el.style.height = '22px'
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget
          el.style.width = '20px'
          el.style.height = '20px'
        }}
      >
        ×
      </button>

      <div
        className="note-priority-btn"
        onClick={(e) => {
          e.stopPropagation()
          setShowPriorityMenu(!showPriorityMenu)
        }}
        style={{
          position: 'absolute',
          top: 6,
          right: 18,
          fontSize: 11,
          color: '#999',
          cursor: 'pointer',
          userSelect: 'none',
          padding: '2px 4px',
          borderRadius: 4,
          transition: 'background-color 0.15s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.06)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent'
        }}
      >
        {PRIORITY_LABELS[priority]}
      </div>

      {showPriorityMenu && (
        <div
          className="priority-menu"
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            top: 24,
            right: 10,
            backgroundColor: '#fff',
            borderRadius: 8,
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            zIndex: 100,
            overflow: 'hidden',
            fontSize: 12,
          }}
        >
          {(['high', 'medium', 'low'] as Priority[]).map((p) => (
            <div
              key={p}
              onClick={() => handlePriorityChange(p)}
              style={{
                padding: '6px 16px',
                cursor: 'pointer',
                backgroundColor: priority === p ? '#f0f0f0' : 'transparent',
                transition: 'background-color 0.1s ease',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f5f5f5'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = priority === p ? '#f0f0f0' : 'transparent'
              }}
            >
              {p === 'high' && (
                <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#FF5252', display: 'inline-block' }} />
              )}
              {PRIORITY_LABELS[p]}
            </div>
          ))}
        </div>
      )}

      <div
        onDoubleClick={handleContentDoubleClick}
        onClick={handleContentClick}
        style={{
          minHeight: 60,
          padding: '24px 10px 10px 10px',
          width: '100%',
        }}
      >
        {editing ? (
          <textarea
            ref={textareaRef}
            value={localContent}
            onChange={(e) => setLocalContent(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            style={{
              width: '100%',
              minHeight: 40,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontSize: 16,
              color: '#333',
              resize: 'none',
              fontFamily: 'inherit',
              lineHeight: 1.4,
            }}
          />
        ) : (
          <div
            style={{
              fontSize: 16,
              color: '#333',
              lineHeight: 1.4,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              minHeight: 20,
              cursor: 'text',
            }}
          >
            {content || <span style={{ color: '#bbb' }}>双击编辑...</span>}
          </div>
        )}
      </div>

      {tags.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 4,
            padding: '0 10px 8px',
          }}
        >
          {tags.map((tag) => (
            <span
              key={tag}
              style={{
                fontSize: 11,
                padding: '1px 6px',
                borderRadius: 8,
                backgroundColor: 'rgba(0,0,0,0.06)',
                color: '#666',
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export default NoteCard
