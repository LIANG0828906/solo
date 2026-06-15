import React, { useMemo } from 'react'
import StatsBar from './StatsBar'
import { usePomodoroStore } from '../../store/usePomodoroStore'

const StatsPanel: React.FC = () => {
  const getTodaySessions = usePomodoroStore((state) => state.getTodaySessions)
  const sessions = getTodaySessions()

  const hourlyData = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      count: 0,
    }))

    sessions.forEach((session) => {
      const hour = new Date(session.endTime).getHours()
      if (hour >= 0 && hour < 24) {
        hours[hour].count++
      }
    })

    return hours
  }, [sessions])

  const maxCount = useMemo(() => {
    return Math.max(...hourlyData.map((h) => h.count), 1)
  }, [hourlyData])

  const maxBarHeight = 100

  const getBarColor = (count: number, max: number) => {
    if (count === 0) return '#dee2e6'
    const ratio = count / max
    const startColor = { r: 116, g: 185, b: 255 }
    const endColor = { r: 9, g: 132, b: 227 }
    const r = Math.round(startColor.r + (endColor.r - startColor.r) * ratio)
    const g = Math.round(startColor.g + (endColor.g - startColor.g) * ratio)
    const b = Math.round(startColor.b + (endColor.b - startColor.b) * ratio)
    return `rgb(${r}, ${g}, ${b})`
  }

  const hasData = sessions.length > 0

  return (
    <div className="stats-panel">
      <div className="stats-title">今日统计 · {sessions.length} 个番茄钟</div>
      {hasData ? (
        <div className="stats-chart">
          {hourlyData.map(({ hour, count }) => (
            <StatsBar
              key={hour}
              height={count > 0 ? Math.max((count / maxCount) * maxBarHeight, 4) : 2}
              color={getBarColor(count, maxCount)}
              label={`${hour}时`}
              index={hour}
            />
          ))}
        </div>
      ) : (
        <div className="stats-empty">暂无记录</div>
      )}
    </div>
  )
}

export default StatsPanel
