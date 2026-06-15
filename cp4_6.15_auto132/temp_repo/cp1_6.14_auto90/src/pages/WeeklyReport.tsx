import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, TrendingUp } from 'lucide-react'
import { useAppStore } from '@/store/app'
import {
  addDays,
  formatDateShort,
  formatDateWeekday,
  getWeekRange,
  isSameDay,
} from '@/lib/date'
import type { DailyFocusStat, DailyTaskStat } from '@/types'

function TaskCompletionBars({ stats }: { stats: DailyTaskStat[] }) {
  return (
    <div className="space-y-3">
      {stats.map((s) => {
        const pct = s.total === 0 ? 0 : Math.round((s.completed / s.total) * 100)
        return (
          <div key={s.date} className="flex items-center gap-3">
            <div className="w-20 shrink-0 text-xs text-sea-blue-600">
              <div className="font-medium">{formatDateShort(s.date)}</div>
              <div className="text-[10px] text-sea-blue-400">
                {formatDateWeekday(s.date)}
              </div>
            </div>
            <div className="relative h-5 flex-1 overflow-hidden rounded-full bg-sea-blue-50">
              <div className="flex h-full">
                <div
                  className="h-full bg-gradient-to-r from-emerald-300 to-emerald-500 transition-all duration-700"
                  style={{ width: `${pct}%` }}
                />
                <div
                  className="h-full bg-sea-blue-100"
                  style={{ width: `${100 - pct}%` }}
                />
              </div>
              <div className="absolute inset-0 flex items-center justify-center text-[10px] font-medium text-sea-blue-800">
                {s.completed}/{s.total} · {pct}%
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function FocusScatterPlot({
  stats,
}: {
  stats: DailyFocusStat[]
}) {
  const max = Math.max(60, ...stats.map((s) => s.minutes))
  const width = 640
  const height = 180
  const pad = { top: 16, right: 16, bottom: 30, left: 36 }
  const innerW = width - pad.left - pad.right
  const innerH = height - pad.top - pad.bottom
  const step = stats.length > 1 ? innerW / (stats.length - 1) : innerW / 2
  const [hover, setHover] = useState<number | null>(null)

  return (
    <div className="relative w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-44 w-full min-w-[480px]">
        {Array.from({ length: 5 }, (_, i) => {
          const y = pad.top + (innerH * i) / 4
          const v = Math.round(max - (max * i) / 4)
          return (
            <g key={i}>
              <line
                x1={pad.left}
                x2={width - pad.right}
                y1={y}
                y2={y}
                stroke="#D5E7F6"
                strokeDasharray="3 4"
              />
              <text x={pad.left - 6} y={y + 3} textAnchor="end" fontSize="10" fill="#7FB6E5">
                {v}
              </text>
            </g>
          )
        })}
        {stats.map((s, i) => {
          const x = pad.left + i * step
          const y = pad.top + innerH - (s.minutes / max) * innerH
          const active = hover === i
          return (
            <g
              key={s.date}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              style={{ cursor: 'pointer' }}
            >
              <line
                x1={x}
                x2={x}
                y1={pad.top + innerH}
                y2={y}
                stroke="#A9CFEE"
                strokeWidth="1"
                strokeDasharray="2 3"
                opacity="0.6"
              />
              <circle
                cx={x}
                cy={y}
                r={active ? 9 : 6}
                fill="#5B9BD5"
                stroke="#fff"
                strokeWidth="2"
                style={{ transition: 'r 0.2s' }}
              />
              <text
                x={x}
                y={height - 10}
                textAnchor="middle"
                fontSize="10"
                fill="#4181BB"
              >
                {formatDateShort(s.date)}
              </text>
              {active && (
                <g>
                  <rect
                    x={x - 42}
                    y={y - 36}
                    width="84"
                    height="24"
                    rx="6"
                    fill="#326896"
                    opacity="0.95"
                  />
                  <text
                    x={x}
                    y={y - 20}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#fff"
                  >
                    {s.date} · {s.minutes} 分钟
                  </text>
                </g>
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}

function HabitGantt({
  days,
  habits,
}: {
  days: string[]
  habits: { id: string; name: string; completedDates: string[] }[]
}) {
  function cellColor(dateIdx: number, checked: boolean) {
    if (!checked) return 'bg-sea-blue-50'
    const ratio = dateIdx / Math.max(1, days.length - 1)
    const light = [187, 237, 207]
    const deep = [22, 163, 74]
    const rgb = light.map((l, i) => Math.round(l + (deep[i] - l) * ratio))
    return `rgb(${rgb.join(',')})`
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[560px]">
        <div className="grid grid-cols-[120px_repeat(7,1fr)] gap-1.5">
          <div />
          {days.map((d) => (
            <div key={d} className="text-center text-[11px] text-sea-blue-600">
              <div className="font-medium">{formatDateShort(d)}</div>
              <div className="text-[10px] text-sea-blue-400">
                {formatDateWeekday(d)}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-2 space-y-1.5">
          {habits.length === 0 && (
            <div className="py-6 text-center text-sm text-sea-blue-400">
              暂无习惯数据
            </div>
          )}
          {habits.map((h) => (
            <div
              key={h.id}
              className="grid grid-cols-[120px_repeat(7,1fr)] items-center gap-1.5"
            >
              <div className="truncate text-sm text-sea-blue-800">{h.name}</div>
              {days.map((d, di) => {
                const checked = h.completedDates.some((cd) => isSameDay(cd, d))
                return (
                  <div
                    key={d}
                    className="h-7 rounded-md transition-all hover:scale-105"
                    style={{ background: cellColor(di, checked) }}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function WeeklyReport() {
  const { tasks, habits, timerSessions } = useAppStore()
  const [anchor, setAnchor] = useState<string>(getWeekRange().days[6])
  const [dir, setDir] = useState<'prev' | 'next'>('next')

  const { days } = useMemo(() => getWeekRange(anchor), [anchor])

  const taskStats: DailyTaskStat[] = useMemo(() => {
    return days.map((date) => {
      const dayTasks = tasks.filter((t) =>
        isSameDay(t.createdAt, date) || isSameDay(t.dueDate, date),
      )
      const completed = dayTasks.filter((t) => t.completed).length
      return { date, completed, total: dayTasks.length }
    })
  }, [days, tasks])

  const focusStats: DailyFocusStat[] = useMemo(() => {
    return days.map((date) => {
      const minutes = timerSessions
        .filter((s) => s.type === 'focus' && isSameDay(s.completedAt, date))
        .reduce((acc, s) => acc + s.duration, 0)
      return { date, minutes }
    })
  }, [days, timerSessions])

  const totalMinutes = focusStats.reduce((a, b) => a + b.minutes, 0)
  const totalTasks = taskStats.reduce((a, b) => a + b.total, 0)
  const completedTasks = taskStats.reduce((a, b) => a + b.completed, 0)
  const habitTotal = habits.reduce(
    (a, h) => a + days.filter((d) => h.completedDates.some((cd) => isSameDay(cd, d))).length,
    0,
  )
  const habitTarget = habits.length * days.length

  function shiftWeek(delta: -1 | 1) {
    setDir(delta === -1 ? 'prev' : 'next')
    setAnchor((prev) => addDays(prev, delta * 7))
  }

  const rangeLabel = `${days[0]} ~ ${days[6]}`

  return (
    <div className="h-full bg-weekly-bg">
      <div className="mx-auto max-w-6xl px-6 py-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 animate-fadeInUp">
          <div>
            <h1 className="text-xl font-semibold text-sea-blue-900">周报</h1>
            <p className="mt-0.5 text-xs text-sea-blue-500">本周数据汇总</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => shiftWeek(-1)}
              className="btn-ghost inline-flex items-center gap-1 px-2 py-1 text-sm"
            >
              <ChevronLeft className="h-4 w-4" />
              上一周
            </button>
            <div className="rounded-btn bg-white px-3 py-1.5 text-sm text-sea-blue-700 shadow-card">
              {rangeLabel}
            </div>
            <button
              onClick={() => shiftWeek(1)}
              className="btn-ghost inline-flex items-center gap-1 px-2 py-1 text-sm"
            >
              下一周
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div
          className={`grid gap-4 md:grid-cols-3 ${
            dir === 'prev' ? 'week-slide-enter-prev' : 'week-slide-enter'
          }`}
          key={anchor}
        >
          <div className="rounded-card bg-white p-4 shadow-card">
            <div className="mb-1 text-xs text-sea-blue-500">任务完成率</div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-semibold text-sea-blue-800">
                {totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100)}
                <span className="text-sm">%</span>
              </span>
              <span className="text-xs text-sea-blue-400">
                {completedTasks}/{totalTasks} 项
              </span>
            </div>
          </div>
          <div className="rounded-card bg-white p-4 shadow-card">
            <div className="mb-1 text-xs text-sea-blue-500">专注总时长</div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-semibold text-sea-blue-800">
                {totalMinutes}
                <span className="text-sm">分钟</span>
              </span>
              <span className="inline-flex items-center gap-0.5 text-xs text-emerald-500">
                <TrendingUp className="h-3 w-3" />
                {Math.round(totalMinutes / Math.max(1, days.filter((_, i) => focusStats[i].minutes > 0).length))} 分钟/天
              </span>
            </div>
          </div>
          <div className="rounded-card bg-white p-4 shadow-card">
            <div className="mb-1 text-xs text-sea-blue-500">习惯打卡率</div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-semibold text-sea-blue-800">
                {habitTarget === 0 ? 0 : Math.round((habitTotal / habitTarget) * 100)}
                <span className="text-sm">%</span>
              </span>
              <span className="text-xs text-sea-blue-400">
                {habitTotal}/{habitTarget} 次
              </span>
            </div>
          </div>
        </div>

        <div
          className={`mt-4 space-y-4 pb-10 ${
            dir === 'prev' ? 'week-slide-enter-prev' : 'week-slide-enter'
          }`}
          key={`content-${anchor}`}
        >
          <section className="rounded-card bg-white p-5 shadow-card">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-sea-blue-900">
                任务完成率
              </h3>
              <span className="text-xs text-sea-blue-500">已完成 / 总数</span>
            </div>
            <TaskCompletionBars stats={taskStats} />
          </section>

          <section className="rounded-card bg-white p-5 shadow-card">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-sea-blue-900">
                番茄钟时长（分钟）
              </h3>
              <span className="text-xs text-sea-blue-500">每日专注总时长</span>
            </div>
            <FocusScatterPlot stats={focusStats} />
          </section>

          <section className="rounded-card bg-white p-5 shadow-card">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-sea-blue-900">
                习惯打卡甘特图
              </h3>
              <span className="text-xs text-sea-blue-500">浅绿 → 深绿</span>
            </div>
            <HabitGantt days={days} habits={habits} />
          </section>
        </div>
      </div>
    </div>
  )
}
