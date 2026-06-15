import { useState, useEffect } from 'react'
import { getStats } from '@/services/api'
import type { TravelStats } from '@/types'
import WorldHeatmap from '@/components/WorldHeatmap'
import YearlyBarChart from '@/components/YearlyBarChart'
import TopCitiesChart from '@/components/TopCitiesChart'

export default function StatsPage() {
  const [stats, setStats] = useState<TravelStats | null>(null)

  useEffect(() => {
    const data = getStats()
    setStats(data)
  }, [])

  if (!stats) {
    return (
      <div className="stats-page">
        <div className="stats-grid">
          <div className="card stats-card-wide">
            <div className="card-title">加载中...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="stats-page">
      <div className="stats-grid">
        <div className="card stats-card-wide">
          <h2 className="card-title">我的旅行数据</h2>
          <div className="stats-summary">
            <div className="stats-summary-item">
              <div className="stats-summary-number">{stats.totalCountries}</div>
              <div className="stats-summary-label">去过的国家</div>
            </div>
            <div className="stats-summary-item">
              <div className="stats-summary-number">{stats.totalCities}</div>
              <div className="stats-summary-label">到访的城市</div>
            </div>
            <div className="stats-summary-item">
              <div className="stats-summary-number">{stats.totalMarkers}</div>
              <div className="stats-summary-label">旅行记录</div>
            </div>
          </div>
        </div>

        <div className="card stats-card-wide">
          <h3 className="card-title">🌍 国家足迹热力图</h3>
          <div className="chart-container world-map-container">
            <WorldHeatmap countryCounts={stats.countryCounts} />
          </div>
        </div>

        <div className="card">
          <h3 className="card-title">📊 年度旅行次数</h3>
          <div className="chart-container yearly-chart-container">
            <YearlyBarChart
              data={stats.yearlyData}
              monthlyData={stats.monthlyData}
            />
          </div>
        </div>

        <div className="card">
          <h3 className="card-title">🏙️ 最常去的城市 Top 5</h3>
          <div className="chart-container top-cities-container">
            <TopCitiesChart data={stats.topCities} />
          </div>
        </div>
      </div>
    </div>
  )
}
