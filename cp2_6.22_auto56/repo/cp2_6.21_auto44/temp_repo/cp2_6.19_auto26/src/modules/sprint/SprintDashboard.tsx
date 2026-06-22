import { useMemo, useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import BurndownChart from './BurndownChart'
import TaskCard from '@/modules/backlog/TaskCard'
import {
  Plus,
  Calendar,
  Users,
  Target,
  ChevronDown,
  X,
  ArrowUpFromLine,
  TrendingUp,
} from 'lucide-react'
import { clsx } from 'clsx'
import { useDroppable } from '@dnd-kit/core'

function SprintOverview() {
  const currentSprintId = useAppStore(s => s.currentSprintId)
  const sprints = useAppStore(s => s.sprints)
  const tasks = useAppStore(s => s.tasks)
  const teamMembers = useAppStore(s => s.teamMembers)
  const setCurrentSprintId = useAppStore(s => s.setCurrentSprintId)

  const sprint = sprints.find(s => s.id === currentSprintId)

  const sprintTasks = useMemo(() => {
    if (!sprint) return []
    return tasks.filter(t => t.sprintId === sprint.id)
  }, [sprint, tasks])

  const totalHours = useMemo(() => sprintTasks.reduce((s, t) => s + t.estimatedHours, 0), [sprintTasks])
  const completedHours = useMemo(() => sprintTasks.reduce((s, t) => s + t.completedHours, 0), [sprintTasks])
  const progress = totalHours > 0 ? Math.round((completedHours / totalHours) * 100) : 0

  const memberNames = useMemo(() => {
    if (!sprint) return []
    return sprint.teamMembers.map(id => teamMembers.find(m => m.id === id)?.name).filter(Boolean) as string[]
  }, [sprint, teamMembers])

  if (!sprint) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <Target size={48} className="mx-auto text-text-muted mb-4" />
          <p className="text-text-secondary mb-2">还没有冲刺</p>
          <p className="text-text-muted text-sm">创建一个冲刺开始追踪进度</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-xl font-bold text-text-primary">{sprint.name}</h2>
            <div className="relative">
              <select
                value={currentSprintId ?? ''}
                onChange={e => setCurrentSprintId(e.target.value)}
                className="absolute inset-0 opacity-0 cursor-pointer"
              >
                {sprints.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              <ChevronDown size={16} className="text-text-muted" />
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm text-text-muted">
            <span className="flex items-center gap-1">
              <Calendar size={14} />
              {sprint.startDate} → {sprint.endDate}
            </span>
            <span className="flex items-center gap-1">
              <Users size={14} />
              {memberNames.join('、')}
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold font-mono text-accent">{progress}%</div>
          <div className="text-xs text-text-muted">
            {completedHours}h / {totalHours}h
          </div>
        </div>
      </div>

      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-accent to-accent-deep rounded-full transition-all duration-700 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-surface-light/40 rounded-lg p-3 border border-white/5">
          <div className="flex items-center gap-2 text-text-muted text-xs mb-1">
            <Target size={12} />
            <span>总任务</span>
          </div>
          <div className="text-lg font-bold font-mono text-text-primary">{sprintTasks.length}</div>
        </div>
        <div className="bg-surface-light/40 rounded-lg p-3 border border-white/5">
          <div className="flex items-center gap-2 text-text-muted text-xs mb-1">
            <TrendingUp size={12} />
            <span>进行中</span>
          </div>
          <div className="text-lg font-bold font-mono text-status-progress">
            {sprintTasks.filter(t => t.status === 'in-progress').length}
          </div>
        </div>
        <div className="bg-surface-light/40 rounded-lg p-3 border border-white/5">
          <div className="flex items-center gap-2 text-text-muted text-xs mb-1">
            <ArrowUpFromLine size={12} />
            <span>已完成</span>
          </div>
          <div className="text-lg font-bold font-mono text-status-done">
            {sprintTasks.filter(t => t.status === 'done').length}
          </div>
        </div>
      </div>
    </div>
  )
}

function DroppableSprintTasks({ onEditTask }: { onEditTask: (id: string) => void }) {
  const currentSprintId = useAppStore(s => s.currentSprintId)
  const sprints = useAppStore(s => s.sprints)
  const tasks = useAppStore(s => s.tasks)
  const sprint = sprints.find(s => s.id === currentSprintId)
  const sprintTasks = useMemo(() => {
    if (!sprint) return []
    return tasks.filter(t => t.sprintId === sprint.id)
  }, [sprint, tasks])

  const { isOver, setNodeRef } = useDroppable({
    id: currentSprintId ?? 'sprint-drop',
  })

  return (
    <div
      ref={setNodeRef}
      className={clsx(
        'min-h-[200px] rounded-xl border-2 border-dashed transition-all duration-300',
        isOver
          ? 'border-accent/60 bg-accent/5'
          : 'border-white/5 bg-transparent',
        sprintTasks.length === 0 && 'flex items-center justify-center',
      )}
    >
      {sprintTasks.length === 0 ? (
        <p className="text-text-muted text-sm">
          {isOver ? '松开以分配任务' : '从左侧拖拽任务到此处'}
        </p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 p-1">
          {sprintTasks.map(task => (
            <TaskCard key={task.id} taskId={task.id} onEdit={onEditTask} />
          ))}
        </div>
      )}
    </div>
  )
}

function CreateSprintForm() {
  const addSprint = useAppStore(s => s.addSprint)
  const teamMembers = useAppStore(s => s.teamMembers)
  const isCreateSprintOpen = useAppStore(s => s.isCreateSprintOpen)
  const setCreateSprintOpen = useAppStore(s => s.setCreateSprintOpen)

  const [name, setName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])

  if (!isCreateSprintOpen) return null

  const handleSubmit = () => {
    if (!name.trim() || !startDate || !endDate || selectedMembers.length === 0) return
    addSprint({ name: name.trim(), startDate, endDate, teamMembers: selectedMembers })
    setName('')
    setStartDate('')
    setEndDate('')
    setSelectedMembers([])
    setCreateSprintOpen(false)
  }

  const toggleMember = (id: string) => {
    setSelectedMembers(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    )
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-primary border border-white/10 rounded-2xl p-6 w-full max-w-md animate-bounce-in">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-text-primary">创建新冲刺</h3>
          <button
            onClick={() => setCreateSprintOpen(false)}
            className="p-1 rounded-lg text-text-muted hover:text-text-primary transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs text-text-muted mb-1.5">冲刺名称</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="例：Sprint 2 - API开发"
              className="w-full bg-surface-light/60 text-text-primary text-sm rounded-lg px-3 py-2.5 border border-white/5 focus:outline-none focus:border-accent/40 transition-all focus:scale-[1.02] placeholder:text-text-muted"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-text-muted mb-1.5">开始日期</label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full bg-surface-light/60 text-text-primary text-sm rounded-lg px-3 py-2.5 border border-white/5 focus:outline-none focus:border-accent/40 transition-all focus:scale-[1.02]"
              />
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1.5">结束日期</label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full bg-surface-light/60 text-text-primary text-sm rounded-lg px-3 py-2.5 border border-white/5 focus:outline-none focus:border-accent/40 transition-all focus:scale-[1.02]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-text-muted mb-1.5">团队成员</label>
            <div className="flex flex-wrap gap-2">
              {teamMembers.map(m => (
                <button
                  key={m.id}
                  onClick={() => toggleMember(m.id)}
                  className={clsx(
                    'px-3 py-1.5 rounded-full text-xs transition-all',
                    selectedMembers.includes(m.id)
                      ? 'bg-accent/20 text-accent border border-accent/30'
                      : 'bg-surface-light/60 text-text-muted border border-white/5 hover:border-white/20',
                  )}
                >
                  {m.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={() => setCreateSprintOpen(false)}
            className="flex-1 py-2.5 rounded-xl text-sm text-text-muted bg-white/5 hover:bg-white/10 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            className={clsx(
              'flex-1 py-2.5 rounded-xl text-sm font-medium text-white transition-all',
              'bg-gradient-to-r from-accent to-accent-deep',
              'hover:shadow-lg hover:shadow-accent/20',
              'active:scale-95 active:shadow-none',
            )}
          >
            创建冲刺
          </button>
        </div>
      </div>
    </div>
  )
}

interface SprintDashboardProps {
  onEditTask: (id: string) => void
  onDragEnd: (taskId: string, sprintId: string) => void
}

export default function SprintDashboard({ onEditTask }: SprintDashboardProps) {
  const currentSprintId = useAppStore(s => s.currentSprintId)
  const sprints = useAppStore(s => s.sprints)
  const tasks = useAppStore(s => s.tasks)
  const setCreateSprintOpen = useAppStore(s => s.setCreateSprintOpen)

  const sprint = sprints.find(s => s.id === currentSprintId)
  const sprintTasks = useMemo(() => {
    if (!sprint) return []
    return tasks.filter(t => t.sprintId === sprint.id)
  }, [sprint, tasks])

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 pt-5 pb-4 border-b border-white/5">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-text-primary">冲刺仪表盘</h1>
          <button
            onClick={() => setCreateSprintOpen(true)}
            className={clsx(
              'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white',
              'bg-gradient-to-r from-accent to-accent-deep',
              'hover:shadow-lg hover:shadow-accent/25',
              'active:scale-95 active:shadow-none',
              'transition-all duration-200',
            )}
          >
            <Plus size={16} />
            创建冲刺
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5 custom-scrollbar">
        <SprintOverview />

        {sprint && (
          <>
            <div className="mt-6 mb-4">
              <h3 className="text-sm font-semibold text-text-secondary mb-3 flex items-center gap-2">
                <span className="w-1 h-4 bg-accent rounded-full" />
                燃尽图
              </h3>
              <div className="h-[300px] bg-surface-light/30 rounded-xl border border-white/5">
                <BurndownChart
                  tasks={sprintTasks}
                  startDate={sprint.startDate}
                  endDate={sprint.endDate}
                />
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-sm font-semibold text-text-secondary mb-3 flex items-center gap-2">
                <span className="w-1 h-4 bg-accent-deep rounded-full" />
                冲刺任务
                <span className="text-text-muted font-mono text-xs">({sprintTasks.length})</span>
              </h3>
              <DroppableSprintTasks onEditTask={onEditTask} />
            </div>
          </>
        )}
      </div>

      <CreateSprintForm />
    </div>
  )
}
