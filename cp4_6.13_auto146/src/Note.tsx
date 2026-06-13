import { useState, useRef, useEffect } from 'react'
import { marked } from 'marked'
import type { Note as NoteType } from './types'

interface NoteProps {
  note: NoteType & { _remoteUpdate?: boolean; _remoteMove?: boolean }
  isDragging: boolean
  onDragStart: (e: React.MouseEvent | React.TouchEvent) => void
  onUpdate: (data: Partial<NoteType>) => void
  onDelete: () => void
}

const COLOR_OPTIONS = [
  '#d0e8ff',
  '#ffe6cc',
  '#d4edda',
  '#f8d7da',
  '#fff3cd',
  '#e2d9f3',
]

function Note({ note, isDragging, onDragStart, onUpdate, onDelete }: NoteProps) {
  const [editing, setEditing] = useState(false)
  const [titleDraft, setTitleDraft] = useState(note.title)
  const [contentDraft, setContentDraft] = useState(note.content)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [overflowing, setOverflowing] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  const titleInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing && titleInputRef.current) {
      titleInputRef.current.focus()
      titleInputRef.current.select()
    }
  }, [editing])

  useEffect(() => {
    const el = contentRef.current
    if (el && !editing) {
      setOverflowing(el.scrollHeight > el.clientHeight)
    }
  }, [note.content, editing])

  const handleTitleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setEditing(true)
    setTitleDraft(note.title)
    setContentDraft(note.content)
  }

  const saveEdits = () => {
    const newTitle = titleDraft.slice(0, 30)
    if (newTitle !== note.title || contentDraft !== note.content) {
      onUpdate({ title: newTitle, content: contentDraft })
    }
    setEditing(false)
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    setRemoving(true)
    setTimeout(() => onDelete(), 250)
  }

  const handleColorSelect = (color: string, e: React.MouseEvent) => {
    e.stopPropagation()
    onUpdate({ color })
    setShowColorPicker(false)
  }

  const toggleColorPicker = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowColorPicker((prev) => !prev)
  }

  const renderMarkdown = (text: string) => {
    try {
      return marked.parse(text, { async: false }) as string
    } catch {
      return text
    }
  }

  const noteClass = [
    'note',
    isDragging ? 'dragging' : '',
    removing ? 'removing' : '',
    (note as any)._remoteUpdate ? 'note-remote-update' : '',
    (note as any)._remoteMove ? 'moving' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      className={noteClass}
      data-note-id={note.id}
      style={{ backgroundColor: note.color }}
      onMouseDown={onDragStart}
      onTouchStart={onDragStart}
      onClick={(e) => {
        if (showColorPicker) setShowColorPicker(false)
      }}
    >
      <div className="note-actions">
        <button
          className="note-action-btn"
          title="更换颜色"
          onClick={toggleColorPicker}
          onMouseDown={(e) => e.stopPropagation()}
        >
          🎨
        </button>
        <button
          className="note-action-btn"
          title="删除"
          onClick={handleDelete}
          onMouseDown={(e) => e.stopPropagation()}
        >
          ✕
        </button>
      </div>

      {showColorPicker && (
        <div className="color-picker" onMouseDown={(e) => e.stopPropagation()}>
          {COLOR_OPTIONS.map((c) => (
            <div
              key={c}
              className="color-dot"
              style={{ backgroundColor: c, borderColor: note.color === c ? '#333' : 'transparent' }}
              onClick={(e) => handleColorSelect(c, e)}
            />
          ))}
        </div>
      )}

      {editing ? (
        <div className="note-title editing">
          <input
            ref={titleInputRef}
            value={titleDraft}
            maxLength={30}
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={saveEdits}
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveEdits()
              if (e.key === 'Escape') setEditing(false)
              e.stopPropagation()
            }}
            onMouseDown={(e) => e.stopPropagation()}
          />
        </div>
      ) : (
        <div className="note-title" onDoubleClick={handleTitleDoubleClick}>
          {note.title || '无标题'}
        </div>
      )}

      {editing ? (
        <div className="note-edit-area" onMouseDown={(e) => e.stopPropagation()}>
          <textarea
            value={contentDraft}
            onChange={(e) => setContentDraft(e.target.value)}
            placeholder="支持 Markdown 格式..."
            onKeyDown={(e) => {
              if (e.key === 'Escape') saveEdits()
              e.stopPropagation()
            }}
          />
          {contentDraft && (
            <>
              <div className="preview-label">预览</div>
              <div
                className="note-preview"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(contentDraft) }}
              />
            </>
          )}
        </div>
      ) : (
        <div
          ref={contentRef}
          className={`note-content ${overflowing ? 'overflowing' : ''}`}
          onDoubleClick={handleTitleDoubleClick}
          dangerouslySetInnerHTML={{ __html: renderMarkdown(note.content || '双击编辑内容...') }}
        />
      )}

      <div className="note-footer">
        <span className="note-creator">@{note.creator}</span>
        <span>{note.createdAt}</span>
      </div>
    </div>
  )
}

export default Note
