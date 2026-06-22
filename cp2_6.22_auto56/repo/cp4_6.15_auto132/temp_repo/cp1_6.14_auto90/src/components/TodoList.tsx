import { useState } from 'react'
import { Plus, Send, CalendarDays, Trash2 } from 'lucide-react'
import type { Task, TaskPriority } from '@/types'
import { useAppStore } from '@/store/app'
import { createTask, deleteTask, updateTask } from '@/lib/api'
import { formatDateShort, todayISO } from '@/lib/date'

const priorityConfig: Record<
  TaskPriority,
  { label: string; bg: string; text: string }
> = {
  high: { label: '高', bg: 'bg-rose-100', text: 'text-rose-600' },
  medium: { label: '中', bg: 'bg-amber-100', text: 'text-amber-600' },
  low: { label: '低', bg: 'bg-emerald-100', text: 'text-emerald-600' },
}

interface ItemProps {
  task: Task
  onToggle: (task: Task) => void
  onRemove: (id: string) => void
  index: number
}

function TaskItem({ task, onToggle, onRemove, index }: ItemProps) {
  const [leaving, setLeaving] = useState(false)
  const conf = priorityConfig[task.priority]
  const dueLabel = formatDateShort(task.dueDate)
  const overdue = !task.completed && task.dueDate < todayISO()

  function handleToggle() {
    if (!task.completed) {
      setLeaving(true)
      setTimeout(() => onToggle(task), 550)
    } else {
      onToggle(task)
    }
  }

  return (
    <div
      className={`list-item-sep group relative flex items-start gap-3 px-3 py-3 transition-colors duration-200 hover:bg-sea-blue-50 animate-fadeInUp ${
        leaving ? 'animate-fadeOutFly' : ''
      }`}
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <button
        onClick={handleToggle}
        className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border transition-all ${
          task.completed
            ? 'border-emerald-400 bg-emerald-400 text-white'
            : 'border-sea-blue-200 bg-white hover:border-sea-blue-400'
        }`}
        aria-label="切换完成"
      >
        {task.completed && (
          <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M16.7 5.3a1 1 0 0 1 0 1.4l-8 8a1 1 0 0 1-1.4 0l-4-4a1 1 0 1 1 1.4-1.4L8 12.58l7.3-7.3a1 1 0 0 1 1.4 0z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </button>
      <div className="min-w-0 flex-1">
        <p
          className={`text-sm font-medium ${
            task.completed
              ? 'text-sea-blue-300 line-through'
              : 'text-sea-blue-900'
          }`}
        >
          {task.title}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
          <span
            className={`rounded-full px-2 py-0.5 font-medium ${conf.bg} ${conf.text}`}
          >
            优先级 · {conf.label}
          </span>
          <span
            className={`inline-flex items-center gap-1 ${
              overdue ? 'text-rose-500' : 'text-sea-blue-500'
            }`}
          >
            <CalendarDays className="h-3 w-3" />
            {dueLabel}
            {overdue && ' · 已逾期'}
          </span>
        </div>
      </div>
      <button
        onClick={() => onRemove(task.id)}
        className="ml-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-sea-blue-300 opacity-0 transition-all hover:bg-rose-50 hover:text-rose-500 group-hover:opacity-100"
        aria-label="删除任务"
      >
        <Trash2 className="h-4 w-4" />
      </button>
      {leaving && (
        <Send className="absolute right-3 top-3 h-5 w-5 text-sea-blue-400 animate-fadeOutFly" />
      )}
    </div>
  )
}

export default function TodoList() {
  const { tasks, addTask, updateTask: storeUpdateTask, removeTask } = useAppStore()
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [dueDate, setDueDate] = useState(todayISO())

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    const created = await createTask({
      title: title.trim(),
      priority,
      dueDate,
    })
    addTask(created)
    setTitle('')
  }

  async function handleToggle(task: Task) {
    const updated = await updateTask(task.id, { completed: !task.completed })
    storeUpdateTask(updated)
  }

  async function handleRemove(id: string) {
    await deleteTask(id)
    removeTask(id)
  }

  const pending = tasks.filter((t) => !t.completed)
  const done = tasks.filter((t) => t.completed)

  return (
    <section className="flex h-full flex-col rounded-card bg-white p-5 shadow-card animate-fadeInUp stagger-1">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-sea-blue-900">待办清单</h2>
          <p className="mt-0.5 text-xs text-sea-blue-500">
            {pending.length} 项待完成 · {done.length} 项已完成
          </p>
        </div>
      </header>
      <form onSubmit={handleSubmit} className="mb-3 flex flex-col gap-2">
        <div className="flex gap-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="添加新任务…"
            className="h-10 flex-1 rounded-btn border border-sea-blue-100 bg-white px-3 text-sm outline-none transition focus:border-sea-blue-400 focus:ring-2 focus:ring-sea-blue-100"
          />
          <button
            type="submit"
            className="btn-primary inline-flex items-center gap-1"
          >
            <Plus className="h-4 w-4" />
            添加
          </button>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1 rounded-btn bg-sea-blue-50 p-1">
            {(['high', 'medium', 'low'] as TaskPriority[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPriority(p)}
                className={`rounded-md px-2.5 py-1 transition-all ${
                  priority === p
                    ? `${priorityConfig[p].bg} ${priorityConfig[p].text} shadow-sm`
                    : 'text-sea-blue-500 hover:text-sea-blue-700'
                }`}
              >
                {priorityConfig[p].label}
              </button>
            ))}
          </div>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="h-8 rounded-btn border border-sea-blue-100 bg-white px-2 text-xs text-sea-blue-700 outline-none focus:border-sea-blue-400"
          />
        </div>
      </form>
      <div className="min-h-0 flex-1 space-y-0.5 overflow-y-auto pr-1">
        {tasks.length === 0 && (
          <div className="py-10 text-center text-sm text-sea-blue-400">
            暂无任务，添加一条试试吧～
          </div>
        )}
        {pending.map((t, i) => (
          <TaskItem
            key={t.id}
            task={t}
            index={i}
            onToggle={handleToggle}
            onRemove={handleRemove}
          />
        ))}
        {done.map((t, i) => (
          <TaskItem
            key={t.id}
            task={t}
            index={i + pending.length}
            onToggle={handleToggle}
            onRemove={handleRemove}
          />
        ))}
      </div>
    </section>
  )
}
