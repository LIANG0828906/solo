import { useState, useRef, useCallback } from 'react'
import type { Course, CourseChapter } from '../utils/types'

interface Props {
  course: Course
  onEdit?: (course: Course) => void
  onDelete?: (id: string) => void
  onEnroll?: (id: string) => void
  onStartQuiz?: (id: string) => void
  isEnrolled?: boolean
  progress?: number
  showEnroll?: boolean
  children?: React.ReactNode
}

export default function CourseCard({
  course,
  onEdit,
  onDelete,
  onEnroll,
  onStartQuiz,
  isEnrolled,
  progress = 0,
  showEnroll = false,
  children
}: Props) {
  const [outline, setOutline] = useState<CourseChapter[]>(course.outline)
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const [ghostStyle, setGhostStyle] = useState<React.CSSProperties>({})
  const [placeholderStyle, setPlaceholderStyle] = useState<React.CSSProperties>({})
  const dragNodeRef = useRef<HTMLElement | null>(null)
  const isDragging = useRef(false)

  const handleDragStart = useCallback((e: React.DragEvent<HTMLLIElement>, id: string) => {
    isDragging.current = true
    setDraggedId(id)
    dragNodeRef.current = e.currentTarget

    const ghost = e.currentTarget.cloneNode(true) as HTMLElement
    ghost.style.position = 'absolute'
    ghost.style.top = '-9999px'
    ghost.style.opacity = '0.7'
    ghost.style.transform = 'scale(1.03)'
    ghost.style.pointerEvents = 'none'
    ghost.style.width = `${e.currentTarget.offsetWidth}px`
    ghost.style.background = 'rgba(102,126,234,0.15)'
    ghost.style.borderRadius = '8px'
    ghost.style.padding = '8px 12px'
    ghost.style.boxShadow = '0 8px 24px rgba(102,126,234,0.25)'
    document.body.appendChild(ghost)
    e.dataTransfer.setDragImage(ghost, e.currentTarget.offsetWidth / 2, 20)

    setTimeout(() => {
      document.body.removeChild(ghost)
    }, 0)

    setPlaceholderStyle({ opacity: 0.3, transition: 'opacity 0.3s ease' })
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent<HTMLLIElement>, id: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (dragOverId !== id) {
      setDragOverId(id)
    }
  }, [dragOverId])

  const handleDragLeave = useCallback(() => {
    setDragOverId(null)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent<HTMLLIElement>, targetId: string) => {
    e.preventDefault()
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null)
      setDragOverId(null)
      setPlaceholderStyle({})
      return
    }
    const newOutline = [...outline]
    const draggedIndex = newOutline.findIndex(c => c.id === draggedId)
    const targetIndex = newOutline.findIndex(c => c.id === targetId)
    if (draggedIndex === -1 || targetIndex === -1) return
    const [draggedItem] = newOutline.splice(draggedIndex, 1)
    newOutline.splice(targetIndex, 0, draggedItem)
    newOutline.forEach((item, idx) => { item.order = idx + 1 })
    setOutline(newOutline)
    setDraggedId(null)
    setDragOverId(null)
    setPlaceholderStyle({})
    if (onEdit) {
      onEdit({ ...course, outline: newOutline })
    }
  }, [draggedId, outline, course, onEdit])

  const handleDragEnd = useCallback(() => {
    isDragging.current = false
    setDraggedId(null)
    setDragOverId(null)
    setPlaceholderStyle({})
    setGhostStyle({})
  }, [])

  const renderStars = (level: number) => '★'.repeat(level) + '☆'.repeat(3 - level)

  return (
    <div className="glass-card course-card" data-category={course.category}>
      <div className="course-card-top">
        <h3 className="course-card-title">{course.name}</h3>
        <span className={`category-tag ${course.category}`}>{course.category}</span>
      </div>
      <div className="difficulty-stars">
        {renderStars(course.difficulty)} 难度等级 {course.difficulty}
      </div>

      {showEnroll && isEnrolled && (
        <div className="progress-section">
          <div className="progress-ring-container" style={{ width: 64, height: 64 }}>
            <svg width="64" height="64">
              <defs>
                <linearGradient id={`cardRing-${course.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#667eea" />
                  <stop offset="100%" stopColor="#764ba2" />
                </linearGradient>
              </defs>
              <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="6" />
              <circle
                cx="32" cy="32" r="26" fill="none"
                stroke={`url(#cardRing-${course.id})`}
                strokeWidth="6" strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 26}`}
                strokeDashoffset={`${2 * Math.PI * 26 * (1 - progress / 100)}`}
                transform="rotate(-90 32 32)"
                style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)' }}
              />
            </svg>
            <span className="progress-ring-text" style={{ fontSize: '14px' }}>{progress}%</span>
          </div>
          <div className="progress-info">
            <div className="progress-info-title">学习进度</div>
            <div className="progress-info-text">
              {progress === 100 ? '已完成全部学习' : `已完成 ${Math.round(course.outline.length * progress / 100)} / ${course.outline.length} 章节`}
            </div>
          </div>
        </div>
      )}

      <div className="course-card-outline">
        <div className="outline-title">
          <i className="fa fa-list-ul" /> 课程大纲
        </div>
        <ul className="outline-list">
          {outline.slice(0, 3).map(chapter => (
            <li
              key={chapter.id}
              className={`outline-item ${draggedId === chapter.id ? 'dragging' : ''} ${dragOverId === chapter.id ? 'drag-over' : ''}`}
              style={draggedId === chapter.id ? placeholderStyle : undefined}
              draggable={!!onEdit}
              onDragStart={(e) => handleDragStart(e, chapter.id)}
              onDragOver={(e) => handleDragOver(e, chapter.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, chapter.id)}
              onDragEnd={handleDragEnd}
            >
              {onEdit && <i className="fa fa-bars drag-handle" />}
              <span className="outline-number">{chapter.order}</span>
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {chapter.title}
              </span>
            </li>
          ))}
          {outline.length > 3 && (
            <li className="outline-item" style={{ cursor: 'default', color: '#999' }}>
              <span style={{ marginLeft: onEdit ? '20px' : '28px' }}>
                ...还有 {outline.length - 3} 个章节
              </span>
            </li>
          )}
        </ul>
      </div>

      {children}

      <div className="course-card-actions">
        {onEdit && (
          <button className="btn btn-sm btn-primary" onClick={() => onEdit(course)}>
            <i className="fa fa-pencil" /> 编辑
          </button>
        )}
        {onDelete && (
          <button className="btn btn-sm btn-danger" onClick={() => onDelete(course.id)}>
            <i className="fa fa-trash" /> 删除
          </button>
        )}
        {showEnroll && !isEnrolled && (
          <button className="btn btn-sm btn-success" onClick={() => onEnroll && onEnroll(course.id)}>
            <i className="fa fa-plus" /> 报名学习
          </button>
        )}
        {showEnroll && isEnrolled && (
          <button className="btn btn-sm btn-primary" onClick={() => onStartQuiz && onStartQuiz(course.id)}>
            <i className="fa fa-play-circle" /> {progress === 100 ? '重新测验' : '开始测验'}
          </button>
        )}
      </div>
    </div>
  )
}
