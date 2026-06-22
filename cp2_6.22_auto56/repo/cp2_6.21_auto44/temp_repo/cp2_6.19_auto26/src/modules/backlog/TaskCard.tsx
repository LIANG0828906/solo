import { useAppStore, type Priority, type TaskStatus } from '@/store/useAppStore'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Clock, User, AlertTriangle, Minus, CheckCircle2 } from 'lucide-react'
import { clsx } from 'clsx'

interface TaskCardProps {
  taskId: string
  onEdit: (id: string) => void
}

const priorityConfig: Record<Priority, { color: string; label: string }> = {
  high: { color: 'bg-priority-high', label: '高' },
  medium: { color: 'bg-priority-medium', label: '中' },
  low: { color: 'bg-priority-low', label: '低' },
}

const statusConfig: Record<TaskStatus, { color: string; label: string; icon: typeof AlertTriangle }> = {
  todo: { color: 'text-status-todo', label: '未开始', icon: Minus },
  'in-progress': { color: 'text-status-progress', label: '进行中', icon: Clock },
  done: { color: 'text-status-done', label: '已完成', icon: CheckCircle2 },
}

export default function TaskCard({ taskId, onEdit }: TaskCardProps) {
  const task = useAppStore(s => s.tasks.find(t => t.id === taskId))
  const teamMembers = useAppStore(s => s.teamMembers)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: taskId })

  if (!task) return null

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const priority = priorityConfig[task.priority]
  const status = statusConfig[task.status]
  const StatusIcon = status.icon
  const assigneeName = teamMembers.find(m => m.id === task.assignee)?.name ?? '未分配'

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={clsx(
        'group relative rounded-xl border border-white/5 bg-secondary/80 p-4',
        'shadow-md shadow-black/20',
        'transition-all duration-300 ease-out',
        'hover:shadow-xl hover:shadow-black/40 hover:-translate-y-1',
        'cursor-pointer',
        isDragging && 'opacity-40 shadow-2xl scale-105',
      )}
      onClick={() => onEdit(task.id)}
    >
      <div className="flex items-start gap-3">
        <button
          className="mt-0.5 cursor-grab text-text-muted hover:text-text-secondary transition-colors active:cursor-grabbing"
          {...attributes}
          {...listeners}
          onClick={e => e.stopPropagation()}
        >
          <GripVertical size={16} />
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className={clsx('inline-block w-2 h-2 rounded-full shrink-0', priority.color)} />
            <h4 className="text-sm font-medium text-text-primary truncate">
              {task.title}
            </h4>
          </div>

          <div className="flex items-center gap-3 text-xs text-text-muted">
            <span className="flex items-center gap-1">
              <StatusIcon size={12} className={status.color} />
              <span className={status.color}>{status.label}</span>
            </span>
            <span className="flex items-center gap-1">
              <User size={12} />
              <span>{assigneeName}</span>
            </span>
            <span className="flex items-center gap-1 font-mono">
              <Clock size={12} />
              <span>{task.completedHours}/{task.estimatedHours}h</span>
            </span>
          </div>

          {task.sprintId && (
            <div className="mt-2 h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-accent to-accent-deep rounded-full transition-all duration-500"
                style={{ width: `${task.estimatedHours > 0 ? (task.completedHours / task.estimatedHours) * 100 : 0}%` }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
