import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts'
import axios from 'axios'

interface CheckinRecord {
  id: number
  participant_name: string
  timestamp: string
  x: number
  y: number
  checkin_number: number
}

interface EventStats {
  event: {
    id: string
    name: string
    date: string
    location: string
    created_at: string
  }
  total_checkins: number
  checkins_over_time: { time: string; count: number; cumulative: number }[]
  checkins: CheckinRecord[]
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const pollRef = useRef<number>(0)
  const heatmapRef = useRef<HTMLDivElement>(null)

  const [stats, setStats] = useState<EventStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tooltip, setTooltip] = useState<{ x: number; y: number; data: CheckinRecord } | null>(null)

  const fetchStats = async () => {
    try {
      const response = await axios.get(`/api/events/${id}/stats`)
      setStats(response.data)
      setError(null)
    } catch (e: any) {
      setError(e.response?.data?.detail || '获取数据失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
    pollRef.current = window.setInterval(fetchStats, 2000)
    return () => window.clearInterval(pollRef.current)
  }, [id])

  const gradientId = 'lineGradient'
  const areaGradientId = 'areaGradient'

  const heatmapData = useMemo(() => {
    if (!stats) return []
    return stats.checkins
  }, [stats])

  const exportCSV = () => {
    if (!stats) return
    const headers = ['序号', '参与者姓名', '签到时间', '位置坐标 X', '位置坐标 Y', '签到顺序号']
    const rows = stats.checkins.map((c, idx) => [
      idx + 1,
      c.participant_name,
      new Date(c.timestamp).toLocaleString('zh-CN'),
      c.x.toFixed(2),
      c.y.toFixed(2),
      c.checkin_number,
    ])
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n')
    const BOM = '\uFEFF'
    const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `event-${id}-checkins.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const handlePointHover = (e: React.MouseEvent, data: CheckinRecord) => {
    if (!heatmapRef.current) return
    const rect = heatmapRef.current.getBoundingClientRect()
    setTooltip({
      x: e.clientX - rect.left + 10,
      y: e.clientY - rect.top - 10,
      data,
    })
  }

  const getHeatColor = (density: number) => {
    if (density < 0.2) return '#3b82f6'
    if (density < 0.4) return '#06b6d4'
    if (density < 0.6) return '#22c55e'
    if (density < 0.8) return '#f59e0b'
    return '#ef4444'
  }

  const calculateDensity = (checkin: CheckinRecord) => {
    if (!stats || stats.checkins.length < 2) return 0.5
    const threshold = 15
    let nearbyCount = 0
    for (const other of stats.checkins) {
      if (other.id === checkin.id) continue
      const dist = Math.sqrt(Math.pow(checkin.x - other.x, 2) + Math.pow(checkin.y - other.y, 2))
      if (dist < threshold) nearbyCount++
    }
    return Math.min(nearbyCount / 10, 1)
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: 'rgba(15, 23, 42, 0.95)',
          border: '1px solid #334155',
          borderRadius: '8px',
          padding: '12px 16px',
          color: '#f1f5f9',
          fontSize: '13px',
        }}>
          <div style={{ color: '#94a3b8', marginBottom: '6px', fontSize: '12px' }}>时间: {label}</div>
          <div style={{ color: '#a5b4fc' }}>
            <strong>{payload[0].value}</strong> 人已签到
          </div>
          {payload[1] && (
            <div style={{ color: '#22d3ee', marginTop: '4px', fontSize: '12px' }}>
              新增: {payload[1].value} 人
            </div>
          )}
        </div>
      )
    }
    return null
  }

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="loading" style={{ height: '100vh' }}>
          <div style={{ textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto 20px' }} />
            <p>正在加载仪表盘数据...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error && !stats) {
    return (
      <div className="dashboard-page">
        <div className="loading" style={{ height: '100vh' }}>
          <div style={{ textAlign: 'center', color: '#ef4444' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>❌</div>
            <p>{error}</p>
            <button
              className="btn"
              style={{ marginTop: '20px', maxWidth: '200px', margin: '20px auto 0', display: 'block' }}
              onClick={() => navigate('/')}
            >
              返回首页
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <h1>📊 {stats?.event.name || '活动仪表盘'}</h1>
          <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: '6px' }}>
            📍 {stats?.event.location} · 🕐 {stats?.event.date ? new Date(stats.event.date).toLocaleString('zh-CN') : '-'} · ID: {id}
          </p>
        </div>
        <div className="dashboard-actions">
          <button className="back-btn" onClick={() => navigate('/')}>
            ← 返回首页
          </button>
          <button className="btn" onClick={exportCSV} disabled={!stats}>
            📥 导出 CSV
          </button>
        </div>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <div className="label">👥 签到总人数</div>
          <div className="value">{stats?.total_checkins || 0}</div>
        </div>
        <div className="stat-card">
          <div className="label">📈 今日新增</div>
          <div className="value">{stats?.checkins_over_time.slice(-1)[0]?.count || 0}</div>
        </div>
        <div className="stat-card">
          <div className="label">⏱️ 最近更新</div>
          <div className="value" style={{ fontSize: '20px' }}>
            {new Date().toLocaleTimeString('zh-CN')}
          </div>
        </div>
        <div className="stat-card">
          <div className="label">🎯 活动状态</div>
          <div className="value" style={{ fontSize: '20px', color: '#22c55e' }}>
            ● 实时更新中
          </div>
        </div>
      </div>

      <div className="charts-container">
        <div className="chart-card">
          <h3>📈 签到人数随时间变化</h3>
          <div className="chart-content">
            {stats && stats.checkins_over_time.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.checkins_over_time} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id={areaGradientId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#a5b4fc" stopOpacity={0.1} />
                    </linearGradient>
                    <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#4f46e5" />
                      <stop offset="100%" stopColor="#a5b4fc" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.15)" />
                  <XAxis
                    dataKey="time"
                    stroke="#94a3b8"
                    tick={{ fill: '#ffffff', fontSize: 11 }}
                    tickLine={{ stroke: '#475569' }}
                    axisLine={{ stroke: '#475569' }}
                    angle={-30}
                    textAnchor="end"
                    height={60}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    stroke="#94a3b8"
                    tick={{ fill: '#ffffff', fontSize: 11 }}
                    tickLine={{ stroke: '#475569' }}
                    axisLine={{ stroke: '#475569' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="cumulative"
                    stroke={`url(#${gradientId})`}
                    strokeWidth={3}
                    fill={`url(#${areaGradientId})`}
                    dot={{ r: 3, fill: '#6366f1', stroke: '#fff', strokeWidth: 1 }}
                    activeDot={{ r: 6, fill: '#8b5cf6', stroke: '#fff', strokeWidth: 2 }}
                    name="累计签到"
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#22d3ee"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                    name="时段新增"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="loading">
                <div style={{ textAlign: 'center', color: '#64748b' }}>
                  <div style={{ fontSize: '48px', marginBottom: '12px' }}>⏳</div>
                  <p>暂无签到数据</p>
                  <p style={{ fontSize: '12px', marginTop: '8px' }}>等待参与者扫码签到...</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="chart-card">
          <h3>🔥 参与者位置热力图</h3>
          <div className="chart-content">
            <div
              className="heatmap-container"
              ref={heatmapRef}
              onMouseLeave={() => setTooltip(null)}
              style={{
                background: `
                  radial-gradient(circle at 20% 30%, rgba(59, 130, 246, 0.08) 0%, transparent 40%),
                  radial-gradient(circle at 70% 70%, rgba(239, 68, 68, 0.08) 0%, transparent 40%),
                  radial-gradient(circle at 50% 50%, rgba(34, 197, 94, 0.05) 0%, transparent 50%),
                  #0f172a
                `,
                border: '1px solid #334155',
              }}
            >
              <div className="location-label" style={{ top: '8px', left: '12px' }}>
                入口 ↙
              </div>
              <div className="location-label" style={{ top: '8px', right: '12px' }}>
                主舞台 →
              </div>
              <div className="location-label" style={{ bottom: '8px', left: '50%', transform: 'translateX(-50%)' }}>
                出口
              </div>

              <svg
                width="100%"
                height="100%"
                style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
              >
                {heatmapData.map((point) => {
                  const density = calculateDensity(point)
                  return (
                    <circle
                      key={`halo-${point.id}`}
                      cx={point.x}
                      cy={point.y}
                      r={8 + density * 12}
                      fill={getHeatColor(density)}
                      opacity={0.15 + density * 0.25}
                    />
                  )
                })}
              </svg>

              {heatmapData.map((point) => {
                const density = calculateDensity(point)
                return (
                  <div
                    key={point.id}
                    onMouseEnter={(e) => handlePointHover(e, point)}
                    onMouseMove={(e) => handlePointHover(e, point)}
                    style={{
                      position: 'absolute',
                      left: `${point.x}%`,
                      top: `${point.y}%`,
                      width: `${12 + density * 10}px`,
                      height: `${12 + density * 10}px`,
                      marginLeft: `${-(6 + density * 5)}px`,
                      marginTop: `${-(6 + density * 5)}px`,
                      borderRadius: '50%',
                      background: getHeatColor(density),
                      boxShadow: `0 0 ${8 + density * 16}px ${getHeatColor(density)}`,
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      border: '2px solid rgba(255,255,255,0.3)',
                      zIndex: Math.floor(density * 10),
                    }}
                  >
                    <span
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        fontSize: '10px',
                        fontWeight: 700,
                        color: density > 0.5 ? '#0f172a' : '#fff',
                      }}
                    >
                      {point.checkin_number}
                    </span>
                  </div>
                )
              })}

              {heatmapData.length === 0 && (
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  textAlign: 'center',
                  color: '#64748b',
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '12px' }}>📍</div>
                  <p>暂无位置数据</p>
                  <p style={{ fontSize: '12px', marginTop: '8px' }}>
                    参与者签到后将在此显示位置分布
                  </p>
                </div>
              )}

              {tooltip && (
                <div
                  className="heatmap-tooltip"
                  style={{
                    left: `${tooltip.x}px`,
                    top: `${tooltip.y}px`,
                    transform: 'translateY(-100%)',
                  }}
                >
                  <div className="name">#{tooltip.data.checkin_number} {tooltip.data.participant_name}</div>
                  <div className="detail">
                    🕐 {new Date(tooltip.data.timestamp).toLocaleTimeString('zh-CN')}
                  </div>
                  <div className="detail">
                    📍 坐标 ({tooltip.data.x.toFixed(1)}, {tooltip.data.y.toFixed(1)})
                  </div>
                </div>
              )}

              <div style={{
                position: 'absolute',
                bottom: '12px',
                right: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(15, 23, 42, 0.8)',
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: '11px',
              }}>
                <span style={{ color: '#94a3b8' }}>聚集度:</span>
                <div style={{
                  width: '120px',
                  height: '8px',
                  borderRadius: '4px',
                  background: 'linear-gradient(90deg, #3b82f6, #06b6d4, #22c55e, #f59e0b, #ef4444)',
                }} />
                <span style={{ color: '#94a3b8' }}>高</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
