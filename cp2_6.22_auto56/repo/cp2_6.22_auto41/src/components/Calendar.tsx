import { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Clock, BookOpen, CheckCircle2, X } from 'lucide-react'
import type { CalendarDay, ReadingSession } from '@/types'

const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日']

function MiniPieChart({ ratio, size = 28 }: { ratio: number; size?: number }) {
  const r = size / 2 - 3
  const cx = size / 2
  const cy = size / 2
  const circumference = 2 * Math.PI * r
  const filled = Math.min(ratio, 1) * circumference

  return (
    <svg width={size} height={size} className="shrink-0">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#E5E7EB" strokeWidth={3} />
      <circle
        cx={cx} cy={cy} r={r} fill="none"
        stroke="#4A90D9" strokeWidth={3}
        strokeDasharray={`${filled} ${circumference}`}
        strokeDashoffset={0}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}
        className="transition-all duration-500"
      />
    </svg>
  )
}

export default function Calendar() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [days, setDays] = useState<CalendarDay[]>([])
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null)
  const [fadeIn, setFadeIn] = useState(false)

  const fetchCalendar = useCallback(async () => {
    const res = await fetch(`/api/calendar?year=${year}&month=${month}`)
    const data = await res.json()
    setDays(data)
  }, [year, month])

  useEffect(() => {
    setFadeIn(false)
    const timer = setTimeout(() => {
      fetchCalendar()
      setFadeIn(true)
    }, 150)
    return () => clearTimeout(timer)
  }, [fetchCalendar])

  const prevMonth = () => {
    if (month === 1) { setYear(year - 1); setMonth(12) }
    else setMonth(month - 1)
  }

  const nextMonth = () => {
    if (month === 12) { setYear(year + 1); setMonth(1) }
    else setMonth(month + 1)
  }

  const firstDayOfWeek = new Date(year, month - 1, 1).getDay()
  const adjustedFirstDay = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1
  const daysInMonth = new Date(year, month, 0).getDate()
  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  const grid: (CalendarDay | null)[] = []
  for (let i = 0; i < adjustedFirstDay; i++) grid.push(null)
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    const dayData = days.find((day) => day.date === dateStr)
    grid.push(dayData || { date: dateStr, totalDuration: 0, totalPages: 0, goalCompleted: false, sessions: [] })
  }

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}秒`
    const m = Math.floor(seconds / 60)
    if (m < 60) return `${m}分钟`
    return `${Math.floor(m / 60)}小时${m % 60}分钟`
  }

  return (
    <div className="max-w-5xl mx-auto px-4 pt-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">阅读日历</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 text-blue-500
              hover:bg-blue-100 active:scale-95 transition-all"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm font-semibold text-gray-700 min-w-[5rem] text-center">
            {year}年{month}月
          </span>
          <button
            onClick={nextMonth}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 text-blue-500
              hover:bg-blue-100 active:scale-95 transition-all"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className={`transition-opacity duration-300 ${fadeIn ? 'opacity-100' : 'opacity-0'}`}>
        <div className="grid grid-cols-7 gap-1 mb-1">
          {WEEKDAYS.map((w, i) => (
            <div
              key={w}
              className={`text-center text-xs font-medium py-2 ${
                i >= 5 ? 'text-gray-400' : 'text-gray-500'
              }`}
            >
              {w}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {grid.map((day, idx) => {
            if (!day) return <div key={`empty-${idx}`} className="h-20" />

            const dateNum = parseInt(day.date.split('-')[2], 10)
            const dayOfWeek = new Date(day.date).getDay()
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
            const isToday = day.date === todayStr
            const hasReading = day.totalDuration > 0
            const goalRatio = day.totalDuration / 1800

            return (
              <button
                key={day.date}
                onClick={() => hasReading && setSelectedDay(day)}
                className={`h-20 rounded-lg p-1.5 text-left transition-all duration-200
                  ${isWeekend ? 'bg-gray-50' : 'bg-white'}
                  ${isToday ? 'ring-2 ring-blue-300' : ''}
                  ${hasReading ? 'hover:shadow-md cursor-pointer' : 'cursor-default'}
                  border border-gray-100`}
              >
                <div className={`text-xs font-semibold mb-1 ${isToday ? 'text-blue-600' : 'text-gray-600'}`}>
                  {dateNum}
                </div>
                {hasReading ? (
                  <div className="flex flex-col items-center gap-0.5">
                    <MiniPieChart ratio={goalRatio} size={24} />
                    {day.goalCompleted && <CheckCircle2 size={10} className="text-green-500" />}
                  </div>
                ) : null}
              </button>
            )
          })}
        </div>

        <div className="mt-4 flex items-center gap-4 text-xs text-gray-400">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-gray-50 border border-gray-100" /> 周末
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded border-2 border-blue-300" /> 今日
          </div>
          <div className="flex items-center gap-1">
            <CheckCircle2 size={12} className="text-green-500" /> 达标
          </div>
        </div>
      </div>

      {selectedDay && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/20 backdrop-blur-sm"
          onClick={() => setSelectedDay(null)}
        >
          <div
            className="bg-white rounded-t-2xl w-full max-w-lg p-6 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-gray-800">{selectedDay.date} 阅读明细</h3>
              <button onClick={() => setSelectedDay(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="flex gap-4 mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Clock size={14} /> 总时长：{formatDuration(selectedDay.totalDuration)}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <BookOpen size={14} /> 总页数：{selectedDay.totalPages}
              </div>
            </div>

            <div className="space-y-3 max-h-48 overflow-y-auto">
              {selectedDay.sessions.map((s: ReadingSession) => (
                <div key={s.id} className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2.5">
                  <BookOpen size={16} className="text-blue-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 truncate">{s.bookTitle}</p>
                    <p className="text-xs text-gray-400">
                      {formatDuration(s.duration)} · {s.pagesRead}页
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {selectedDay.goalCompleted && (
              <div className="mt-4 flex items-center gap-2 text-sm text-green-600 font-medium">
                <CheckCircle2 size={16} /> 今日目标已完成！
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
