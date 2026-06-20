import { motion } from 'framer-motion'
import { Clock, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export type Priority = 'high' | 'medium' | 'low'

export interface Task {
  id: string
  title: string
  description: string
  priority: Priority
  estimatedHours: number
  lastCheckin?: string | null
  status: 'todo' | 'in-progress' | 'done'
}

export interface User {
  id: string
  name: string
  avatar: string
}

interface TaskCardProps {
  task: Task
  user: User
  onCheckin: (taskId: string) => void
  onDragStart: (e: React.DragEvent, taskId: string) => void
  onDragEnd: (e: React.DragEvent) => void
  isDragging: boolean
}

const priorityConfig: Record<Priority, { color: string; label: string; bg: string }> = {
  high: { color: 'bg-red-500', label: '高优先级', bg: 'bg-red-50 text-red-700' },
  medium: { color: 'bg-yellow-500', label: '中优先级', bg: 'bg-yellow-50 text-yellow-700' },
  low: { color: 'bg-green-500', label: '低优先级', bg: 'bg-green-50 text-green-700' },
}

export default function TaskCard({
  task,
  user,
  onCheckin,
  onDragStart,
  onDragEnd,
  isDragging,
}: TaskCardProps) {
  const priority = priorityConfig[task.priority]

  const formatLastCheckin = (dateStr: string | null | undefined) => {
    if (!dateStr) return '暂无打卡记录'
    const date = new Date(dateStr)
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: isDragging ? 0.5 : 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      draggable
      onDragStart={(e) => onDragStart(e as unknown as React.DragEvent, task.id)}
      onDragEnd={(e) => onDragEnd(e as unknown as React.DragEvent)}
      className={cn(
        'bg-white rounded-lg p-4 shadow-sm border border-gray-200 cursor-grab active:cursor-grabbing',
        'hover:shadow-md transition-shadow',
        isDragging && 'opacity-50'
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={cn('inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium', priority.bg)}>
          <span className={cn('w-2 h-2 rounded-full', priority.color)} />
          {priority.label}
        </div>
        <img
          src={user.avatar}
          alt={user.name}
          className="w-6 h-6 rounded-full"
        />
      </div>

      <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">
        {task.title}
      </h3>
      <p className="text-sm text-gray-500 mb-3 line-clamp-2">
        {task.description}
      </p>

      <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
        <div className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          <span>{task.estimatedHours}h</span>
        </div>
        <div className="flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>{formatLastCheckin(task.lastCheckin)}</span>
        </div>
      </div>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => onCheckin(task.id)}
        className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
      >
        打卡
      </motion.button>
    </motion.div>
  )
}
