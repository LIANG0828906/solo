import { useState, useCallback } from 'react'
import { useDraggable } from '@dnd-kit/core'
import { Task, TaskStatus, useTaskStore } from '../hooks/useTaskStore'

interface TaskCardProps {
  task: Task
  isHighlighted?: boolean
  highlightType?: 'upstream' | 'downstream' | null
  onDrop?: (targetId: string) => void
  draggable?: boolean
}

const statusLabels: Record<TaskStatus, string> = {
  todo: '待办',
  'in-progress': '进行中',
  done: '已完成',
}

const statusColors: Record<TaskStatus, string> = {
  todo: '#f59e0b',
  'in-progress': '#3b82f6',
  done: '#10b981',
}

export function TaskCard({
  task,
  isHighlighted,
  highlightType,
  onDrop,
  draggable = true,
}: TaskCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(task.name)
  const [editDate, setEditDate] = useState(task.dueDate)

  const updateTask = useTaskStore((s) => s.updateTask)
  const deleteTask = useTaskStore((s) => s.deleteTask)
  const setHighlightedTask = useTaskStore((s) => s.setHighlightedTask)
  const highlightedTaskId = useTaskStore((s) => s.highlightedTaskId)

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable(
    {
      id: task.id,
      data: { taskId: task.id, type: 'task' },
      disabled: !draggable,
    }
  )

  const handleSave = useCallback(() => {
    if (editName.trim()) {
      updateTask(task.id, { name: editName.trim(), dueDate: editDate })
    }
    setIsEditing(false)
  }, [task.id, editName, editDate, updateTask])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      setEditName(task.name)
      setEditDate(task.dueDate)
      setIsEditing(false)
    }
  }

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateTask(task.id, { status: e.target.value as TaskStatus })
  }

  const handleClick = () => {
    if (!isDragging) {
      if (highlightedTaskId === task.id) {
        setHighlightedTask(null)
      } else {
        setHighlightedTask(task.id)
      }
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.currentTarget.classList.add('drag-over')
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('drag-over')
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.currentTarget.classList.remove('drag-over')
    const sourceId = e.dataTransfer.getData('text/plain')
    if (sourceId && sourceId !== task.id && onDrop) {
      onDrop(task.id)
    }
  }

  const style: React.CSSProperties = {
    opacity: isDragging ? 0.5 : 1,
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    zIndex: isDragging ? 1000 : 1,
  }

  if (highlightType === 'downstream') {
    style.borderColor = '#3b82f6'
    style.boxShadow = '0 0 20px rgba(59, 130, 246, 0.4)'
  } else if (highlightType === 'upstream') {
    style.borderColor = '#f97316'
    style.boxShadow = '0 0 20px rgba(249, 115, 22, 0.4)'
  }

  return (
    <div
      ref={setNodeRef}
      className={`task-card ${task.hasCycle ? 'cycle-warning' : ''} ${
        isHighlighted ? 'highlighted' : ''
      }`}
      style={style}
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="task-card-header">
        <div className="task-drag-handle" {...listeners} {...attributes}>
          <span className="drag-icon">⋮⋮</span>
        </div>
        <select
          className="task-status-select"
          value={task.status}
          onChange={handleStatusChange}
          style={{ borderColor: statusColors[task.status] }}
          onClick={(e) => e.stopPropagation()}
        >
          <option value="todo">{statusLabels.todo}</option>
          <option value="in-progress">{statusLabels['in-progress']}</option>
          <option value="done">{statusLabels.done}</option>
        </select>
        <button
          className="task-delete-btn"
          onClick={(e) => {
            e.stopPropagation()
            if (confirm('确定要删除这个任务吗？')) {
              deleteTask(task.id)
            }
          }}
        >
          ×
        </button>
      </div>

      <div className="task-card-content">
        {isEditing ? (
          <div className="task-edit-form" onClick={(e) => e.stopPropagation()}>
            <input
              type="text"
              className="task-name-input"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
            />
            <input
              type="date"
              className="task-date-input"
              value={editDate}
              onChange={(e) => setEditDate(e.target.value)}
            />
            <div className="task-edit-actions">
              <button className="btn-primary" onClick={handleSave}>
                保存
              </button>
              <button
                className="btn-secondary"
                onClick={() => {
                  setEditName(task.name)
                  setEditDate(task.dueDate)
                  setIsEditing(false)
                }}
              >
                取消
              </button>
            </div>
          </div>
        ) : (
          <div onDoubleClick={() => setIsEditing(true)}>
            <h4 className="task-name">{task.name}</h4>
            <div className="task-due-date">
              <span className="date-icon">📅</span>
              {task.dueDate}
            </div>
          </div>
        )}
      </div>

      {task.hasCycle && (
        <div className="cycle-badge">⚠️ 循环依赖</div>
      )}
    </div>
  )
}
