import { useState, useEffect, useRef } from 'react'
import { useAppStore, type Priority, type TaskStatus } from '@/store/useAppStore'
import { X, Save } from 'lucide-react'
import { clsx } from 'clsx'

const PRIORITIES: { value: Priority; label: string; color: string }[] = [
  { value: 'high', label: '高', color: 'bg-priority-high' },
  { value: 'medium', label: '中', color: 'bg-priority-medium' },
  { value: 'low', label: '低', color: 'bg-priority-low' },
]

const STATUSES: { value: TaskStatus; label: string }[] = [
  { value: 'todo', label: '未开始' },
  { value: 'in-progress', label: '进行中' },
  { value: 'done', label: '已完成' },
]

export default function TaskDetailModal() {
  const editingTaskId = useAppStore(s => s.editingTaskId)
  const tasks = useAppStore(s => s.tasks)
  const teamMembers = useAppStore(s => s.teamMembers)
  const updateTask = useAppStore(s => s.updateTask)
  const setEditingTaskId = useAppStore(s => s.setEditingTaskId)

  const task = tasks.find(t => t.id === editingTaskId)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [assignee, setAssignee] = useState('')
  const [priority, setPriority] = useState<Priority>('medium')
  const [status, setStatus] = useState<TaskStatus>('todo')
  const [estimatedHours, setEstimatedHours] = useState(0)
  const [completedHours, setCompletedHours] = useState(0)
  const [isSaving, setIsSaving] = useState(false)

  const titleRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (task) {
      setTitle(task.title)
      setDescription(task.description)
      setAssignee(task.assignee)
      setPriority(task.priority)
      setStatus(task.status)
      setEstimatedHours(task.estimatedHours)
      setCompletedHours(task.completedHours)
    }
  }, [task])

  useEffect(() => {
    if (editingTaskId && titleRef.current) {
      setTimeout(() => titleRef.current?.focus(), 100)
    }
  }, [editingTaskId])

  if (!editingTaskId || !task) return null

  const handleSave = async () => {
    if (!title.trim()) return
    setIsSaving(true)
    await new Promise(r => setTimeout(r, 150))
    updateTask(task.id, {
      title: title.trim(),
      description,
      assignee,
      priority,
      status,
      estimatedHours,
      completedHours: status === 'done' ? estimatedHours : completedHours,
    })
    setIsSaving(false)
    setEditingTaskId(null)
  }

  const handleClose = () => {
    setEditingTaskId(null)
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={e => { if (e.target === e.currentTarget) handleClose() }}
    >
      <div className="bg-primary border border-white/10 rounded-2xl w-full max-w-lg animate-bounce-in overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <h3 className="text-lg font-bold text-text-primary">任务详情</h3>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
          <div>
            <label className="block text-xs text-text-muted mb-1.5">任务标题</label>
            <input
              ref={titleRef}
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full bg-surface-light/60 text-text-primary text-sm rounded-lg px-3 py-2.5 border border-white/5 focus:outline-none focus:border-accent/40 transition-all duration-200 focus:scale-[1.02] placeholder:text-text-muted"
            />
          </div>

          <div>
            <label className="block text-xs text-text-muted mb-1.5">描述</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              className="w-full bg-surface-light/60 text-text-primary text-sm rounded-lg px-3 py-2.5 border border-white/5 focus:outline-none focus:border-accent/40 transition-all duration-200 focus:scale-[1.02] resize-none placeholder:text-text-muted"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-text-muted mb-1.5">负责人</label>
              <select
                value={assignee}
                onChange={e => setAssignee(e.target.value)}
                className="w-full bg-surface-light/60 text-text-primary text-sm rounded-lg px-3 py-2.5 border border-white/5 focus:outline-none focus:border-accent/40 transition-all"
              >
                <option value="">未分配</option>
                {teamMembers.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1.5">状态</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as TaskStatus)}
                className="w-full bg-surface-light/60 text-text-primary text-sm rounded-lg px-3 py-2.5 border border-white/5 focus:outline-none focus:border-accent/40 transition-all"
              >
                {STATUSES.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-text-muted mb-1.5">优先级</label>
            <div className="flex gap-2">
              {PRIORITIES.map(p => (
                <button
                  key={p.value}
                  onClick={() => setPriority(p.value)}
                  className={clsx(
                    'flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs transition-all',
                    priority === p.value
                      ? 'bg-white/10 text-text-primary border border-white/20'
                      : 'bg-surface-light/40 text-text-muted border border-white/5 hover:border-white/10',
                  )}
                >
                  <span className={clsx('w-2 h-2 rounded-full', p.color)} />
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-text-muted mb-1.5">预估工时</label>
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  value={estimatedHours}
                  onChange={e => setEstimatedHours(Number(e.target.value))}
                  className="w-full bg-surface-light/60 text-text-primary text-sm rounded-lg px-3 py-2.5 border border-white/5 focus:outline-none focus:border-accent/40 transition-all font-mono pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted text-xs">h</span>
              </div>
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1.5">已完成工时</label>
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  max={estimatedHours}
                  value={completedHours}
                  onChange={e => setCompletedHours(Number(e.target.value))}
                  disabled={status === 'done'}
                  className="w-full bg-surface-light/60 text-text-primary text-sm rounded-lg px-3 py-2.5 border border-white/5 focus:outline-none focus:border-accent/40 transition-all font-mono pr-8 disabled:opacity-50"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted text-xs">h</span>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-white/5 flex gap-3">
          <button
            onClick={handleClose}
            className="flex-1 py-2.5 rounded-xl text-sm text-text-muted bg-white/5 hover:bg-white/10 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !title.trim()}
            className={clsx(
              'flex items-center justify-center gap-2 flex-1 py-2.5 rounded-xl text-sm font-medium text-white',
              'bg-gradient-to-r from-accent to-accent-deep',
              'hover:shadow-lg hover:shadow-accent/25',
              'active:scale-95 active:shadow-none',
              'transition-all duration-200',
              'disabled:opacity-50 disabled:cursor-not-allowed',
            )}
          >
            <Save size={14} className={isSaving ? 'animate-spin' : ''} />
            {isSaving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  )
}
