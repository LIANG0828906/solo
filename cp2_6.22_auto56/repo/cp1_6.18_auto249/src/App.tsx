import { useMemo } from 'react'
import ColorPicker from './components/ColorPicker'
import CalendarView from './components/CalendarView'
import DayDetail from './components/DayDetail'
import { useColorStore, formatDate } from './store/colorStore'

interface TopColor {
  color: string
  count: number
}

export default function App() {
  const { records } = useColorStore()

  const stats = useMemo(() => {
    const totalDays = records.length

    let streakDays = 0
    if (records.length > 0) {
      const dateSet = new Set(records.map(r => r.date))
      const today = new Date()
      const todayStr = formatDate(today)

      if (dateSet.has(todayStr)) {
        let current = new Date(today)
        while (dateSet.has(formatDate(current))) {
          streakDays++
          current.setDate(current.getDate() - 1)
        }
      } else {
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)
        if (dateSet.has(formatDate(yesterday))) {
          let current = new Date(yesterday)
          while (dateSet.has(formatDate(current))) {
            streakDays++
            current.setDate(current.getDate() - 1)
          }
        }
      }
    }

    const colorCounts = new Map<string, number>()
    for (const r of records) {
      colorCounts.set(r.color, (colorCounts.get(r.color) || 0) + 1)
    }
    const topColors: TopColor[] = Array.from(colorCounts.entries())
      .map(([color, count]) => ({ color, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    return { totalDays, streakDays, topColors }
  }, [records])

  return (
    <div className="app-container">
      <div className="main-content">
        <header className="app-header">
          <h1 className="app-title">🎨 调色盘日记</h1>
          <p className="app-subtitle">用色彩记录每一天的心情，让时间绽放成绚丽的画卷</p>
        </header>

        <div className="content-wrapper">
          <div className="left-panel">
            <CalendarView />
            <ColorPicker />
          </div>

          <aside className="stats-panel" aria-label="记录统计">
            <h2 className="stats-title">📈 统计面板</h2>

            <div className="stat-item">
              <div className="stat-label">总记录天数</div>
              <div className="stat-value">{stats.totalDays}</div>
            </div>

            <div className="stat-item">
              <div className="stat-label">连续记录</div>
              <div className="stat-value small">
                🔥 {stats.streakDays} 天
              </div>
            </div>

            <div className="stat-item">
              <div className="stat-label">常用颜色 TOP 5</div>
              {stats.topColors.length > 0 ? (
                <div className="top-colors-list">
                  {stats.topColors.map(({ color, count }) => (
                    <div key={color} className="top-color-item">
                      <div
                        className="color-dot"
                        style={{ backgroundColor: color }}
                      />
                      <div className="top-color-info">
                        <div className="top-color-hex">{color}</div>
                        <div className="top-color-count">使用 {count} 次</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-stats">
                  还没有记录哦~<br/>从今天开始吧！
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>

      <DayDetail />
    </div>
  )
}
