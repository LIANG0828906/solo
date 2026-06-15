import { useState } from 'react'
import {
  Dumbbell,
  BookOpen,
  Brain,
  Droplets,
  Moon,
  Wallet,
  Star,
  Check,
  Plus,
  Trash2,
  type LucideIcon,
} from 'lucide-react'
import { useAppStore } from '@/store/app'
import { checkHabit, createHabit, deleteHabit } from '@/lib/api'
import type { Habit } from '@/types'
import { todayISO } from '@/lib/date'

const iconMap: Record<string, LucideIcon> = {
  dumbbell: Dumbbell,
  'book-open': BookOpen,
  brain: Brain,
  droplets: Droplets,
  moon: Moon,
  wallet: Wallet,
  star: Star,
}

const iconOptions = Object.keys(iconMap)

interface Particle {
  id: number
  px: number
  py: number
  color: string
}

interface HabitCardProps {
  habit: Habit
  onToggle: (habit: Habit) => void
  onRemove: (id: string) => void
  index: number
}

function HabitCard({ habit, onToggle, onRemove, index }: HabitCardProps) {
  const [particles, setParticles] = useState<Particle[]>([])
  const today = todayISO()
  const checked = habit.completedDates.includes(today)
  const Icon = iconMap[habit.icon] || Star

  function spawnParticles() {
    const colors = ['#F4D03F', '#5B9BD5', '#8CD092', '#F299A0']
    const arr: Particle[] = Array.from({ length: 14 }, (_, i) => {
      const angle = (Math.PI * 2 * i) / 14
      const dist = 30 + Math.random() * 30
      return {
        id: Date.now() + i + Math.random(),
        px: Math.cos(angle) * dist,
        py: Math.sin(angle) * dist,
        color: colors[i % colors.length],
      }
    })
    setParticles(arr)
    setTimeout(() => setParticles([]), 900)
  }

  async function handleClick() {
    if (!checked) spawnParticles()
    onToggle(habit)
  }

  return (
    <div
      className="group relative animate-fadeInUp"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div
        className={`flip-3d relative h-24 cursor-pointer select-none ${
          checked ? 'flipped' : ''
        }`}
        onClick={handleClick}
      >
        <div className="flip-3d-inner">
          <div className="flip-3d-face bg-gradient-to-br from-sea-blue-50 to-white shadow-card hover:shadow-card-hover transition-shadow">
            <div className="flex flex-col items-center gap-1.5 p-2">
              <Icon className="h-6 w-6 text-sea-blue-500" strokeWidth={1.8} />
              <span className="text-xs font-medium text-sea-blue-700">
                {habit.name}
              </span>
              <span className="text-[10px] text-sea-blue-400">点击打卡</span>
            </div>
          </div>
          <div className="flip-3d-face flip-3d-back bg-gradient-to-br from-warm-sand-200 via-warm-sand-100 to-white shadow-card-hover">
            <div className="flex flex-col items-center gap-1 p-2">
              <Icon
                className="habit-icon-lit h-7 w-7 text-warm-sand-500 transition-all"
                strokeWidth={1.8}
              />
              <span className="text-xs font-semibold text-warm-sand-600">
                {habit.name}
              </span>
              <div className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white">
                <Check className="h-3 w-3" />
              </div>
            </div>
          </div>
        </div>
        {particles.map((p) => (
          <span
            key={p.id}
            className="habit-particle"
            style={
              {
                left: '50%',
                top: '50%',
                background: p.color,
                ['--px' as string]: `${p.px}px`,
                ['--py' as string]: `${p.py}px`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation()
          onRemove(habit.id)
        }}
        className="absolute right-1 top-1 z-10 hidden h-6 w-6 items-center justify-center rounded-md text-sea-blue-300 hover:bg-rose-50 hover:text-rose-500 group-hover:flex"
        aria-label="删除习惯"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

export default function HabitTracker() {
  const { habits, addHabit, updateHabit, removeHabit } = useAppStore()
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('star')

  async function handleAdd() {
    if (!name.trim()) return
    const created = await createHabit({ name: name.trim(), icon })
    addHabit(created)
    setName('')
    setIcon('star')
    setCreating(false)
  }

  async function handleToggle(habit: Habit) {
    const { habit: next } = await checkHabit(habit.id)
    updateHabit(next)
  }

  async function handleRemove(id: string) {
    await deleteHabit(id)
    removeHabit(id)
  }

  const todayCount = habits.filter((h) =>
    h.completedDates.includes(todayISO()),
  ).length

  return (
    <section className="flex h-full flex-col rounded-card bg-white p-5 shadow-card animate-fadeInUp stagger-3">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-sea-blue-900">今日习惯</h2>
          <p className="mt-0.5 text-xs text-sea-blue-500">
            已打卡 {todayCount}/{habits.length}
          </p>
        </div>
        {!creating && (
          <button
            onClick={() => setCreating(true)}
            className="btn-ghost inline-flex items-center gap-1 px-2.5 py-1 text-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            新增
          </button>
        )}
      </header>

      {creating && (
        <div className="mb-3 space-y-2 rounded-btn border border-sea-blue-100 bg-sea-blue-50/50 p-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="习惯名称"
            className="h-9 w-full rounded-md border border-sea-blue-100 bg-white px-2 text-sm outline-none focus:border-sea-blue-400"
          />
          <div className="flex flex-wrap gap-1.5">
            {iconOptions.map((k) => {
              const I = iconMap[k]
              return (
                <button
                  key={k}
                  onClick={() => setIcon(k)}
                  className={`grid h-8 w-8 place-items-center rounded-md transition ${
                    icon === k
                      ? 'bg-sea-blue text-white shadow'
                      : 'bg-white text-sea-blue-500 hover:bg-white'
                  }`}
                >
                  <I className="h-4 w-4" strokeWidth={1.8} />
                </button>
              )
            })}
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setCreating(false)}
              className="btn-ghost px-3 py-1 text-xs"
            >
              取消
            </button>
            <button onClick={handleAdd} className="btn-primary px-3 py-1 text-xs">
              保存
            </button>
          </div>
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        {habits.length === 0 ? (
          <div className="py-10 text-center text-sm text-sea-blue-400">
            还没有习惯，添加一个开始养成吧～
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {habits.map((h, i) => (
              <HabitCard
                key={h.id}
                habit={h}
                index={i}
                onToggle={handleToggle}
                onRemove={handleRemove}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
