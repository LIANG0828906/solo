import { useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
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
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const [outline, setOutline] = useState<CourseChapter[]>(course.outline)

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id)
    e.dataTransfer.effectAllowed = 'move'
    const element = e.target as HTMLElement
    element.style.opacity = '0.5'
    setTimeout(() => {
      element.style.opacity = '1'
    }, 0)
  }

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (dragOverId !== id) {
      setDragOverId(id)
    }
  }

  const handleDragLeave = () => {
    setDragOverId(null)
  }

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null)
      setDragOverId(null)
      return
    }
    const newOutline = [...outline]
    const draggedIndex = newOutline.findIndex(c => c.id === draggedId)
    const targetIndex = newOutline.findIndex(c => c.id === targetId)
    const [draggedItem] = newOutline.splice(draggedIndex, 1)
    newOutline.splice(targetIndex, 0, draggedItem)
    newOutline.forEach((item, idx) => {
      item.order = idx + 1
    })
    setOutline(newOutline)
    setDraggedId(null)
    setDragOverId(null)
    if (onEdit) {
      onEdit({ ...course, outline: newOutline })
    }
  }

  const handleDragEnd = () => {
    setDraggedId(null)
    setDragOverId(null)
  }

  const renderStars = (level: number) => {
    return '★'.repeat(level) + '☆'.repeat(3 - level)
  }

  return (
    <div className="glass-card course-card" data-category={course.category}>
      <div className="course-card-top">
        <h3 className="course-card-title">{course.name}</h3>
        <span className={`category-tag ${course.category}`}>
          {course.category}
        </span>
      </div>
      <div className="difficulty-stars">
        {renderStars(course.difficulty)} 难度等级 {course.difficulty}
      </div>

      {showEnroll && isEnrolled && (
        <div className="progress-section">
          <div className="progress-ring-container">
            <svg width="64" height="64">
              <circle
                cx="32"
                cy="32"
                r="28"
                fill="none"
                stroke="rgba(0,0,0,0.1)"
                strokeWidth="6"
              />
              <circle
                cx="32"
                cy="32"
                r="28"
                fill="none"
                stroke="url(#progressGradient)"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 28}`}
                strokeDashoffset={`${2 * Math.PI * 28 * (1 - progress / 100)}`}
                transform="rotate(-90 32 32)"
                style={{ transition: 'stroke-dashoffset 1s ease' }}
              />
              <defs>
                <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#667eea" />
                  <stop offset="100%" stopColor="#764ba2" />
                </linearGradient>
              </defs>
            </svg>
            <span className="progress-ring-text">{progress}%</span>
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

export { uuidv4 }
