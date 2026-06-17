import {
  memo,
  useState,
  useEffect,
  useRef,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from 'react'
import { Task, Priority } from '../types'
import { useBoardStore } from '../store'

interface TaskCardProps {
  task: Task
  isDeleting: boolean
  refEl: (el: HTMLDivElement | null) => void
  onDragStart: (e: React.DragEvent) => void
  onClick: () => void
}

const priorityLabel: Record<Priority, string> = {
  high: '高',
  medium: '中',
  low: '低',
}

function getInitial(name: string): string {
  if (!name) return '?'
  const ch = name.trim().charAt(0)
  return ch.toUpperCase()
}

function formatTime(ts: number): string {
  const d = new Date(ts)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${day} ${hh}:${mm}`
}

const TaskCardInner = memo(function TaskCardInner({
  task,
  isDeleting,
  refEl,
  onDragStart,
  onClick,
}: TaskCardProps) {
  const removeTaskAfterAnimation = useBoardStore(
    (s) => s.removeTaskAfterAnimation
  )
  const cardRef = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState(false)

  useEffect(() => {
    refEl(cardRef.current)
    return () => refEl(null)
  }, [refEl])

  useEffect(() => {
    if (isDeleting) {
      const t = window.setTimeout(() => {
        removeTaskAfterAnimation(task.id)
      }, 260)
      return () => window.clearTimeout(t)
    }
  }, [isDeleting, task.id, removeTaskAfterAnimation])

  const handleDragStart = (e: React.DragEvent) => {
    setDragging(true)
    onDragStart(e)
  }

  const handleDragEnd = () => {
    setDragging(false)
  }

  const classes = [
    'task-card',
    dragging ? 'dragging' : '',
    isDeleting ? 'deleting' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      ref={cardRef}
      className={classes}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={onClick}
    >
      <div className="task-card-title">{task.title}</div>
      <div className="task-card-footer">
        <span className={`priority-tag ${task.priority}`}>
          {priorityLabel[task.priority]}优先级
        </span>
        <div
          className="avatar"
          style={{ backgroundColor: task.creatorAvatar }}
        >
          {getInitial(task.title)}
        </div>
      </div>
    </div>
  )
})

export default TaskCardInner

interface DetailPanelProps {
  task: Task
  onClose: () => void
}

interface DetailPanelHandle {
  focus: () => void
}

const DetailPanelInner = forwardRef<DetailPanelHandle, DetailPanelProps>(
  function DetailPanelInner({ task, onClose }, ref) {
    const updateTask = useBoardStore((s) => s.updateTask)
    const deleteTask = useBoardStore((s) => s.deleteTask)

    const [visible, setVisible] = useState(false)
    const [title, setTitle] = useState(task.title)
    const [description, setDescription] = useState(task.description)
    const [priority, setPriority] = useState<Priority>(task.priority)

    const titleSaveTimer = useRef<number | null>(null)
    const descSaveTimer = useRef<number | null>(null)

    useImperativeHandle(ref, () => ({
      focus: () => {},
    }))

    useEffect(() => {
      const frame = requestAnimationFrame(() => setVisible(true))
      return () => cancelAnimationFrame(frame)
    }, [])

    useEffect(() => {
      const onKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose()
      }
      window.addEventListener('keydown', onKey)
      return () => window.removeEventListener('keydown', onKey)
    }, [onClose])

    const scheduleTitleSave = useCallback(
      (val: string) => {
        if (titleSaveTimer.current !== null) {
          window.clearTimeout(titleSaveTimer.current)
        }
        titleSaveTimer.current = window.setTimeout(() => {
          if (val.trim() && val !== task.title) {
            updateTask(task.id, { title: val.trim() })
          }
          titleSaveTimer.current = null
        }, 400)
      },
      [task.id, task.title, updateTask]
    )

    const scheduleDescSave = useCallback(
      (val: string) => {
        if (descSaveTimer.current !== null) {
          window.clearTimeout(descSaveTimer.current)
        }
        descSaveTimer.current = window.setTimeout(() => {
          if (val !== task.description) {
            updateTask(task.id, { description: val })
          }
          descSaveTimer.current = null
        }, 500)
      },
      [task.id, task.description, updateTask]
    )

    useEffect(() => {
      return () => {
        if (titleSaveTimer.current !== null) {
          window.clearTimeout(titleSaveTimer.current)
          if (title.trim() && title !== task.title) {
            updateTask(task.id, { title: title.trim() })
          }
        }
        if (descSaveTimer.current !== null) {
          window.clearTimeout(descSaveTimer.current)
          if (description !== task.description) {
            updateTask(task.id, { description })
          }
        }
      }
    }, [title, description, task, updateTask])

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value
      setTitle(v)
      scheduleTitleSave(v)
    }

    const handleDescChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const v = e.target.value
      setDescription(v)
      scheduleDescSave(v)
    }

    const handlePriorityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const v = e.target.value as Priority
      setPriority(v)
      if (v !== task.priority) {
        updateTask(task.id, { priority: v })
      }
    }

    const handleDelete = () => {
      deleteTask(task.id)
      onClose()
    }

    return (
      <aside className={`detail-panel ${visible ? 'visible' : ''}`}>
        <div className="detail-panel-header">
          <h2 className="detail-panel-title">任务详情</h2>
          <button
            type="button"
            className="close-btn"
            onClick={onClose}
            aria-label="关闭"
          >
            ×
          </button>
        </div>

        <div className="detail-panel-body">
          <div className="form-group">
            <label className="form-label" htmlFor={`title-${task.id}`}>
              任务标题
            </label>
            <input
              id={`title-${task.id}`}
              type="text"
              className="form-input"
              value={title}
              onChange={handleTitleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor={`desc-${task.id}`}>
              任务描述
            </label>
            <textarea
              id={`desc-${task.id}`}
              className="form-textarea"
              value={description}
              onChange={handleDescChange}
              placeholder="添加任务的详细描述..."
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor={`priority-${task.id}`}>
              优先级
            </label>
            <select
              id={`priority-${task.id}`}
              className="form-select"
              value={priority}
              onChange={handlePriorityChange}
            >
              <option value="high">高优先级</option>
              <option value="medium">中优先级</option>
              <option value="low">低优先级</option>
            </select>
          </div>

          <div className="time-info">
            <div className="time-item">
              创建时间：{formatTime(task.createdAt)}
            </div>
            <div className="time-item">
              最后修改：{formatTime(task.updatedAt)}
            </div>
          </div>
        </div>

        <div className="detail-panel-footer">
          <button type="button" className="delete-btn" onClick={handleDelete}>
            删除任务
          </button>
        </div>
      </aside>
    )
  }
)

DetailPanelInner.displayName = 'DetailPanel'

interface DetailPanelExport {
  (props: DetailPanelProps): JSX.Element
}

const DetailPanelWrapper: DetailPanelExport = (props) => {
  return <DetailPanelInner {...props} />
}
;(TaskCardInner as unknown as { DetailPanel: DetailPanelExport }).DetailPanel =
  DetailPanelWrapper

export const DetailPanel = DetailPanelWrapper
