import { useState, useEffect } from 'react'
import '../styles/progressChart.css'

interface WeekDay {
  date: string
  duration: number
}

interface MonthDay {
  date: string
  exercises: number
}

interface WeeklyStats {
  workoutsThisWeek: number
  weekDays: WeekDay[]
}

function ProgressChart() {
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats | null>(null)
  const [monthlyStats, setMonthlyStats] = useState<MonthDay[]>([])
  const [loading, setLoading] = useState(true)
  const [hoveredDay, setHoveredDay] = useState<number | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const [weeklyRes, monthlyRes] = await Promise.all([
        fetch('/api/stats/weekly'),
        fetch('/api/stats/monthly'),
      ])
      const weeklyData = await weeklyRes.json()
      const monthlyData = await monthlyRes.json()
      setWeeklyStats(weeklyData)
      setMonthlyStats(monthlyData)
    } catch (error) {
      console.error('获取统计数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const getHeatColor = (duration: number) => {
    if (duration === 0) return 'rgba(255, 255, 255, 0.1)'
    if (duration <= 30) return '#81C784'
    if (duration <= 60) return '#4CAF50'
    if (duration <= 90) return '#388E3C'
    return '#1B5E20'
  }

  const getDayName = (dateStr: string) => {
    const days = ['日', '一', '二', '三', '四', '五', '六']
    const date = new Date(dateStr)
    return days[date.getDay()]
  }

  const maxExercises = Math.max(...monthlyStats.map((d) => d.exercises), 1)

  const handleBarHover = (index: number, e: React.MouseEvent) => {
    setHoveredDay(index)
    setTooltipPosition({ x: e.clientX, y: e.clientY })
  }

  const handleBarLeave = () => {
    setHoveredDay(null)
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    )
  }

  return (
    <div className="progress-chart">
      <div className="page-header">
        <h1>训练统计</h1>
      </div>

      <div className="stats-overview">
        <div className="stat-card">
          <div className="stat-card-icon">🔥</div>
          <div className="stat-card-info">
            <span className="stat-card-value">
              {weeklyStats?.workoutsThisWeek || 0}
            </span>
            <span className="stat-card-label">本周训练天数</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon">⚡</div>
          <div className="stat-card-info">
            <span className="stat-card-value">
              {weeklyStats?.weekDays.reduce((sum, d) => sum + d.duration, 0) || 0}
            </span>
            <span className="stat-card-label">本周总时长(分钟)</span>
          </div>
        </div>
      </div>

      <div className="chart-section">
        <h2>本周训练日历</h2>
        <div className="calendar-heatmap">
          {weeklyStats?.weekDays.map((day, index) => (
            <div key={index} className="calendar-day">
              <span className="day-label">{getDayName(day.date)}</span>
              <div
                className="heat-cell"
                style={{ backgroundColor: getHeatColor(day.duration) }}
              >
                <span className="heat-value">
                  {day.duration > 0 ? `${day.duration}分` : '-'}
                </span>
              </div>
              <span className="day-date">
                {new Date(day.date).getDate()}
              </span>
            </div>
          ))}
        </div>
        <div className="legend">
          <span>少</span>
          <div className="legend-colors">
            <div className="legend-color" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }} />
            <div className="legend-color" style={{ backgroundColor: '#81C784' }} />
            <div className="legend-color" style={{ backgroundColor: '#4CAF50' }} />
            <div className="legend-color" style={{ backgroundColor: '#388E3C' }} />
            <div className="legend-color" style={{ backgroundColor: '#1B5E20' }} />
          </div>
          <span>多</span>
        </div>
      </div>

      <div className="chart-section">
        <h2>过去30天训练量</h2>
        <div className="bar-chart-container">
          <div className="bar-chart">
            {monthlyStats.map((day, index) => {
              const height = (day.exercises / maxExercises) * 100
              return (
                <div
                  key={index}
                  className="bar-wrapper"
                  onMouseEnter={(e) => handleBarHover(index, e)}
                  onMouseLeave={handleBarLeave}
                >
                  <div
                    className="bar"
                    style={{
                      height: `${height}%`,
                      animationDelay: `${index * 20}ms`,
                    }}
                  />
                </div>
              )
            })}
          </div>
          <div className="chart-labels">
            <span>30天前</span>
            <span>今天</span>
          </div>
        </div>
      </div>

      {hoveredDay !== null && monthlyStats[hoveredDay] && (
        <div
          className="tooltip"
          style={{
            left: tooltipPosition.x,
            top: tooltipPosition.y - 60,
          }}
        >
          <div className="tooltip-date">
            {monthlyStats[hoveredDay].date}
          </div>
          <div className="tooltip-value">
            {monthlyStats[hoveredDay].exercises} 个动作
          </div>
        </div>
      )}
    </div>
  )
}

export default ProgressChart
