import { useState, useRef, useEffect } from 'react'
import { Cloud, CloudRain, Sun, CloudLightning, Snowflake, ChevronDown } from 'lucide-react'
import type { WeatherForecast, WeatherIcon } from '@/types'

interface WeatherWidgetProps {
  forecasts: WeatherForecast[]
  activityDate?: string
}

const weatherIcons: Record<WeatherIcon, React.ReactNode> = {
  sunny: <Sun size={18} className="text-yellow-500" />,
  cloudy: <Cloud size={18} className="text-gray-400" />,
  rainy: <CloudRain size={18} className="text-blue-500" />,
  stormy: <CloudLightning size={18} className="text-purple-500" />,
  snowy: <Snowflake size={18} className="text-cyan-400" />,
}

const weatherLabels: Record<WeatherIcon, string> = {
  sunny: '晴',
  cloudy: '多云',
  rainy: '雨',
  stormy: '暴风雨',
  snowy: '雪',
}

export default function WeatherWidget({ forecasts, activityDate }: WeatherWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const hasRain = forecasts.some((f) => f.icon === 'rainy' || f.icon === 'stormy')
  const todayForecast = activityDate
    ? forecasts.find((f) => f.date === activityDate)
    : forecasts[0]

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors
          ${hasRain ? 'bg-blue-500/20 text-blue-300' : 'hover:bg-white/10 text-white/80'}`}
      >
        {todayForecast ? weatherIcons[todayForecast.icon] : <Cloud size={18} />}
        <ChevronDown
          size={14}
          className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-surface-card rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-fade-in">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-text-primary">未来三天天气预报</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {forecasts.map((forecast) => {
              const isHighPrecipitation = forecast.precipitation > 70
              const isActivityDay = forecast.date === activityDate
              return (
                <div
                  key={forecast.date}
                  className={`flex items-center gap-3 px-4 py-3 transition-colors
                    ${isHighPrecipitation ? 'animate-blink-border border-2' : ''}
                    ${isActivityDay ? 'bg-forest-50' : ''}`}
                  style={isHighPrecipitation ? { borderColor: 'rgba(59, 130, 246, 0.3)' } : undefined}
                >
                  <div className="shrink-0">{weatherIcons[forecast.icon]}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-text-primary">
                        {forecast.date}
                      </span>
                      {isActivityDay && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-forest text-white rounded">
                          活动日
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-text-secondary">
                      {weatherLabels[forecast.icon]}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-text-primary">
                      {forecast.tempLow}° ~ {forecast.tempHigh}°
                    </div>
                    <div className={`text-xs ${isHighPrecipitation ? 'text-blue-500 font-medium' : 'text-text-secondary'}`}>
                      降水 {forecast.precipitation}%
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
