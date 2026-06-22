import { useState, useCallback } from 'react'
import { Draggable } from '@hello-pangea/dnd'
import type { Bookmark } from './api'
import { updateBookmarkNote, deleteBookmark } from './api'

interface BookmarkCardProps {
  bookmark: Bookmark
  index: number
  onDelete: (id: string) => void
}

export default function BookmarkCard({ bookmark, index, onDelete }: BookmarkCardProps) {
  const [isNoteOpen, setIsNoteOpen] = useState(false)
  const [note, setNote] = useState(bookmark.note)
  const [isSaving, setIsSaving] = useState(false)

  const handleNoteChange = useCallback(async (value: string) => {
    setNote(value)
    setIsSaving(true)
    try {
      await updateBookmarkNote(bookmark.id, value)
    } finally {
      setIsSaving(false)
    }
  }, [bookmark.id])

  const handleDelete = useCallback(() => {
    deleteBookmark(bookmark.id)
    onDelete(bookmark.id)
  }, [bookmark.id, onDelete])

  const handleNoteToggle = useCallback(() => {
    setIsNoteOpen(prev => !prev)
  }, [])

  const renderFavicon = () => {
    if (bookmark.favicon) {
      return <img
        src={bookmark.favicon}
        alt={bookmark.title}
        className="favicon"
        onError={(e) => {
          const target = e.target as HTMLImageElement
          target.style.display = 'none'
        }}
      />
    }
    return (
      <div className="favicon-placeholder">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </div>
    )
  }

  return (
    <Draggable draggableId={bookmark.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`bookmark-card ${snapshot.isDragging ? 'dragging' : ''}`}
        >
          <div className="card-content">
            <div className="favicon-container">
              {renderFavicon()}
            </div>
            <div className="info">
              <h3 className="title">{bookmark.title}</h3>
              <p className="description">{bookmark.description || '暂无描述'}</p>
              <a href={bookmark.url} target="_blank" rel="noopener noreferrer" className="url">
                {bookmark.url.slice(0, 40)}{bookmark.url.length > 40 ? '...' : ''}
              </a>
            </div>
          </div>
          
          <div className="card-actions">
            <button className="action-btn note-btn" onClick={handleNoteToggle}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </button>
            <button className="action-btn delete-btn" onClick={handleDelete}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18" />
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              </svg>
            </button>
          </div>
          
          <div className={`note-container ${isNoteOpen ? 'open' : ''}`}>
            <textarea
              className="note-input"
              value={note}
              onChange={(e) => handleNoteChange(e.target.value)}
              placeholder="添加便签（最多200字）"
              maxLength={200}
              onClick={(e) => e.stopPropagation()}
            />
            {isSaving && <span className="saving-indicator">保存中...</span>}
          </div>
        </div>
      )}
    </Draggable>
  )
}