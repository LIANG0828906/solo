import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Edit } from 'lucide-react'
import ChartRenderer from '../components/ChartRenderer'
import { useDashboardStore } from '../data/DataStore'

export default function DashboardPreview() {
  const navigate = useNavigate()
  const chartConfigs = useDashboardStore(state => state.chartConfigs)
  const chartData = useDashboardStore(state => state.chartData)
  const lastUpdateTime = useDashboardStore(state => state.lastUpdateTime)
  const startDataRefresh = useDashboardStore(state => state.startDataRefresh)
  const stopDataRefresh = useDashboardStore(state => state.stopDataRefresh)
  const updateLastUpdateTime = useDashboardStore(state => state.updateLastUpdateTime)

  const [currentTime, setCurrentTime] = useState(lastUpdateTime)

  useEffect(() => {
    if (chartConfigs.length === 0) {
      navigate('/editor')
      return
    }

    startDataRefresh()

    const timeTimer = window.setInterval(() => {
      updateLastUpdateTime()
    }, 1000)

    return () => {
      window.clearInterval(timeTimer)
      stopDataRefresh()
    }
  }, [chartConfigs.length, navigate, startDataRefresh, stopDataRefresh, updateLastUpdateTime])

  useEffect(() => {
    setCurrentTime(lastUpdateTime)
  }, [lastUpdateTime])

  const handleBackToEditor = () => {
    stopDataRefresh()
    navigate('/editor')
  }

  if (chartConfigs.length === 0) {
    return null
  }

  return (
    <div className="preview-content">
      <div className="preview-navbar">
        <span className="preview-navbar-title">📊 数据仪表盘</span>
        <span className="preview-navbar-time">最后更新: {currentTime}</span>
      </div>

      <div className="preview-charts-grid">
        {chartConfigs.map(chart => {
          const data = chartData[chart.id]
          if (!data) return null

          return (
            <div key={chart.id} className="preview-chart-card">
              <div className="preview-chart-body">
                <ChartRenderer
                  type={chart.type}
                  data={data}
                  colorTheme={chart.colorTheme}
                  height={280}
                  showLegend={true}
                />
              </div>
            </div>
          )
        })}
      </div>

      <button
        className="floating-edit-btn"
        onClick={handleBackToEditor}
        title="返回编辑器"
      >
        <Edit size={20} />
      </button>
    </div>
  )
}
