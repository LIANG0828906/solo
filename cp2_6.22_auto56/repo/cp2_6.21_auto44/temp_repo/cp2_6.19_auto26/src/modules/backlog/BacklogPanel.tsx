import { useState, useMemo } from 'react'
import { useAppStore, type Priority, type TaskStatus } from '@/store/useAppStore'
import TaskCard from './TaskCard'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { Plus, Filter, X } from 'lucide-react'
import { clsx } from 'clsx'

interface BacklogPanelProps {
  onEditTask: (id: string) => void
  onDragEnd: (taskId: string, sprintId: string) => void
}

type FilterKey = 'priority' | 'assignee' | 'status'

const PRIORITIES: { value: Priority | 'all'; label: string }[] = [
  { value: 'all', label: '全部优先级' },
  { value: 'high', label: '高' },
  { value: 'medium', label: '中' },
  { value: 'low', label: '低' },
]

const STATUSES: { value: TaskStatus | 'all'; label: string }[] = [
  { value: 'all', label: '全部状态' },
  { value: 'todo', label: '未开始' },
  { value: 'in-progress', label: '进行中' },
  { value: 'done', label: '已完成' },
]

export default function BacklogPanel({ onEditTask, onDragEnd }: BacklogPanelProps) {
  const tasks = useAppStore(s => s.tasks)
  const teamMembers = useAppStore(s => s.teamMembers)
  const addTask = useAppStore(s => s.addTask)
  const sprints = useAppStore(s => s.sprints)

  const [filters, setFilters] = useState<Record<FilterKey, string>>({
    priority: 'all',
    assignee: 'all',
    status: 'all',
  })
  const [showFilters, setShowFilters] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [dragId, setDragId] = useState<string | null>(null)
  const [animKey, setAnimKey] = useState(0)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const backlogTasks = useMemo(() => {
    return tasks.filter(t => !t.sprintId)
  }, [tasks])

  const filteredTasks = useMemo(() => {
    const result = backlogTasks.filter(t => {
      if (filters.priority !== 'all' && t.priority !== filters.priority) return false
      if (filters.assignee !== 'all' && t.assignee !== filters.assignee) return false
      if (filters.status !== 'all' && t.status !== filters.status) return false
      return true
    })
    return result
  }, [backlogTasks, filters])

  const handleDragStart = (event: DragStartEvent) => {
    setDragId(String(event.active.id))
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setDragId(null)
    const { active, over } = event
    if (!over) return

    const taskId = String(active.id)
    const overId = String(over.id)

    const targetSprint = sprints.find(s => s.id === overId || s.taskIds.includes(overId))
    if (targetSprint) {
      onDragEnd(taskId, targetSprint.id)
    }
  }

  const updateFilter = (key: FilterKey, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setAnimKey(k => k + 1)
  }

  const clearFilters = () => {
    setFilters({ priority: 'all', assignee: 'all', status: 'all' })
    setAnimKey(k => k + 1)
  }

  const hasActiveFilters = filters.priority !== 'all' || filters.assignee !== 'all' || filters.status !== 'all'

  const handleAddTask = () => {
    if (!newTitle.trim()) return
    addTask({
      title: newTitle.trim(),
      description: '',
      assignee: teamMembers[0]?.id ?? '',
      priority: 'medium',
      status: 'todo',
      estimatedHours: 8,
      completedHours: 0,
      sprintId: null,
    })
    setNewTitle('')
    setShowAddForm(false)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-5 pb-3">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-text-primary">待办事项</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={clsx(
                'p-1.5 rounded-lg transition-colors',
                hasActiveFilters ? 'bg-accent/20 text-accent' : 'text-text-muted hover:text-text-secondary',
              )}
            >
              <Filter size={16} />
            </button>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="p-1 rounded-lg text-text-muted hover:text-accent transition-colors"
              >
                <X size={14} />
              </button>
            )}
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="p-1.5 rounded-lg text-accent hover:bg-accent/10 transition-colors"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="space-y-2 mb-3 animate-fade-in">
            <select
              value={filters.priority}
              onChange={e => updateFilter('priority', e.target.value)}
              className="w-full bg-surface-light/60 text-text-primary text-xs rounded-lg px-3 py-2 border border-white/5 focus:outline-none focus:border-accent/40 transition-colors"
            >
              {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
            <select
              value={filters.assignee}
              onChange={e => updateFilter('assignee', e.target.value)}
              className="w-full bg-surface-light/60 text-text-primary text-xs rounded-lg px-3 py-2 border border-white/5 focus:outline-none focus:border-accent/40 transition-colors"
            >
              <option value="all">全部成员</option>
              {teamMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
            <select
              value={filters.status}
              onChange={e => updateFilter('status', e.target.value)}
              className="w-full bg-surface-light/60 text-text-primary text-xs rounded-lg px-3 py-2 border border-white/5 focus:outline-none focus:border-accent/40 transition-colors"
            >
              {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        )}

        {showAddForm && (
          <div className="mb-3 animate-fade-in">
            <input
              type="text"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddTask()}
              placeholder="输入任务标题..."
              className="w-full bg-surface-light/60 text-text-primary text-sm rounded-lg px-3 py-2 border border-white/5 focus:outline-none focus:border-accent/40 transition-all placeholder:text-text-muted"
              autoFocus
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleAddTask}
                className="flex-1 bg-accent/20 text-accent text-xs py-1.5 rounded-lg hover:bg-accent/30 transition-colors"
              >
                添加
              </button>
              <button
                onClick={() => { setShowAddForm(false); setNewTitle('') }}
                className="flex-1 bg-white/5 text-text-muted text-xs py-1.5 rounded-lg hover:bg-white/10 transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        )}

        <div className="text-xs text-text-muted font-mono">
          {filteredTasks.length} / {backlogTasks.length} 项
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 custom-scrollbar">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={filteredTasks.map(t => t.id)}
            strategy={verticalListSortingStrategy}
          >
            <div key={animKey} className="space-y-2 animate-fade-in">
              {filteredTasks.map(task => (
                <TaskCard
                  key={task.id}
                  taskId={task.id}
                  onEdit={onEditTask}
                />
              ))}
              {filteredTasks.length === 0 && (
                <div className="text-center py-8 text-text-muted text-sm">
                  {hasActiveFilters ? '没有匹配的任务' : '暂无待办任务'}
                </div>
              )}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      {dragId && (
        <div className="absolute inset-0 pointer-events-none bg-accent/5 rounded-xl" />
      )}
    </div>
  )
}
