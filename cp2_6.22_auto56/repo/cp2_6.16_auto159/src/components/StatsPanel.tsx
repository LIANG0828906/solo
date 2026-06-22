import React, { useState, useEffect, useRef } from 'react'
import { BarChart2, Flame, Calendar } from 'lucide-react'
import { useWritingStore } from '@/store/writingStore'

const TARGET_WORDS = 500

export default function StatsPanel() {
  const store = useWritingStore()
  const [monthWords, setMonthWords] = useState(0)
  const [streak, setStreak] = useState(0)
  const [weekData, setWeekData] = useState(store.getWeekData())
  const [displayMonthWords, setDisplayMonthWords] = useState(0)
  const [hoveredBar, setHoveredBar] = useState<number | null>(null)
  const animRef = useRef<number | null>(null)

  const refreshStats = () => {
    setMonthWords(store.getMonthTotalWords())
    setStreak(store.getStreakDays())
    setWeekData(store.getWeekData())
  }

  useEffect(() => {
    refreshStats()
    const interval = setInterval(refreshStats, 5000)
    return () => clearInterval(interval)
  }, [store])

  useEffect(() => {
    if (animRef.current) cancelAnimationFrame(animRef.current)
    const animate = () => {
      setDisplayMonthWords((prev) => {
        if (prev === monthWords) return prev
        const diff = monthWords - prev
        const step = Math.max(1, Math.ceil(Math.abs(diff) / 15))
        return prev + (diff > 0 ? step : -step)
      })
      animRef.current = requestAnimationFrame(animate)
    }
    animRef.current = requestAnimationFrame(animate)
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current)
    }
  }, [monthWords])

  const maxWords = Math.max(TARGET_WORDS * 2, ...weekData.map((d) => d.words))
  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  return (
    <div
      className="h-full flex flex-col border-l border-[#E0DACD] p-4 overflow-y-auto"
      style={{ width: '200px', backgroundColor: '#FFFBF2' }}
    >
      <div className="flex items-center gap-2 mb-6">
        <BarChart2 size={18} style={{ color: '#F39C12' }} />
        <span className="font-bold text-sm" style={{ color: '#2C3E50' }}>
          写作统计
        </span>
      </div>

      <div className="mb-6">
        <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2">
          <Calendar size={14} />
          <span>本月总字数</span>
        </div>
        <div className="text-3xl font-bold tabular-nums" style={{ color: '#2C3E50' }}>
          {displayMonthWords.toLocaleString()}
        </div>
        <div className="text-xs text-gray-400 mt-1">字</div>
      </div>

      <div className="mb-6">
        <div className="text-xs text-gray-500 mb-2">连续创作</div>
        <div
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-white font-bold"
          style={{ backgroundColor: '#27AE60' }}
        >
          <Flame size={16} />
          <span className="text-lg">{streak}</span>
          <span className="text-xs opacity-90">天</span>
        </div>
      </div>

      <div>
        <div className="text-xs text-gray-500 mb-3">本周每日字数</div>
        <div className="flex items-end justify-between gap-1 h-32 px-1">
          {weekData.map((d, i) => {
            const heightPercent = (d.words / maxWords) * 100
            const isToday = d.date === todayStr
            const isMet = d.words >= TARGET_WORDS
            const isHovered = hoveredBar === i

            return (
              <div
                key={d.date}
                className="flex-1 flex flex-col items-center gap-1.5 relative"
                onMouseEnter={() => setHoveredBar(i)}
                onMouseLeave={() => setHoveredBar(null)}
              >
                {isHovered && (
                  <div
                    className="absolute -top-7 px-2 py-1 rounded text-xs text-white whitespace-nowrap z-10 fade-in"
                    style={{ backgroundColor: '#2C3E50' }}
                  >
                    {d.words} 字
                  </div>
                )}
                <div
                  className="w-full rounded-t transition-all"
                  style={{
                    height: '0px',
                    backgroundColor: isMet ? '#F39C12' : '#BDC3C7',
                    opacity: isToday ? 1 : 0.85,
                    animation: `barRise 0.6s ease-out ${i * 0.1}s forwards`,
                  }}
                >
                  <style>{`
                    @keyframes barRise {
                      from { height: 0px; }
                      to { height: ${Math.max(heightPercent, 2)}%; }
                    }
                  `}</style>
                </div>
                <span
                  className="text-xs"
                  style={{
                    color: isToday ? '#27AE60' : '#666',
                    fontWeight: isToday ? 700 : 400,
                  }}
                >
                  {d.dayName}
                </span>
              </div>
            )
          })}
        </div>
        <div className="flex items-center justify-center gap-4 mt-4 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: '#F39C12' }} />
            <span>达标</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: '#BDC3C7' }} />
            <span>未达标</span>
          </div>
        </div>
      </div>
    </div>
  )
}
