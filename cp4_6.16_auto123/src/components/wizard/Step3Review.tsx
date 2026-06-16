import React, { useMemo } from 'react'
import { WeatherData, getWeatherTypeAdvice } from '../../utils/weatherMock'
import { LuggageItem, categoryIcons } from '../../utils/templateEngine'

interface Step3ReviewProps {
  destination: string
  startDate: string
  endDate: string
  weather: WeatherData | null
  luggageItems: LuggageItem[]
  templateName: string
}

const Step3Review: React.FC<Step3ReviewProps> = React.memo(({
  destination,
  startDate,
  endDate,
  weather,
  luggageItems,
  templateName
}) => {
  const weatherAdvice = useMemo(() => {
    if (!weather) return []
    return getWeatherTypeAdvice(weather.type)
  }, [weather])

  const totalItems = useMemo(() => {
    return luggageItems.reduce((sum, item) => sum + item.quantity, 0)
  }, [luggageItems])

  const totalWeight = useMemo(() => {
    return luggageItems.reduce((sum, item) => sum + (item.weight || 0), 0)
  }, [luggageItems])

  const tripDays = useMemo(() => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
    return diffDays
  }, [startDate, endDate])

  const categorySummary = useMemo(() => {
    const summary: Record<string, { count: number; icon: string }> = {}
    luggageItems.forEach(item => {
      if (!summary[item.category]) {
        summary[item.category] = {
          count: 0,
          icon: categoryIcons[item.category] || '📦'
        }
      }
      summary[item.category].count += item.quantity
    })
    return summary
  }, [luggageItems])

  const weatherIcon = useMemo(() => {
    if (!weather) return '🌤️'
    const icons: Record<string, string> = {
      '晴': '☀️',
      '多云': '⛅',
      '阴': '☁️',
      '小雨': '🌧️',
      '中雨': '🌧️',
      '阵雨': '🌦️',
      '小雪': '🌨️',
      '酷热': '🔥',
      '寒冷': '❄️',
      '樱花盛开': '🌸'
    }
    return icons[weather.condition] || '🌤️'
  }, [weather])

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">确认你的旅行计划</h2>
        <p className="text-[var(--text-secondary)]">检查以下信息，确认无误后即可创建行李清单</p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-[var(--bg-primary)] rounded-xl">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📍</span>
            <div>
              <p className="text-sm text-[var(--text-secondary)]">目的地</p>
              <p className="font-bold text-[var(--text-primary)]">{destination}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-[var(--text-secondary)]">行程</p>
            <p className="font-bold text-[var(--text-primary)]">{tripDays} 天</p>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 bg-[var(--bg-primary)] rounded-xl">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📅</span>
            <div>
              <p className="text-sm text-[var(--text-secondary)]">日期</p>
              <p className="font-bold text-[var(--text-primary)]">
                {startDate} ~ {endDate}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-[var(--text-secondary)]">模板</p>
            <p className="font-bold text-[var(--text-primary)]">{templateName}</p>
          </div>
        </div>

        {weather && (
          <div className="p-5 bg-gradient-to-br from-[var(--accent-blue)]/10 to-[var(--accent-light)]/10 rounded-xl border border-[var(--accent-blue)]/20">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="text-5xl">{weatherIcon}</div>
                <div>
                  <h3 className="font-bold text-lg text-[var(--text-primary)]">{weather.city}</h3>
                  <p className="text-3xl font-bold text-[var(--text-primary)]">{weather.temperature}°C</p>
                  <p className="text-[var(--text-secondary)]">{weather.condition} · 湿度 {weather.humidity}%</p>
                </div>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {weather.forecast.map((day) => (
                  <div key={day.day} className="text-center">
                    <p className="text-xs text-[var(--text-secondary)] mb-1">{day.day}</p>
                    <p className="text-xs font-semibold text-[var(--text-primary)]">{day.high}°/{day.low}°</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold text-[var(--text-primary)]">💡 天气建议</p>
              <ul className="space-y-1">
                {weatherAdvice.slice(0, 3).map((advice, idx) => (
                  <li key={idx} className="text-sm text-[var(--text-secondary)] flex items-start gap-2">
                    <span className="text-[var(--accent-blue)]">•</span>
                    {advice}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <div className="p-5 bg-white border-2 border-[var(--card-border)] rounded-xl">
          <h3 className="font-bold text-[var(--text-primary)] mb-4">🧳 行李清单预览</h3>
          
          <div className="grid grid-cols-4 gap-3 mb-4">
            <div className="text-center p-3 bg-[var(--bg-primary)] rounded-lg">
              <p className="text-2xl font-bold text-[var(--accent-blue)]">{totalItems}</p>
              <p className="text-xs text-[var(--text-secondary)]">总物品数</p>
            </div>
            <div className="text-center p-3 bg-[var(--bg-primary)] rounded-lg">
              <p className="text-2xl font-bold text-[var(--accent-blue)]">{totalWeight.toFixed(1)}</p>
              <p className="text-xs text-[var(--text-secondary)]">预估重量(kg)</p>
            </div>
            <div className="text-center p-3 bg-[var(--bg-primary)] rounded-lg">
              <p className="text-2xl font-bold text-[var(--accent-blue)]">{Object.keys(categorySummary).length}</p>
              <p className="text-xs text-[var(--text-secondary)]">分类数</p>
            </div>
            <div className="text-center p-3 bg-[var(--bg-primary)] rounded-lg">
              <p className="text-2xl font-bold text-[var(--accent-blue)]">{luggageItems.length}</p>
              <p className="text-xs text-[var(--text-secondary)]">物品种类</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {Object.entries(categorySummary).slice(0, 6).map(([category, data]) => (
              <span
                key={category}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--bg-primary)] rounded-lg text-sm"
              >
                <span>{data.icon}</span>
                <span className="text-[var(--text-primary)] font-medium">{category}</span>
                <span className="text-[var(--text-secondary)]">×{data.count}</span>
              </span>
            ))}
            {Object.keys(categorySummary).length > 6 && (
              <span className="px-3 py-1.5 text-sm text-[var(--text-secondary)]">
                +{Object.keys(categorySummary).length - 6} 更多分类
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
})

Step3Review.displayName = 'Step3Review'

export default Step3Review
