import { useMemo, useState } from 'react'
import type { DailyHours } from '../../shared/types'

interface ChartBarProps {
  data: DailyHours[]
  period: 'week' | 'month'
}

export default function ChartBar({ data, period }: ChartBarProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  const chartData = useMemo(() => {
    if (period === 'week') {
      const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
      const now = new Date()
      const dayOfWeek = now.getDay()
      const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1
      const result = days.map((label, i) => {
        const d = new Date(now)
        d.setDate(now.getDate() - mondayOffset + i)
        const dateStr = d.toISOString().split('T')[0]
        const found = data.find((r) => r.date === dateStr)
        return { label, value: found?.hours || 0, date: dateStr }
      })
      return result
    }
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const result = []
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`
      const found = data.find((r) => r.date === dateStr)
      result.push({ label: String(i), value: found?.hours || 0, date: dateStr })
    }
    return result
  }, [data, period])

  const maxValue = useMemo(() => {
    const m = Math.max(...chartData.map((d) => d.value), 1)
    return Math.ceil(m / 2) * 2 + 2
  }, [chartData])

  const chartHeight = 220
  const barWidth = period === 'week' ? 40 : Math.max(12, 600 / chartData.length - 2)
  const gap = period === 'week' ? 20 : Math.max(2, 600 / chartData.length - barWidth)

  return (
    <div className="relative" style={{ padding: '16px 0 0' }}>
      <div className="flex items-end gap-0 justify-center" style={{ height: chartHeight + 40 }}>
        {chartData.map((item, index) => {
          const barHeight = (item.value / maxValue) * chartHeight
          return (
            <div
              key={index}
              className="flex flex-col items-center relative"
              style={{ width: barWidth + gap, flexShrink: 0 }}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {item.value > 0 && (
                <span
                  className="text-xs font-medium mb-1"
                  style={{ color: '#1976d2', fontSize: 12 }}
                >
                  {item.value}
                </span>
              )}
              <div
                className="w-full rounded-t-md transition-all duration-200 cursor-pointer"
                style={{
                  height: Math.max(barHeight, 2),
                  background: 'linear-gradient(to bottom, #42a5f5, #1e88e5)',
                  width: barWidth,
                  opacity: hoveredIndex === index ? 0.85 : 1,
                }}
              />
              <span
                className="text-xs mt-2 whitespace-nowrap"
                style={{ color: '#666', fontSize: period === 'month' ? 10 : 12 }}
              >
                {item.label}
              </span>
              {hoveredIndex === index && item.value > 0 && (
                <div
                  className="chart-tooltip absolute px-3 py-1.5 rounded text-xs whitespace-nowrap z-10 pointer-events-none"
                  style={{
                    backgroundColor: '#333',
                    color: '#fff',
                    borderRadius: 4,
                    bottom: chartHeight + 30,
                    left: '50%',
                    transform: 'translateX(-50%)',
                  }}
                >
                  {item.date}：{item.value}小时
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
